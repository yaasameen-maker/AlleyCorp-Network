// Deterministic warmth scoring — no AI in this layer
// DB-agnostic: depends on RelationshipRepository interface, not any specific ORM
import type { WarmthTier } from "./types.js";

export type { WarmthTier };

export type ScoringSignalType =
  | "co_investment"
  | "event_attendance"
  | "email_thread"      // Phase 2 — Kabir ~Jun 1
  | "linkedin_activity"
  | "manual_override";

export interface ScoringSignal {
  type: ScoringSignalType;
  date: Date;
  source?: string;
  value?: string;
  confidence: number; // 0.0–1.0
}

export interface ScoringRelationship {
  id: string;
  fundName: string;
  warmthTier: WarmthTier;
  lastSignalDate: Date | null;
  overrideNote?: string;
  signals: ScoringSignal[];
}

// ── Repository interface — implement for whichever DB you pick ────────
export interface RelationshipRepository {
  findById(id: string): Promise<ScoringRelationship | null>;
  findAll(): Promise<ScoringRelationship[]>;
  findByTier(tier: WarmthTier): Promise<ScoringRelationship[]>;
  updateTier(id: string, tier: WarmthTier): Promise<void>;
}

// ── Scoring config ────────────────────────────────────────────────────
const STALE_DAYS = 180; // 6 months without signal → Stale
const COLD_DAYS = 365;  // 12 months → Cold

const SIGNAL_WEIGHTS: Record<ScoringSignalType, number> = {
  co_investment:    10,
  event_attendance:  3,
  email_thread:      2,
  linkedin_activity: 1,
  manual_override:   0,
};

// Lauren-confirmed Hot calibration anchors — always Hot regardless of score
const HOT_ANCHORS = new Set([
  "Riot Ventures",
  "Snowpoint Ventures",
  "General Catalyst",
  "Mach33",
]);

// ── Core scoring function — pure, no DB calls ─────────────────────────
export function computeWarmthTier(rel: ScoringRelationship): WarmthTier {
  if (rel.overrideNote) return rel.warmthTier;

  if (HOT_ANCHORS.has(rel.fundName)) return "Hot";

  const now = new Date();
  const daysSinceLastSignal = rel.lastSignalDate
    ? (now.getTime() - rel.lastSignalDate.getTime()) / 86_400_000
    : Infinity;

  const hasCoInvestment = rel.signals.some((s) => s.type === "co_investment");
  if (hasCoInvestment && daysSinceLastSignal > STALE_DAYS) return "Stale";

  if (daysSinceLastSignal > COLD_DAYS) return "Cold";

  const score = rel.signals.reduce(
    (sum, s) => sum + SIGNAL_WEIGHTS[s.type] * s.confidence,
    0
  );

  if (score >= 15) return "Hot";
  if (score >= 6) return "Warm";
  return "Cold";
}

// ── DB-aware helpers — require a repository implementation ────────────
export async function scoreRelationship(
  id: string,
  repo: RelationshipRepository
): Promise<WarmthTier> {
  const rel = await repo.findById(id);
  if (!rel) throw new Error(`Relationship ${id} not found`);
  return computeWarmthTier(rel);
}

export async function recalibrateAll(repo: RelationshipRepository): Promise<void> {
  const all = await repo.findAll();
  for (const rel of all) {
    const tier = computeWarmthTier(rel);
    if (tier !== rel.warmthTier) await repo.updateTier(rel.id, tier);
  }
}
