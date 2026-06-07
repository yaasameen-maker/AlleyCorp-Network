/**
 * PostgreSQL implementation of RelationshipRepository for the scoring engine.
 * Bridges the DB Signal type (string confidence) with the ScoringSignal type
 * (numeric confidence 0.0–1.0) that lib/scoring.ts expects.
 */

import { pool } from "./db";
import type { RelationshipRepository, ScoringRelationship, ScoringSignal, ScoringSignalType } from "./scoring";
import type { WarmthTier } from "./types";

// ── Mappers ───────────────────────────────────────────────────────────────────

function confidenceToNumber(c: string): number {
  switch (c) {
    case "confirmed": return 1.0;
    case "inferred":  return 0.7;
    case "pending":   return 0.3;
    default:          return 0.5;
  }
}

function signalTypeToScoring(t: string): ScoringSignalType | null {
  switch (t) {
    case "co_investment":
    case "co_investment_recency": return "co_investment";
    case "event_attendance":      return "event_attendance";
    case "email_contact":         return "email_thread";
    case "linkedin_connection":   return "linkedin_connection";
    case "press_mention":         return null; // press mentions don't contribute to score
    default:                      return null;
  }
}

function toWarmthTier(raw: string): WarmthTier {
  return (raw.charAt(0).toUpperCase() + raw.slice(1)) as WarmthTier;
}

// ── Repository ────────────────────────────────────────────────────────────────

const ACTIVE_WINDOW_MONTHS = 24;

async function loadRelationships(where?: string, params?: unknown[]): Promise<ScoringRelationship[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - ACTIVE_WINDOW_MONTHS);

  const { rows: relRows } = await pool.query(
    `SELECT r.id, f.name AS fund_name, r.warmth_tier, r.last_signal_date, r.override_note
     FROM relationship r
     JOIN fund f ON f.id = r.fund_id
     ${where ?? ""}`,
    params
  );

  if (relRows.length === 0) return [];

  const ids = relRows.map((r: Record<string, unknown>) => r.id as string);
  const { rows: sigRows } = await pool.query(
    `SELECT relationship_id, signal_type, signal_date, confidence
     FROM signal
     WHERE relationship_id = ANY($1)
       AND signal_date >= $2
     ORDER BY signal_date DESC`,
    [ids, cutoff]
  );

  const sigsByRelId = new Map<string, ScoringSignal[]>();
  for (const s of sigRows) {
    const type = signalTypeToScoring(s.signal_type as string);
    if (!type) continue; // skip press_mentions and unknown types

    const rel = s.relationship_id as string;
    if (!sigsByRelId.has(rel)) sigsByRelId.set(rel, []);
    sigsByRelId.get(rel)!.push({
      type,
      date: new Date(s.signal_date as string),
      confidence: confidenceToNumber(s.confidence as string),
    });
  }

  return relRows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    fundName: r.fund_name as string,
    warmthTier: toWarmthTier(r.warmth_tier as string),
    lastSignalDate: r.last_signal_date ? new Date(r.last_signal_date as string) : null,
    overrideNote: r.override_note ? (r.override_note as string) : undefined,
    signals: sigsByRelId.get(r.id as string) ?? [],
  }));
}

export const dbRepository: RelationshipRepository = {
  async findAll() {
    return loadRelationships();
  },

  async findById(id: string) {
    const results = await loadRelationships("WHERE r.id = $1", [id]);
    return results[0] ?? null;
  },

  async findByTier(tier: WarmthTier) {
    return loadRelationships("WHERE r.warmth_tier = $1", [tier.toLowerCase()]);
  },

  async updateTier(id: string, tier: WarmthTier) {
    await pool.query(
      `UPDATE relationship SET warmth_tier = $1, warmth_calculated_at = now(), updated_at = now() WHERE id = $2`,
      [tier.toLowerCase(), id]
    );
  },
};
