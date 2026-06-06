import { Pool } from "pg";
import type { Relationship, Signal } from "./types.js";

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
      'alleycorpRole', pc.alleycorp_role,
      'website',       pc.website
    ) ELSE NULL END AS "portfolioCompany",
    COALESCE(
      json_agg(
        json_build_object(
          'id',             s.id,
          'relationshipId', s.relationship_id,
          'type',           s.type,
          'date',           to_char(s.date, 'YYYY-MM-DD'),
          'source',         s.source,
          'value',          s.value,
          'confidence',     s.confidence
        )
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::json
    ) AS signals
  FROM relationships r
  JOIN      funds f              ON f.id  = r.fund_id
  LEFT JOIN portfolio_companies pc ON pc.id = r.portfolio_company_id
  LEFT JOIN signals s              ON s.relationship_id = r.id
`;

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

export async function listStaleRelationships(): Promise<Relationship[]> {
  const { rows } = await pool.query(
    `${REL_SELECT}
     WHERE r.warmth_tier = 'Stale'
     GROUP BY r.id, f.id, pc.id
     ORDER BY r.last_signal_date ASC NULLS LAST`
  );
  return rows as Relationship[];
}

export async function getWarmthSignals(investorId: string): Promise<Signal[]> {
  const { rows } = await pool.query(
    `SELECT
       id,
       relationship_id             AS "relationshipId",
       type,
       to_char(date, 'YYYY-MM-DD') AS date,
       source,
       value,
       confidence
     FROM signals
     WHERE relationship_id = $1
     ORDER BY date DESC`,
    [investorId]
  );
  return rows as Signal[];
}

export async function getRecentSignals(limit = 20): Promise<Signal[]> {
  const { rows } = await pool.query(
    `SELECT
       id,
       relationship_id             AS "relationshipId",
       type,
       to_char(date, 'YYYY-MM-DD') AS date,
       source,
       value,
       confidence
     FROM signals
     ORDER BY date DESC
     LIMIT $1`,
    [limit]
  );
  return rows as Signal[];
}

export { pool };
