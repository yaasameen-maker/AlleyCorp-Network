import type { Investor, Signal, WarmthTier } from "@/app/data/mockData";
import { monthsSince, parseMonthYear } from "./dates";

const ACTIVE_WINDOW_MONTHS = 24;
const HOT_CO_INVEST_MONTHS = 18;
const HOT_SIGNAL_THRESHOLD = 3;
const WARM_SIGNAL_THRESHOLD = 2;

export interface WarmthFactor {
  id: string;
  label: string;
  value: string;
  met: boolean;
  detail: string;
  weight: number;
}

export interface WarmthAnalysis {
  tier: WarmthTier;
  summary: string;
  factors: WarmthFactor[];
  activeSignalCount: number;
  totalSignalCount: number;
  hasRecentCoInvestment: boolean;
  scorePercent: number;
}

function isSignalActive(signal: Signal, now: Date): boolean {
  const parsed = parseMonthYear(signal.date);
  if (!parsed) return false;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - ACTIVE_WINDOW_MONTHS);
  return parsed >= cutoff;
}

function hasRecentCoInvestment(signals: Signal[], now: Date): boolean {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - HOT_CO_INVEST_MONTHS);
  return signals.some((s) => {
    if (s.type !== "co-investment") return false;
    const parsed = parseMonthYear(s.date);
    return parsed !== null && parsed >= cutoff;
  });
}

export function analyzeWarmth(investor: Investor, now: Date = new Date()): WarmthAnalysis {
  const activeSignals = investor.signals.filter((s) => isSignalActive(s, now));
  const recentCoInvest = hasRecentCoInvestment(investor.signals, now);
  const activeCount = activeSignals.length;
  const totalCount = investor.signals.length;

  const factors: WarmthFactor[] = [
    {
      id: "active-signals",
      label: "Active signals",
      value: `${activeCount} of ${totalCount}`,
      met: activeCount >= WARM_SIGNAL_THRESHOLD,
      detail:
        activeCount >= HOT_SIGNAL_THRESHOLD
          ? "3+ signals within 24 months — Hot threshold met"
          : activeCount >= WARM_SIGNAL_THRESHOLD
            ? "2+ signals within 24 months — Warm threshold met"
            : activeCount === 1
              ? "Only 1 active signal — relationship is Stale"
              : totalCount > 0
                ? "All signals have decayed past 24 months"
                : "No signals recorded",
      weight: Math.min(100, (activeCount / HOT_SIGNAL_THRESHOLD) * 50),
    },
    {
      id: "co-investment-recency",
      label: "Recent co-investment",
      value: recentCoInvest ? "Within 18 mo" : "None recent",
      met: recentCoInvest,
      detail: recentCoInvest
        ? "Co-investment within the last 18 months supports Hot tier"
        : "No co-investment in the last 18 months — cannot qualify for Hot",
      weight: recentCoInvest ? 50 : 0,
    },
  ];

  if (investor.lastSignalDate) {
    const months = monthsSince(investor.lastSignalDate, now);
    factors.push({
      id: "last-signal",
      label: "Last signal recency",
      value: `${months} mo ago`,
      met: months <= ACTIVE_WINDOW_MONTHS,
      detail:
        months > ACTIVE_WINDOW_MONTHS
          ? "Last signal is outside the 24-month active window"
          : "Last signal is within the active window",
      weight: Math.max(0, 100 - (months / ACTIVE_WINDOW_MONTHS) * 100),
    });
  }

  let tier: WarmthTier = investor.warmthTier;
  let summary: string;

  if (totalCount === 0) {
    tier = "Cold";
    summary = "No relationship signals yet. AlleyCorp has not co-invested or engaged with this fund.";
  } else if (activeCount === 0) {
    tier = "Stale";
    summary = `Signals exist but all have decayed. Last activity was ${investor.lastSignalDate ? monthsSince(investor.lastSignalDate, now) + " months ago" : "unknown"}.`;
  } else if (activeCount >= HOT_SIGNAL_THRESHOLD && recentCoInvest) {
    tier = "Hot";
    summary = `${activeCount} active signals with a recent co-investment. This is a high-priority relationship.`;
  } else if (activeCount >= WARM_SIGNAL_THRESHOLD) {
    tier = "Warm";
    summary = `${activeCount} active signals maintain this relationship at Warm. ${recentCoInvest ? "" : "No recent co-investment keeps it below Hot."}`.trim();
  } else {
    tier = "Stale";
    summary = "Only one active signal remains. The relationship needs re-engagement before it goes fully cold.";
  }

  const scorePercent = Math.min(
    100,
    factors.reduce((sum, f) => sum + f.weight, 0) / Math.max(factors.length, 1)
  );

  return {
    tier,
    summary,
    factors,
    activeSignalCount: activeCount,
    totalSignalCount: totalCount,
    hasRecentCoInvestment: recentCoInvest,
    scorePercent,
  };
}

export const DATA_REFRESHED_AT = new Date("2026-06-01T09:00:00");
