import type { Investor, Signal } from "@/app/data/mockData";
import { monthsSince, parseMonthYear } from "./dates";

const WARM_AT_RISK_DAYS = 90;
const ACTIVE_WINDOW_MONTHS = 24;

export function isWarmAtRisk(lastSignalDate: string | undefined, now: Date = new Date()): boolean {
  if (!lastSignalDate) return true;
  const parsed = parseMonthYear(lastSignalDate);
  if (!parsed) return true;
  const days = (now.getTime() - parsed.getTime()) / 86_400_000;
  return days > WARM_AT_RISK_DAYS;
}

export function isSignalActive(signal: Signal, now: Date = new Date()): boolean {
  const parsed = parseMonthYear(signal.date);
  if (!parsed) return false;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - ACTIVE_WINDOW_MONTHS);
  return parsed >= cutoff;
}

export type AlertType = "stale_relationship" | "warm_at_risk";
export type AlertSeverity = "high" | "medium";

export interface RelationshipAlert {
  id: string;
  investorId: string;
  type: AlertType;
  severity: AlertSeverity;
  fundName: string;
  portfolioCompany: string;
  lastSignalDate?: string;
  warmthTier: Investor["warmthTier"];
  suggestedAction: string;
  monthsSinceSignal: number;
}

function primaryPortfolioCompany(investor: Investor): string {
  const participated = investor.coInvestments.filter((c) => c.fundParticipated);
  if (participated.length === 0) {
    return investor.coInvestments[0]?.portfolioCompany.name ?? "Portfolio";
  }
  const sorted = [...participated].sort((a, b) => {
    const da = parseMonthYear(a.date)?.getTime() ?? 0;
    const db = parseMonthYear(b.date)?.getTime() ?? 0;
    return db - da;
  });
  return sorted[0].portfolioCompany.name;
}

/** Stale first, then warm-at-risk. Sorted by severity then oldest signal. */
export function getRelationshipAlerts(investors: Investor[], now: Date = new Date()): RelationshipAlert[] {
  const alerts: RelationshipAlert[] = [];

  for (const investor of investors) {
    const portfolioCompany = primaryPortfolioCompany(investor);
    const months = investor.lastSignalDate ? monthsSince(investor.lastSignalDate, now) : 999;
    const suggestedAction =
      investor.suggestedAction ?? `Review relationship with ${investor.fund.name}.`;

    if (investor.warmthTier === "Stale") {
      alerts.push({
        id: `alert-stale-${investor.id}`,
        investorId: investor.id,
        type: "stale_relationship",
        severity: "high",
        fundName: investor.fund.name,
        portfolioCompany,
        lastSignalDate: investor.lastSignalDate,
        warmthTier: investor.warmthTier,
        suggestedAction,
        monthsSinceSignal: months,
      });
      continue;
    }

    if (investor.warmthTier === "Warm" && isWarmAtRisk(investor.lastSignalDate, now)) {
      alerts.push({
        id: `alert-warm-${investor.id}`,
        investorId: investor.id,
        type: "warm_at_risk",
        severity: "medium",
        fundName: investor.fund.name,
        portfolioCompany,
        lastSignalDate: investor.lastSignalDate,
        warmthTier: investor.warmthTier,
        suggestedAction,
        monthsSinceSignal: months,
      });
    }
  }

  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "high" ? -1 : 1;
    }
    return b.monthsSinceSignal - a.monthsSinceSignal;
  });
}
