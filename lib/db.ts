import { Pool } from "pg";
import type { QueryConfig, QueryResult, QueryResultRow } from "pg";
import type { Relationship, Signal, WarmthTier } from "./types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Shared SELECT used by all relationship queries.
// Returns Relationship shape with nested fund, portfolioCompany, and signals.
// All callers must GROUP BY r.id, f.id, pc.id.
const REL_SELECT = `
  SELECT
    r.id,
    r.fund_id                                   AS "fundId",
    r.portfolio_company_id                       AS "portfolioCompanyId",
    r.alley_partner                              AS "alleyPartner",
    r.warmth_tier                                AS "warmthTier",
    to_char(r.last_signal_date, 'YYYY-MM-DD')   AS "lastSignalDate",
    r.override_note                              AS "overrideNote",
    json_build_object(
      'id',              f.id,
      'name',            f.name,
      'focus',           f.focus,
      'aumTier',         f.aum_tier,
      'emergingManager', f.emerging_manager,
      'website',         f.website
    ) AS fund,
    CASE WHEN pc.id IS NOT NULL THEN json_build_object(
      'id',            pc.id,
      'name',          pc.name,
      'sector',        pc.sector,
      'stage',         pc.stage,
      'alleycorpRole', pc.alley_role,
      'website',       pc.website
    ) ELSE NULL END AS "portfolioCompany",
    COALESCE(
      json_agg(
        json_build_object(
          'id',             s.id,
          'relationshipId', s.relationship_id,
          'type',           s.signal_type,
          'date',           to_char(s.signal_date, 'YYYY-MM-DD'),
          'source',         s.source,
          'value',          s.value,
          'weight',         s.weight,
          'confidence',     s.confidence
        )
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::json
    ) AS signals
  -- NOTE: DB uses singular table names (relationship, fund, portfolio_company, signal)
  FROM relationship r
  JOIN      fund f               ON f.id  = r.fund_id
  LEFT JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  LEFT JOIN signal s             ON s.relationship_id = r.id
`;

// Look up the first relationship whose fund name matches the search string.
// Returns the full relationship with fund, portfolio company, and all signals attached.
export async function getInvestorByName(name: string): Promise<Relationship | null> {
  const { rows } = await pool.query(
    `${REL_SELECT}
     WHERE f.name ILIKE $1
     GROUP BY r.id, f.id, pc.id
     LIMIT 1`,
    [`%${name}%`]
  );
  return (rows[0] as Relationship) ?? null;
}

// Search relationships by fund name, fund focus, portfolio company name, sector, or warmth tier.
// Signals are not loaded here — callers only need the count (r.signals?.length).
export async function searchRelationships(query: string): Promise<Relationship[]> {
  const param = `%${query}%`;
  const { rows } = await pool.query(
    `${REL_SELECT}
     WHERE f.name        ILIKE $1
        OR pc.name       ILIKE $1
        OR r.warmth_tier ILIKE $1
        OR f.focus       ILIKE $1
     GROUP BY r.id, f.id, pc.id
     ORDER BY
       CASE r.warmth_tier
         WHEN 'Hot'   THEN 1
         WHEN 'Warm'  THEN 2
         WHEN 'Stale' THEN 3
         WHEN 'Cold'  THEN 4
         ELSE 5
       END,
       f.name`,
    [param]
  );
  return rows as Relationship[];
}

// Return all relationships with their signals, ordered by warmth tier then last signal date.
// Used by GET /api/investors to power the dashboard list view.
export async function getAllRelationships(): Promise<Relationship[]> {
  const { rows } = await pool.query(
    `${REL_SELECT}
     GROUP BY r.id, f.id, pc.id
     ORDER BY
       CASE r.warmth_tier WHEN 'hot' THEN 1 WHEN 'warm' THEN 2 WHEN 'stale' THEN 3 WHEN 'cold' THEN 4 END,
       r.last_signal_date DESC NULLS LAST`
  );
  return rows as Relationship[];
}

// Return all stale relationships ordered oldest signal first (most at-risk first).
export async function listStaleRelationships(): Promise<Relationship[]> {
  const { rows } = await pool.query(
    `${REL_SELECT}
     WHERE r.warmth_tier = 'stale'
     GROUP BY r.id, f.id, pc.id
     ORDER BY r.last_signal_date ASC NULLS LAST`
  );
  return rows as Relationship[];
}

// Return all signals for a given relationship id, newest first.
// The parameter is named investorId to match the MCP tool surface but resolves
// against relationship.id — the MCP tool description clarifies this is a relationship record id.
export async function getWarmthSignals(investorId: string): Promise<Signal[]> {
  const { rows } = await pool.query(
    `SELECT
       id,
       relationship_id                      AS "relationshipId",
       signal_type                          AS type,
       to_char(signal_date, 'YYYY-MM-DD')   AS date,
       source,
       value,
       weight,
       confidence
     FROM signal
     WHERE relationship_id = $1
     ORDER BY signal_date DESC`,
    [investorId]
  );
  return rows as Signal[];
}

export async function getRecentSignals(limit = 20): Promise<Signal[]> {
  const { rows } = await pool.query(
    `SELECT
       id,
       relationship_id                      AS "relationshipId",
       signal_type                          AS type,
       to_char(signal_date, 'YYYY-MM-DD')   AS date,
       source,
       value,
       weight,
       confidence
     FROM signal
     ORDER BY signal_date DESC
     LIMIT $1`,
    [limit]
  );
  return rows as Signal[];
}

export { pool };
