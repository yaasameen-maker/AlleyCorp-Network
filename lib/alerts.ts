import { isWarmAtRisk } from "./scoring";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type AlertType = "stale_relationship" | "warm_at_risk";
export type AlertSeverity = "high" | "medium";

export interface Alert {
  type: AlertType;
  severity: AlertSeverity;
  fund: string;
  portfolioCompany: string;
  lastSignalDate: string | null;
  message: string;
}

// ── Frontend alert type (richer shape for UI components) ─────────────────────
export interface RelationshipAlert {
  id: string;
  investorId: string;
  type: AlertType;
  severity: AlertSeverity;
  fund: string;
  fundName: string;          // alias for fund — used by AlertCard
  portfolioCompany: string;
  warmthTier: WarmthTier;
  lastSignalDate: string | null;
  message: string;
  suggestedAction: string;   // alias for message — used by AlertCard
}

// Frontend version — derives alerts from already-loaded Investor[] (no DB call).
// Used by StaleAlertsBanner and other UI components.
import type { Investor, WarmthTier } from "@/app/data/mockData";

export function getRelationshipAlerts(investors: Investor[]): RelationshipAlert[] {
  const alerts: RelationshipAlert[] = [];

  for (const investor of investors) {
    if (investor.warmthTier === "Stale") {
      alerts.push({
        id: `alert-${investor.id}`,
        investorId: investor.id,
        type: "stale_relationship",
        severity: "high",
        fund: investor.fund.name,
        fundName: investor.fund.name,
        portfolioCompany: investor.coInvestments[0]?.portfolioCompany.name ?? "",
        warmthTier: investor.warmthTier,
        lastSignalDate: investor.lastSignalDate ?? null,
        message: investor.suggestedAction ?? `${investor.fund.name} has gone stale. Reconnect before their next round.`,
        suggestedAction: investor.suggestedAction ?? `${investor.fund.name} has gone stale. Reconnect before their next round.`,
      });
    } else if (investor.warmthTier === "Warm" && isWarmAtRisk(investor.lastSignalDate)) {
      alerts.push({
        id: `alert-${investor.id}`,
        investorId: investor.id,
        type: "warm_at_risk",
        severity: "medium",
        fund: investor.fund.name,
        fundName: investor.fund.name,
        portfolioCompany: investor.coInvestments[0]?.portfolioCompany.name ?? "",
        warmthTier: investor.warmthTier,
        lastSignalDate: investor.lastSignalDate ?? null,
        message: investor.suggestedAction ?? `${investor.fund.name} is warm but cooling. Schedule a touchpoint soon.`,
        suggestedAction: investor.suggestedAction ?? `${investor.fund.name} is warm but cooling. Schedule a touchpoint soon.`,
      });
    }
  }

  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
    if (!a.lastSignalDate) return -1;
    if (!b.lastSignalDate) return 1;
    return a.lastSignalDate.localeCompare(b.lastSignalDate);
  });
}

export { isWarmAtRisk } from "./scoring";

export function isSignalActive(signal: { date: string }, now: Date = new Date()): boolean {
  const d = new Date(signal.date);
  if (isNaN(d.getTime())) return false;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 24);
  return d >= cutoff;
}
