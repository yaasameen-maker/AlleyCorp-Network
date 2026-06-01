import { Pool } from "pg";
import type { Relationship, Signal, WarmthTier } from "./types";

// Lazy pool — created on first use so that DATABASE_URL is read after dotenv runs.
let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}
// Keep a named export for callers that import `pool` directly (e.g. migration scripts).
const pool = { query: (...args: Parameters<Pool["query"]>) => getPool().query(...args) };

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

// DB stores warmth_tier in lowercase ('hot', 'warm', 'stale', 'cold').
// TypeScript WarmthTier uses Title Case ("Hot", "Warm", "Stale", "Cold").
function toWarmthTier(raw: string): WarmthTier {
  return (raw.charAt(0).toUpperCase() + raw.slice(1)) as WarmthTier;
}

// Map a DB signal row → Signal type.
function toSignal(row: Record<string, unknown>): Signal {
  return {
    id: row.id as string,
    relationshipId: row.relationship_id as string,
    type: row.signal_type as Signal["type"],
    date: row.signal_date instanceof Date
      ? row.signal_date.toISOString().slice(0, 10)
      : String(row.signal_date).slice(0, 10),
    source: row.source as string,
    value: (row.value ?? "") as string,
    weight: row.weight as Signal["weight"],
    confidence: row.confidence ? (row.confidence as Signal["confidence"]) : undefined,
  };
}

// Shared SELECT for all relationship queries — joins fund and portfolio_company.
const RELATIONSHIP_SELECT = `
  SELECT
    r.id,
    r.fund_id                AS "fundId",
    r.investor_id            AS "investorId",
    r.portfolio_company_id   AS "portfolioCompanyId",
    r.alley_partner          AS "alleyPartner",
    r.warmth_tier            AS "warmthTier",
    r.warmth_calculated_at   AS "warmthCalculatedAt",
    r.last_signal_date       AS "lastSignalDate",
    r.override               AS "override",
    r.override_note          AS "overrideNote",
    r.override_by            AS "overrideBy",
    r.override_at            AS "overrideAt",
    f.id                     AS "f_id",
    f.name                   AS "f_name",
    f.focus                  AS "f_focus",
    f.aum_tier               AS "f_aumTier",
    f.emerging_manager       AS "f_emergingManager",
    f.website                AS "f_website",
    pc.id                    AS "pc_id",
    pc.name                  AS "pc_name",
    pc.sector                AS "pc_sector",
    pc.stage                 AS "pc_stage",
    pc.alley_role            AS "pc_alleyRole",
    pc.status                AS "pc_status",
    pc.team                  AS "pc_team",
    pc.website               AS "pc_website"
  FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
`;

function toRelationship(row: Record<string, unknown>, signals: Signal[] = []): Relationship {
  return {
    id: row.id as string,
    fundId: row.fundId as string,
    investorId: row.investorId ? (row.investorId as string) : undefined,
    portfolioCompanyId: row.portfolioCompanyId as string,
    alleyPartner: (row.alleyPartner ?? "") as string,
    warmthTier: toWarmthTier(row.warmthTier as string),
    warmthCalculatedAt: row.warmthCalculatedAt ? String(row.warmthCalculatedAt) : undefined,
    lastSignalDate: row.lastSignalDate
      ? (row.lastSignalDate instanceof Date
          ? row.lastSignalDate.toISOString().slice(0, 10)
          : String(row.lastSignalDate).slice(0, 10))
      : undefined,
    override: row.override != null ? (row.override as boolean) : undefined,
    overrideNote: row.overrideNote ? (row.overrideNote as string) : undefined,
    overrideBy: row.overrideBy ? (row.overrideBy as string) : undefined,
    overrideAt: row.overrideAt ? String(row.overrideAt) : undefined,
    fund: {
      id: row.f_id as string,
      name: row.f_name as string,
      focus: row.f_focus ? (row.f_focus as string) : undefined,
      aumTier: row.f_aumTier ? (row.f_aumTier as string) : undefined,
      emergingManager: row.f_emergingManager != null ? (row.f_emergingManager as boolean) : undefined,
      website: row.f_website ? (row.f_website as string) : undefined,
    },
    portfolioCompany: {
      id: row.pc_id as string,
      name: row.pc_name as string,
      sector: (row.pc_sector ?? "") as string,
      stage: (row.pc_stage ?? "") as string,
      alleycorpRole: (row.pc_alleyRole ?? "") as string,
      status: (row.pc_status ?? "active") as "active" | "alumni",
      website: row.pc_website ? (row.pc_website as string) : undefined,
      team: row.pc_team ? (row.pc_team as string) : undefined,
    },
    signals,
  };
}

// ─────────────────────────────────────────
// Queries
// ─────────────────────────────────────────

// Look up the first relationship whose fund name matches the search string.
// Returns the full relationship with fund, portfolio company, and all signals attached.
export async function getInvestorByName(name: string): Promise<Relationship | null> {
  const { rows } = await pool.query(
    `${RELATIONSHIP_SELECT} WHERE f.name ILIKE $1 LIMIT 1`,
    [`%${name}%`]
  );

  if (rows.length === 0) return null;

  const { rows: signalRows } = await pool.query(
    `SELECT * FROM signal WHERE relationship_id = $1 ORDER BY signal_date DESC`,
    [rows[0].id]
  );

  return toRelationship(rows[0], signalRows.map(toSignal));
}

// Search relationships by fund name, fund focus, portfolio company name, sector, or warmth tier.
// Signals are not loaded here — callers only need the count (r.signals?.length).
export async function searchRelationships(query: string): Promise<Relationship[]> {
  const term = `%${query}%`;
  const { rows } = await pool.query(
    `${RELATIONSHIP_SELECT}
     WHERE f.name ILIKE $1
        OR f.focus ILIKE $1
        OR pc.name ILIKE $1
        OR pc.sector ILIKE $1
        OR r.warmth_tier ILIKE $1
     ORDER BY r.last_signal_date DESC NULLS LAST`,
    [term]
  );

  return rows.map((row) => toRelationship(row));
}

// Return all stale relationships ordered oldest signal first (most at-risk first).
export async function listStaleRelationships(): Promise<Relationship[]> {
  const { rows } = await pool.query(
    `${RELATIONSHIP_SELECT}
     WHERE r.warmth_tier = 'stale'
     ORDER BY r.last_signal_date ASC NULLS FIRST`
  );

  return rows.map((row) => toRelationship(row));
}

// Return all signals for a given relationship id, newest first.
// The parameter is named investorId to match the MCP tool surface but resolves
// against relationship.id — the MCP tool description clarifies this is a relationship record id.
export async function getWarmthSignals(investorId: string): Promise<Signal[]> {
  const { rows } = await pool.query(
    `SELECT * FROM signal WHERE relationship_id = $1 ORDER BY signal_date DESC`,
    [investorId]
  );

  return rows.map(toSignal);
}

export { pool };
