// Read-only functions over MOCK_RELATIONSHIPS — mirrors the function
// signatures in lib/db.ts and lib/alerts.server.ts exactly, so callers
// never need to know whether they're talking to Postgres or this file.
import { MOCK_RELATIONSHIPS } from "./relationships";
import { isWarmAtRisk } from "../scoring";
import type { Relationship, Signal } from "../types";
import type { Alert } from "../alerts";

export async function getAllRelationshipsMock(): Promise<Relationship[]> {
  return MOCK_RELATIONSHIPS;
}

export async function getInvestorByNameMock(name: string): Promise<Relationship | null> {
  const needle = name.toLowerCase();
  return MOCK_RELATIONSHIPS.find((r) => r.fund?.name.toLowerCase().includes(needle)) ?? null;
}

export async function searchRelationshipsMock(query: string): Promise<Relationship[]> {
  const needle = query.toLowerCase();
  return MOCK_RELATIONSHIPS.filter(
    (r) =>
      r.fund?.name.toLowerCase().includes(needle) ||
      r.portfolioCompany?.name.toLowerCase().includes(needle) ||
      r.warmthTier.toLowerCase().includes(needle) ||
      r.fund?.focus?.toLowerCase().includes(needle) ||
      r.fund?.deepTechSignal?.toLowerCase().includes(needle) ||
      r.fund?.hqLocation?.toLowerCase().includes(needle)
  );
}

export async function listStaleRelationshipsMock(): Promise<Relationship[]> {
  return MOCK_RELATIONSHIPS.filter((r) => r.warmthTier === "Stale").sort((a, b) => {
    const aDate = a.lastSignalDate ? new Date(a.lastSignalDate).getTime() : 0;
    const bDate = b.lastSignalDate ? new Date(b.lastSignalDate).getTime() : 0;
    return aDate - bDate;
  });
}

export async function getWarmthSignalsMock(investorId: string): Promise<Signal[]> {
  const rel = MOCK_RELATIONSHIPS.find((r) => r.id === investorId);
  return rel?.signals ?? [];
}

export async function getRecentSignalsMock(limit = 20): Promise<Signal[]> {
  const allSignals = MOCK_RELATIONSHIPS.flatMap((r) => r.signals ?? []);
  return allSignals
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export async function getAlertsMock(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  for (const rel of MOCK_RELATIONSHIPS) {
    if (!rel.portfolioCompany) continue;
    const fundName = rel.fund?.name ?? "Unknown fund";
    const companyName = rel.portfolioCompany.name;
    const lastSignalDate = rel.lastSignalDate ?? null;

    if (rel.warmthTier === "Stale") {
      alerts.push({
        type: "stale_relationship",
        severity: "high",
        fund: fundName,
        portfolioCompany: companyName,
        lastSignalDate,
        message: `${fundName} has gone stale on ${companyName}. Reconnect before their next round in this space.`,
      });
    } else if (rel.warmthTier === "Warm" && isWarmAtRisk(lastSignalDate)) {
      alerts.push({
        type: "warm_at_risk",
        severity: "medium",
        fund: fundName,
        portfolioCompany: companyName,
        lastSignalDate,
        message: `${fundName} is warm on ${companyName} but no signal in 90+ days. Schedule a touchpoint soon.`,
      });
    }
  }

  return alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));
}
