import { Pool } from "pg";
import { config } from "dotenv";
import type { Relationship, Signal } from "./types";
import { isMockMode } from "./mock/mode";
import {
  getAllRelationshipsMock,
  getInvestorByNameMock,
  searchRelationshipsMock,
  listStaleRelationshipsMock,
  getWarmthSignalsMock,
  getRecentSignalsMock,
} from "./mock/repository";

config();

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
    r.discovery_source                           AS "discoverySource",
    r.discovery_context                          AS "discoveryContext",
    json_build_object(
      'id',              f.id,
      'name',            f.name,
      'focus',           f.focus,
      'aumTier',         f.aum_tier,
      'emergingManager', f.emerging_manager,
      'website',         f.website,
      'logoUrl',         f.logo_url,
      'stage',           f.stage,
      'hqLocation',      f.hq_location,
      'geographyFocus',  f.geography_focus,
      'checkSizeProxy',  f.check_size_proxy,
      'deepTechSignal',  f.deep_tech_signal,
      'investorStatus',  f.investor_status,
      'isVip',           f.is_vip,
      'profileLastCheckedAt', to_char(f.profile_last_checked_at, 'YYYY-MM-DD')
    ) AS fund,
    (
      SELECT json_build_object(
        'id',          i.id,
        'name',        i.name,
        'role',        i.role,
        'linkedinUrl', i.linkedin_url
      )
      FROM investor i
      WHERE i.fund_id = f.id
      ORDER BY i.created_at
      LIMIT 1
    ) AS investor,
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
          'sourceUrl',      s.source_url,
          'sourceTitle',    s.source_title,
          'rawSnippet',     s.raw_snippet,
          'uniqueHash',     s.unique_hash,
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
  if (isMockMode()) return getInvestorByNameMock(name);
  const { rows } = await pool.query(
    `${REL_SELECT}
     WHERE f.name ILIKE $1
     GROUP BY r.id, f.id, pc.id
     LIMIT 1`,
    [`%${name}%`]
  );
  return (rows[0] as Relationship) ?? null;
}

function isProspectSearch(query: string): boolean {
  const normalized = query.toLowerCase();
  return (
    normalized.includes("haven't co-invested") ||
    normalized.includes("have not co-invested") ||
    normalized.includes("no co-investment") ||
    normalized.includes("not co-invested") ||
    normalized.includes("haven't worked with") ||
    normalized.includes("prospect") ||
    normalized.includes("market") ||
    normalized.includes("target")
  );
}

function isWarmRelationshipSearch(query: string): boolean {
  const normalized = query.toLowerCase();
  return (
    normalized.includes("warmest") ||
    normalized.includes("strongest") ||
    normalized.includes("hottest") ||
    normalized.includes("best relationship") ||
    normalized.includes("invite") ||
    normalized.includes("event") ||
    normalized.includes("happy hour") ||
    normalized.includes("meet") ||
    normalized.includes("reconnect") ||
    (normalized.includes("deep tech") && normalized.includes("relationship"))
  );
}

// Extract a location string from the query to filter by hq_location.
// Returns null if no recognizable location is found.
function extractLocation(query: string): string | null {
  const normalized = query.toLowerCase();
  const CITIES: Record<string, string> = {
    "los angeles": "Los Angeles",
    " la ": "Los Angeles",
    " la,": "Los Angeles",
    "la-based": "Los Angeles",
    "new york": "New York",
    " nyc": "New York",
    " ny ": "New York",
    "san francisco": "San Francisco",
    " sf ": "San Francisco",
    "sf-based": "San Francisco",
    "bay area": "Bay Area",
    boston: "Boston",
    austin: "Austin",
    chicago: "Chicago",
    seattle: "Seattle",
    washington: "Washington",
    " dc ": "Washington",
    "washington dc": "Washington",
  };
  for (const [pattern, city] of Object.entries(CITIES)) {
    if (normalized.includes(pattern)) return city;
  }
  return null;
}

// Extract a stage string from the query to filter by stage focus.
function extractStage(query: string): string | null {
  const normalized = query.toLowerCase();
  if (normalized.includes("pre-seed") || normalized.includes("pre seed")) return "Pre-Seed";
  if (normalized.includes("seed")) return "Seed";
  if (normalized.includes("series a")) return "Series A";
  if (normalized.includes("series b")) return "Series B";
  if (normalized.includes("series c")) return "Series C";
  if (normalized.includes("growth")) return "Growth";
  if (normalized.includes("early stage") || normalized.includes("early-stage")) return "Seed";
  if (normalized.includes("late stage") || normalized.includes("late-stage")) return "Series B";
  return null;
}

// Search relationships by fund name, fund focus, portfolio company name, sector, warmth tier,
// or the broader market-prospect class introduced after the June 11 AlleyCorp pivot.
// Signals are not loaded here — callers only need the count (r.signals?.length).
export async function searchRelationships(query: string): Promise<Relationship[]> {
  if (isMockMode()) return searchRelationshipsMock(query);
  if (isWarmRelationshipSearch(query)) {
    const { rows } = await pool.query(
      `${REL_SELECT}
       WHERE f.focus ILIKE '%deep%'
          OR f.deep_tech_signal IS NOT NULL
       GROUP BY r.id, f.id, pc.id
       ORDER BY
         CASE r.warmth_tier
           WHEN 'hot'   THEN 1
           WHEN 'warm'  THEN 2
           WHEN 'stale' THEN 3
           WHEN 'cold'  THEN 4
           ELSE 5
         END,
         r.last_signal_date DESC NULLS LAST,
         f.name`
    );
    return rows as Relationship[];
  }

  if (isProspectSearch(query)) {
    const { rows } = await pool.query(
      `${REL_SELECT}
       WHERE r.portfolio_company_id IS NULL
          OR f.investor_status = 'market_prospect'
       GROUP BY r.id, f.id, pc.id
       ORDER BY
         COALESCE(f.is_vip, false) DESC,
         CASE r.warmth_tier
           WHEN 'hot'   THEN 1
           WHEN 'warm'  THEN 2
           WHEN 'stale' THEN 3
           WHEN 'cold'  THEN 4
           ELSE 5
         END,
         f.name`
    );
    // Also include market_prospect funds that have no relationship row at all
    const { rows: prospectRows } = await pool.query(
      `SELECT
         f.id, f.name, f.website, f.is_vip, f.investor_status,
         f.hq_location, f.aum_tier, f.stage, f.deep_tech_signal,
         f.geography_focus, f.check_size_proxy
       FROM fund f
       WHERE f.investor_status = 'market_prospect'
         AND NOT EXISTS (SELECT 1 FROM relationship r2 WHERE r2.fund_id = f.id)
       ORDER BY f.name`
    );
    const prospectRelationships = prospectRows.map((f) => ({
      id: null,
      fundId: f.id,
      fund: {
        id: f.id,
        name: f.name,
        website: f.website,
        isVip: f.is_vip,
        investorStatus: f.investor_status,
        hqLocation: f.hq_location,
        aumTier: f.aum_tier,
        stage: f.stage,
        deepTechSignal: f.deep_tech_signal,
        geographyFocus: f.geography_focus,
        checkSizeProxy: f.check_size_proxy,
      },
      warmthTier: null,
      lastSignalDate: null,
      portfolioCompanyId: null,
      portfolioCompany: null,
      signals: [],
    }));
    return [...(rows as Relationship[]), ...prospectRelationships] as Relationship[];
  }

  const location = extractLocation(query);
  if (location) {
    const { rows } = await pool.query(
      `${REL_SELECT}
       WHERE f.hq_location ILIKE $1
          OR f.geography_focus ILIKE $1
       GROUP BY r.id, f.id, pc.id
       ORDER BY
         CASE r.warmth_tier
           WHEN 'hot'   THEN 1
           WHEN 'warm'  THEN 2
           WHEN 'stale' THEN 3
           WHEN 'cold'  THEN 4
           ELSE 5
         END,
         f.name`,
      [`%${location}%`]
    );
    return rows as Relationship[];
  }

  const stage = extractStage(query);
  if (stage) {
    const { rows } = await pool.query(
      `${REL_SELECT}
       WHERE f.stage ILIKE $1
          OR f.check_size_proxy IS NOT NULL
       GROUP BY r.id, f.id, pc.id
       ORDER BY
         CASE r.warmth_tier
           WHEN 'hot'   THEN 1
           WHEN 'warm'  THEN 2
           WHEN 'stale' THEN 3
           WHEN 'cold'  THEN 4
           ELSE 5
         END,
         f.name`,
      [`%${stage}%`]
    );
    return rows as Relationship[];
  }

  const param = `%${query}%`;
  const { rows } = await pool.query(
    `${REL_SELECT}
     WHERE f.name        ILIKE $1
        OR pc.name       ILIKE $1
        OR r.warmth_tier ILIKE $1
        OR f.focus       ILIKE $1
        OR f.deep_tech_signal ILIKE $1
        OR f.hq_location ILIKE $1
     GROUP BY r.id, f.id, pc.id
     ORDER BY
       CASE r.warmth_tier
         WHEN 'hot'   THEN 1
         WHEN 'warm'  THEN 2
         WHEN 'stale' THEN 3
         WHEN 'cold'  THEN 4
         ELSE 5
       END,
       f.name`,
    [param]
  );
  return rows as Relationship[];
}

// Return all relationships with their signals, ordered by warmth tier then last signal date.
// Also includes market_prospect funds with no relationship row so they appear in the dashboard
// with Michael's prospect visual treatment.
// Used by GET /api/investors to power the dashboard list view.
export async function getAllRelationships(): Promise<Relationship[]> {
  if (isMockMode()) return getAllRelationshipsMock();
  const { rows } = await pool.query(
    `${REL_SELECT}
     GROUP BY r.id, f.id, pc.id
     ORDER BY
       CASE r.warmth_tier WHEN 'hot' THEN 1 WHEN 'warm' THEN 2 WHEN 'stale' THEN 3 WHEN 'cold' THEN 4 ELSE 5 END,
       r.last_signal_date DESC NULLS LAST`
  );

  // Union in market_prospect funds that have no relationship row at all.
  const { rows: prospectRows } = await pool.query(
    `SELECT
       f.id, f.name, f.website, f.is_vip, f.investor_status,
       f.hq_location, f.aum_tier, f.stage, f.deep_tech_signal,
       f.geography_focus, f.check_size_proxy, f.focus,
       f.emerging_manager, f.logo_url, f.profile_last_checked_at,
       (SELECT json_build_object('id', i.id, 'name', i.name, 'role', i.role, 'linkedinUrl', i.linkedin_url)
        FROM investor i WHERE i.fund_id = f.id ORDER BY i.created_at LIMIT 1) AS investor
     FROM fund f
     WHERE f.investor_status = 'market_prospect'
       AND NOT EXISTS (SELECT 1 FROM relationship r WHERE r.fund_id = f.id)
     ORDER BY f.name`
  );

  const prospectRelationships = prospectRows.map((f) => ({
    id: `prospect-${f.id}`,
    fundId: f.id,
    portfolioCompanyId: null,
    alleyPartner: null,
    warmthTier: "cold",
    lastSignalDate: null,
    overrideNote: null,
    discoverySource: null,
    discoveryContext: null,
    fund: {
      id: f.id,
      name: f.name,
      focus: f.focus,
      aumTier: f.aum_tier,
      emergingManager: f.emerging_manager,
      website: f.website,
      logoUrl: f.logo_url,
      stage: f.stage,
      hqLocation: f.hq_location,
      geographyFocus: f.geography_focus,
      checkSizeProxy: f.check_size_proxy,
      deepTechSignal: f.deep_tech_signal,
      investorStatus: f.investor_status,
      isVip: f.is_vip,
      profileLastCheckedAt: f.profile_last_checked_at
        ? f.profile_last_checked_at.toISOString().split("T")[0]
        : null,
    },
    investor: f.investor ?? null,
    portfolioCompany: null,
    signals: [],
  }));

  return [...(rows as Relationship[]), ...prospectRelationships] as Relationship[];
}

// Return all stale relationships ordered oldest signal first (most at-risk first).
export async function listStaleRelationships(): Promise<Relationship[]> {
  if (isMockMode()) return listStaleRelationshipsMock();
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
  if (isMockMode()) return getWarmthSignalsMock(investorId);
  const { rows } = await pool.query(
    `SELECT
       id,
       relationship_id                      AS "relationshipId",
       signal_type                          AS type,
       to_char(signal_date, 'YYYY-MM-DD')   AS date,
       source,
       source_url                           AS "sourceUrl",
       source_title                         AS "sourceTitle",
       raw_snippet                          AS "rawSnippet",
       unique_hash                          AS "uniqueHash",
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
  if (isMockMode()) return getRecentSignalsMock(limit);
  const { rows } = await pool.query(
    `SELECT
       id,
       relationship_id                      AS "relationshipId",
       signal_type                          AS type,
       to_char(signal_date, 'YYYY-MM-DD')   AS date,
       source,
       source_url                           AS "sourceUrl",
       source_title                         AS "sourceTitle",
       raw_snippet                          AS "rawSnippet",
       unique_hash                          AS "uniqueHash",
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
