/**
 * groupByFund — maps DB Relationship rows → frontend Investor cards.
 * Extracted from app/api/investors/route.ts so it can be unit-tested
 * without importing a Next.js route file (which breaks tsc).
 */

import type { Relationship, Signal, DiscoverySource, DiscoveryContext, WarmthTier } from "./types";

// Re-export so components can import everything from one place
export type { WarmthTier, DiscoveryContext, DiscoverySource };

// ── Frontend types — source of truth for all UI components ───────────────────

export interface PortfolioCompany {
  id: string;
  name: string;
  url: string;
}

export interface InvestorSignal {
  type: "co-investment" | "event" | "email" | "meeting";
  description: string;
  date: string;
  weight: "High" | "Medium" | "Low";
  source?: string;
  sourceUrl?: string;
  portfolioCompanyName?: string;
}

export interface CoInvestment {
  portfolioCompany: PortfolioCompany;
  round: string;
  date: string;
  fundParticipated: boolean;
}

export interface Contact {
  name: string;
  role: string;
  linkedinUrl?: string;
}

export interface Investor {
  id: string;
  name: string;
  fund: { id: string; name: string; logoUrl?: string; website?: string };
  warmthTier: WarmthTier;
  signals: InvestorSignal[];
  coInvestments: CoInvestment[];
  lastSignalDate?: string;
  suggestedAction?: string;
  contact?: Contact;
  discoverySource?: DiscoverySource;
  discoveryContext?: DiscoveryContext | null;
}

// Backward-compat alias — prefer Investor
export type FrontendInvestor = Investor;

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapSignalType(type: Signal["type"]): InvestorSignal["type"] {
  switch (type) {
    case "co_investment":
    case "co_investment_recency":
      return "co-investment";
    case "event_attendance":
      return "event";
    case "email_contact":
      return "email";
    default:
      return "meeting";
  }
}

function capitalize(s: string): "High" | "Medium" | "Low" {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as "High" | "Medium" | "Low";
}

function toWarmthTier(s: string): "Hot" | "Warm" | "Stale" | "Cold" {
  const map: Record<string, "Hot" | "Warm" | "Stale" | "Cold"> = {
    hot: "Hot",
    warm: "Warm",
    stale: "Stale",
    cold: "Cold",
  };
  return map[s.toLowerCase()] ?? "Cold";
}

function formatDate(d: string | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getSuggestedAction(r: Relationship): string {
  const fund = r.fund?.name ?? "This fund";
  switch (r.warmthTier) {
    case "Hot":
      return `${fund} is an active co-investor. Strong deep tech alignment — prioritize for next round or event invite.`;
    case "Warm":
      return `${fund} relationship is warm but cooling. Schedule a touchpoint in the next 30 days.`;
    case "Stale":
      return `${fund} has gone quiet. Last signal over 18 months ago. Reconnect before they lead a round without us.`;
    case "Cold":
      // lastSignalDate present = co-invested before but gone cold; absent = never co-invested
      if (r.lastSignalDate) {
        return `${fund} relationship has gone cold. Re-engage via a shared portfolio company or warm intro from a Hot co-investor.`;
      }
      return `No co-investment history with ${fund}. Research intro opportunities via existing Hot relationships.`;
  }
}

// ── Group relationships by fund → one Investor card per fund ─────────────────

export function groupByFund(relationships: Relationship[]): Investor[] {
  const map = new Map<string, Investor>();

  for (const r of relationships) {
    const fundId = r.fundId;
    const existing = map.get(fundId);

    const coInvestSignals = (r.signals ?? [])
      .filter((s) => s.type === "co_investment" || s.type === "co_investment_recency")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestCoInvest = coInvestSignals[0];

    const coInvestment: CoInvestment | null =
      r.portfolioCompany && latestCoInvest
        ? {
            portfolioCompany: {
              id: r.portfolioCompany.id,
              name: r.portfolioCompany.name,
              url: r.portfolioCompany.website ?? "",
            },
            round: "Co-investment",
            date: formatDate(latestCoInvest.date),
            fundParticipated: true,
          }
        : null;

    const signals: InvestorSignal[] = (r.signals ?? []).map((s) => ({
      type: mapSignalType(s.type),
      description: s.value ? `${s.source}: ${s.value}` : s.source,
      date: formatDate(s.date),
      weight: capitalize(s.weight),
      source: s.source,
      sourceUrl: s.sourceUrl ?? undefined,
      portfolioCompanyName: r.portfolioCompany?.name,
    }));

    if (!existing) {
      map.set(fundId, {
        id: r.id,
        name: r.fund?.name ?? "",
        fund: {
          id: fundId,
          name: r.fund?.name ?? "",
          logoUrl: r.fund?.logoUrl,
          website: r.fund?.website,
        },
        warmthTier: toWarmthTier(r.warmthTier),
        lastSignalDate: r.lastSignalDate ? formatDate(r.lastSignalDate) : undefined,
        suggestedAction: getSuggestedAction(r),
        signals,
        coInvestments: coInvestment ? [coInvestment] : [],
        contact: r.investor
          ? {
              name: r.investor.name,
              role: r.investor.role,
              linkedinUrl: r.investor.linkedinUrl ?? undefined,
            }
          : undefined,
        discoverySource: r.discoverySource,
        discoveryContext: r.discoveryContext,
      });
    } else {
      if (coInvestment) existing.coInvestments.push(coInvestment);
      existing.signals.push(...signals);

      if (r.lastSignalDate) {
        const existing_date = existing.lastSignalDate
          ? new Date(existing.lastSignalDate)
          : new Date(0);
        const new_date = new Date(r.lastSignalDate);
        if (new_date > existing_date) {
          existing.lastSignalDate = formatDate(r.lastSignalDate);
          existing.warmthTier = toWarmthTier(r.warmthTier);
          existing.suggestedAction = getSuggestedAction(r);
        }
      }
    }
  }

  return Array.from(map.values());
}
