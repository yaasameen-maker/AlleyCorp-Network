// Deterministic warmth scoring — no AI in this layer.
// Two APIs live here:
//   1. calculateWarmthTier(signals)  — takes DB Signal[], used by alerts layer and tests
//   2. computeWarmthTier(rel)        — takes ScoringRelationship, used by repository pattern
import type { Signal, WarmthTier } from "./types";

export type { WarmthTier };

// ─────────────────────────────────────────
// Scoring signal types (repository pattern — separate from DB Signal type)
// ─────────────────────────────────────────

export type ScoringSignalType =
  | "co_investment"
  | "event_attendance"
  | "press_mention"
  | "email_thread"        // Phase 2 — Kabir ~Jun 1
  | "linkedin_connection"
  | "manual_override";

export type ConfidenceLabel = "high" | "medium" | "low";

const CONFIDENCE_MAP: Record<ConfidenceLabel, number> = {
  high:   1.0,
  medium: 0.66,
  low:    0.33,
};

export function toConfidenceScore(label: ConfidenceLabel): number {
  return CONFIDENCE_MAP[label];
}

export interface ScoringSignal {
  type: ScoringSignalType;
  date: Date;
  source?: string;
  value?: string;
  confidence: number; // 0.0–1.0 — use toConfidenceScore() to convert from DB label
}

export interface ScoringRelationship {
  id: string;
  fundName: string;
  warmthTier: WarmthTier;
  lastSignalDate: Date | null;
  overrideNote?: string;
  signals: ScoringSignal[];
}

// ─────────────────────────────────────────
// Repository interface — implement for whichever DB you use
// ─────────────────────────────────────────

export interface RelationshipRepository {
  findById(id: string): Promise<ScoringRelationship | null>;
  findAll(): Promise<ScoringRelationship[]>;
  findByTier(tier: WarmthTier): Promise<ScoringRelationship[]>;
  updateTier(id: string, tier: WarmthTier): Promise<void>;
}

// ─────────────────────────────────────────
// Thresholds — change here, not inline
// ─────────────────────────────────────────

const ACTIVE_WINDOW_MONTHS = 24;  // signals older than this are considered decayed
const HOT_CO_INVEST_MONTHS = 18;  // co-investment must be within this window to qualify for Hot
const HOT_SIGNAL_THRESHOLD = 3;   // minimum active signals for Hot
const WARM_SIGNAL_THRESHOLD = 2;  // minimum active signals for Warm
const WARM_AT_RISK_DAYS     = 90; // days without a signal before a Warm is flagged at-risk

const STALE_DAYS = 180; // 6 months without signal → Stale (weighted scorer)
const COLD_DAYS  = 365; // 12 months → Cold (weighted scorer)

const SIGNAL_WEIGHTS: Record<ScoringSignalType, number> = {
  co_investment:      10,
  event_attendance:    4,  // Swoogo/Luma attendance is meaningful
  press_mention:       2,  // news signal — same tier as email_thread
  email_thread:        2,  // Kabir enrichment, Jun 1
  linkedin_connection: 1,
  manual_override:     0,
};

// Lauren-confirmed Hot calibration anchors — always Hot regardless of score
// Updated June 4 2026 — Luba added funds confirmed hot by Lauren Young
export const HOT_ANCHORS = new Set([
  // Original anchors
  "Riot Ventures",
  "Snowpoint Ventures",
  "General Catalyst",
  "Mach33",
  // Lauren-confirmed additions (active co-investors with recent deal activity)
  "SOSV",
  "Day One Ventures",
  "Amazon Climate Pledge Fund",
  "NEA",
  "Ubiquity Ventures",
  "Geodesic Capital",
  "ff Venture Capital",
]);

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─────────────────────────────────────────
// API 1 — calculateWarmthTier(signals: Signal[])
// Used by: lib/alerts.ts, tests/scoring.test.ts
//
// Rules (source: SCHEMA.md):
//   Hot   — 3+ active signals AND a co_investment within the last 18 months
//   Warm  — 2+ active signals
//   Stale — signals exist but all decayed, or only 1 active
//   Cold  — no signals at all
//
// "Active" means the signal date is within the last 24 months.
// ─────────────────────────────────────────

export function calculateWarmthTier(signals: Signal[]): WarmthTier {
  if (signals.length === 0) return "Cold";

  const activeWindow   = monthsAgo(ACTIVE_WINDOW_MONTHS);
  const coInvestWindow = monthsAgo(HOT_CO_INVEST_MONTHS);

  const activeSignals = signals.filter(s => new Date(s.date) >= activeWindow);

  if (activeSignals.length === 0) return "Stale";

  const hasRecentCoInvestment = activeSignals.some(
    s => s.type === "co_investment" && new Date(s.date) >= coInvestWindow
  );

  if (activeSignals.length >= HOT_SIGNAL_THRESHOLD && hasRecentCoInvestment) return "Hot";
  if (activeSignals.length >= WARM_SIGNAL_THRESHOLD) return "Warm";
  return "Stale";
}

/**
 * Returns true if a Warm relationship has had no signal activity for 90+ days.
 * Used by the alerts layer to surface at-risk warm relationships.
 */
export function isWarmAtRisk(lastSignalDate: string | null | undefined): boolean {
  if (!lastSignalDate) return true;
  return new Date(lastSignalDate) < daysAgo(WARM_AT_RISK_DAYS);
}

// ─────────────────────────────────────────
// API 2 — computeWarmthTier(rel: ScoringRelationship)
// Used by: repository pattern, recalibrateAll
//
// Weighted scoring: co_investment=10, event_attendance=3, etc.
// Respects manual overrides and Lauren's Hot calibration anchors.
// ─────────────────────────────────────────

export function computeWarmthTier(rel: ScoringRelationship): WarmthTier {
  if (rel.overrideNote) return rel.warmthTier;
  if (HOT_ANCHORS.has(rel.fundName)) return "Hot";

  const now = new Date();
  const daysSinceLastSignal = rel.lastSignalDate
    ? (now.getTime() - rel.lastSignalDate.getTime()) / 86_400_000
    : Infinity;

  const hasCoInvestment = rel.signals.some(s => s.type === "co_investment");
  if (hasCoInvestment && daysSinceLastSignal > STALE_DAYS) return "Stale";
  if (daysSinceLastSignal > COLD_DAYS) return "Cold";

  const score = rel.signals.reduce((sum, s) => {
    const conf =
      typeof s.confidence === "string"
        ? (CONFIDENCE_MAP[s.confidence as ConfidenceLabel] ?? 0.5)
        : s.confidence;
    return sum + SIGNAL_WEIGHTS[s.type] * conf;
  }, 0);

  if (score >= 15) return "Hot";
  if (score >= 6) return "Warm";
  return "Cold";
}

// ─────────────────────────────────────────
// DB-aware helpers — require a repository implementation
// ─────────────────────────────────────────

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

export {
  ACTIVE_WINDOW_MONTHS,
  HOT_CO_INVEST_MONTHS,
  HOT_SIGNAL_THRESHOLD,
  WARM_SIGNAL_THRESHOLD,
  WARM_AT_RISK_DAYS,
};
