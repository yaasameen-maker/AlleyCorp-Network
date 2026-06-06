import type { Investor } from "@/app/data/mockData";
import { getRelationshipAlerts } from "./alerts";
import { formatDataFreshness, isWithinDays } from "./dates";
import { DATA_REFRESHED_AT } from "./warmthAnalysis";

export type DigestSectionId = "stale" | "warm_at_risk" | "new_signals";

export interface DigestItem {
  id: string;
  section: DigestSectionId;
  investorId: string;
  fundName: string;
  headline: string;
  timestamp: string;
  signalSource: string;
}

export interface DigestSection {
  id: DigestSectionId;
  title: string;
  items: DigestItem[];
}

export interface WeeklyDigest {
  generatedAt: Date;
  subject: string;
  preheader: string;
  sections: DigestSection[];
  totalItems: number;
}

const SECTION_META: Record<DigestSectionId, string> = {
  stale: "Stale relationships",
  warm_at_risk: "Warm at risk",
  new_signals: "New signals (last 7 days)",
};

function primaryCompany(investor: Investor): string {
  const ci = investor.coInvestments.find((c) => c.fundParticipated) ?? investor.coInvestments[0];
  return ci?.portfolioCompany.name ?? "Portfolio";
}

export function buildWeeklyDigest(
  investors: Investor[],
  now: Date = DATA_REFRESHED_AT
): WeeklyDigest {
  const alerts = getRelationshipAlerts(investors, now);

  const staleItems: DigestItem[] = alerts
    .filter((a) => a.type === "stale_relationship")
    .map((a) => ({
      id: `digest-stale-${a.investorId}`,
      section: "stale" as const,
      investorId: a.investorId,
      fundName: a.fundName,
      headline: `${a.fundName} · ${a.portfolioCompany} — no signal in ${a.monthsSinceSignal} months`,
      timestamp: a.lastSignalDate ?? "Unknown",
      signalSource: "Relationship scoring",
    }));

  const warmItems: DigestItem[] = alerts
    .filter((a) => a.type === "warm_at_risk")
    .map((a) => ({
      id: `digest-warm-${a.investorId}`,
      section: "warm_at_risk" as const,
      investorId: a.investorId,
      fundName: a.fundName,
      headline: `${a.fundName} · ${a.portfolioCompany} — relationship cooling`,
      timestamp: a.lastSignalDate ?? "Unknown",
      signalSource: "Warmth monitor",
    }));

  const newSignalItems: DigestItem[] = [];
  for (const investor of investors) {
    for (const signal of investor.signals) {
      if (!isWithinDays(signal.date, 7, now)) continue;
      newSignalItems.push({
        id: `digest-signal-${investor.id}-${signal.date}-${signal.type}`,
        section: "new_signals",
        investorId: investor.id,
        fundName: investor.fund.name,
        headline: `${investor.fund.name} · ${signal.description}`,
        timestamp: signal.date,
        signalSource: signal.source,
      });
    }
  }

  const sections: DigestSection[] = (
    [
      { id: "stale" as const, items: staleItems },
      { id: "warm_at_risk" as const, items: warmItems },
      { id: "new_signals" as const, items: newSignalItems },
    ] as const
  )
    .filter((s) => s.items.length > 0)
    .map((s) => ({
      id: s.id,
      title: SECTION_META[s.id],
      items: s.items,
    }));

  const weekLabel = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return {
    generatedAt: now,
    subject: `AlleyCorp Relationship Digest — Week of ${weekLabel}`,
    preheader: `${staleItems.length} stale · ${warmItems.length} warm at risk · ${newSignalItems.length} new signals`,
    sections,
    totalItems: staleItems.length + warmItems.length + newSignalItems.length,
  };
}

export function formatDigestAsEmail(digest: WeeklyDigest): string {
  const lines = [
    `Subject: ${digest.subject}`,
    "",
    "AlleyCorp Relationship Intelligence",
    `Generated ${formatDataFreshness(digest.generatedAt)}`,
    "",
    digest.preheader,
    "",
  ];

  for (const section of digest.sections) {
    lines.push(`── ${section.title.toUpperCase()} ──`);
    for (const item of section.items) {
      lines.push(`• ${item.headline}`);
      lines.push(`  ${item.timestamp} · ${item.signalSource}`);
    }
    lines.push("");
  }

  lines.push("—");
  lines.push("View full profiles in AlleyCorp Investor Intelligence.");

  return lines.join("\n");
}

export function findInvestorForDigestItem(
  investors: Investor[],
  item: DigestItem
): Investor | undefined {
  return investors.find((i) => i.id === item.investorId);
}
