import type { Signal, WarmthTier } from "./types";

// ─────────────────────────────────────────
// Thresholds — change here, not inline
// ─────────────────────────────────────────
const ACTIVE_WINDOW_MONTHS = 24;   // signals older than this are considered decayed
const HOT_CO_INVEST_MONTHS = 18;   // co-investment must be within this window to qualify for Hot
const HOT_SIGNAL_THRESHOLD = 3;    // minimum active signals for Hot
const WARM_SIGNAL_THRESHOLD = 2;   // minimum active signals for Warm
const WARM_AT_RISK_DAYS    = 90;   // days without a signal before a Warm is flagged at-risk

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
// Core scorer
// ─────────────────────────────────────────

/**
 * Deterministically calculate a warmth tier from a set of signals.
 *
 * Rules (source: SCHEMA.md):
 *   Hot   — 3+ active signals AND a co_investment within the last 18 months
 *   Warm  — 2+ active signals
 *   Stale — at least 1 signal on record but none are active (all decayed),
 *            or active signals exist but fewer than 2
 *   Cold  — no signals at all
 *
 * "Active" means the signal date is within the last 24 months.
 */
export function calculateWarmthTier(signals: Signal[]): WarmthTier {
  if (signals.length === 0) return "Cold";

  const activeWindow     = monthsAgo(ACTIVE_WINDOW_MONTHS);
  const coInvestWindow   = monthsAgo(HOT_CO_INVEST_MONTHS);

  const activeSignals = signals.filter(s => new Date(s.date) >= activeWindow);

  if (activeSignals.length === 0) return "Stale";

  const hasRecentCoInvestment = activeSignals.some(
    s => s.type === "co_investment" && new Date(s.date) >= coInvestWindow
  );

  if (activeSignals.length >= HOT_SIGNAL_THRESHOLD && hasRecentCoInvestment) {
    return "Hot";
  }

  if (activeSignals.length >= WARM_SIGNAL_THRESHOLD) {
    return "Warm";
  }

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

export { ACTIVE_WINDOW_MONTHS, HOT_CO_INVEST_MONTHS, HOT_SIGNAL_THRESHOLD, WARM_SIGNAL_THRESHOLD, WARM_AT_RISK_DAYS };
