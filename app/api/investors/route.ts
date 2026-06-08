import { NextResponse } from "next/server";
import { getAllRelationships } from "../../../lib/db";
import type { Relationship, Signal } from "../../../lib/types";

// ── Frontend types (must match app/data/mockData.ts) ─────────────────────────

interface FrontendPortfolioCompany {
  id: string;
  name: string;
  url: string;
}

interface FrontendSignal {
  type: "co-investment" | "event" | "email" | "meeting";
  description: string;
  date: string;
  weight: "High" | "Medium" | "Low";
}

interface FrontendCoInvestment {
  portfolioCompany: FrontendPortfolioCompany;
  round: string;
  date: string;
  fundParticipated: boolean;
}

interface FrontendInvestor {
  id: string;
  name: string;
  fund: { id: string; name: string };
  warmthTier: "Hot" | "Warm" | "Stale" | "Cold";
  signals: FrontendSignal[];
  coInvestments: FrontendCoInvestment[];
  lastSignalDate?: string;
  suggestedAction?: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapSignalType(type: Signal["type"]): FrontendSignal["type"] {
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
    hot: "Hot", warm: "Warm", stale: "Stale", cold: "Cold",
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
      return `${fund} has gone quiet. Last signal over 18 months ago — reconnect before they lead a round without us.`;
    case "Cold":
      return `No co-investment history with ${fund}. Research and explore intro opportunities via existing Hot relationships.`;
  }
}

// ── Group relationships by fund → one Investor card per fund ─────────────────

function groupByFund(relationships: Relationship[]): FrontendInvestor[] {
  const map = new Map<string, FrontendInvestor>();

  for (const r of relationships) {
    const fundId = r.fundId;
    const existing = map.get(fundId);

    const coInvestment: FrontendCoInvestment | null = r.portfolioCompany
      ? {
          portfolioCompany: {
            id: r.portfolioCompany.id,
            name: r.portfolioCompany.name,
            url: r.portfolioCompany.website ?? "",
          },
          round: "Co-investment",
          date: formatDate(r.lastSignalDate),
          fundParticipated: r.warmthTier !== "Cold",
        }
      : null;

    const signals: FrontendSignal[] = (r.signals ?? []).map((s) => ({
      type: mapSignalType(s.type),
      description: s.value ? `${s.source} — ${s.value}` : s.source,
      date: formatDate(s.date),
      weight: capitalize(s.weight),
    }));

    if (!existing) {
      map.set(fundId, {
        id: r.id,
        name: r.fund?.name ?? "",
        fund: { id: fundId, name: r.fund?.name ?? "" },
        warmthTier: toWarmthTier(r.warmthTier),
        lastSignalDate: r.lastSignalDate ? formatDate(r.lastSignalDate) : undefined,
        suggestedAction: getSuggestedAction(r),
        signals,
        coInvestments: coInvestment ? [coInvestment] : [],
      });
    } else {
      // Merge into existing card — add co-investments and signals
      if (coInvestment) existing.coInvestments.push(coInvestment);
      existing.signals.push(...signals);

      // Keep the most recent lastSignalDate
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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const relationships = await getAllRelationships();
    const investors = groupByFund(relationships);
    return NextResponse.json(investors);
  } catch (err) {
    console.error("[GET /api/investors]", err);
    return NextResponse.json({ error: "Failed to load investors" }, { status: 500 });
  }
}
