import { Pool } from "pg";
import type { Relationship, Signal } from "./types.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function getInvestorByName(name: string): Promise<Relationship | null> {
  // TODO: SELECT relationships JOIN funds WHERE funds.name ILIKE $1 LIMIT 1
  throw new Error(`getInvestorByName not implemented — wire to schema. Received: ${name}`);
}

export async function searchRelationships(query: string): Promise<Relationship[]> {
  // TODO: full-text search across funds.name, portfolio_companies.name, warmth_tier
  throw new Error(`searchRelationships not implemented — wire to schema. Received: ${query}`);
}

export async function listStaleRelationships(): Promise<Relationship[]> {
  // TODO: SELECT relationships WHERE warmth_tier = 'Stale' ORDER BY last_signal_date ASC
  throw new Error("listStaleRelationships not implemented — wire to schema");
}

export async function getWarmthSignals(investorId: string): Promise<Signal[]> {
  // TODO: SELECT signals WHERE relationship_id = $1 ORDER BY date DESC
  throw new Error(`getWarmthSignals not implemented — wire to schema. Received: ${investorId}`);
}

export { pool };
