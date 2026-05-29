// Mock data aligned to seed.sql (Lauren Young confirmed portfolio, May 2026).
// Source of truth for company names: PORTFOLIO.md
// This file is used for UI development until API routes are wired to the live DB.

export type WarmthTier = "Hot" | "Warm" | "Cold" | "Stale";

export interface PortfolioCompany {
  id: string;
  name: string;
  url: string;
}

export interface Fund {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface CoInvestment {
  portfolioCompany: PortfolioCompany;
  round: string;
  date: string;
  fundParticipated: boolean;
}

export interface Signal {
  type: "co-investment" | "event" | "email" | "meeting";
  description: string;
  date: string;
  weight: "High" | "Medium" | "Low";
}

export interface Investor {
  id: string;
  name: string;
  fund: Fund;
  warmthTier: WarmthTier;
  signals: Signal[];
  coInvestments: CoInvestment[];
  // Date of the most recent signal (real evidence) on the relationship.
  // Mirrors backend Relationship.lastSignalDate (lib/types.ts). NOT derived from
  // the signals array — it is the authoritative last_signal_date from the seed.
  // Undefined for Cold relationships that have no signals yet.
  lastSignalDate?: string;
  suggestedAction?: string;
}

// Only companies referenced by mock investors below.
// Full list of 17 active companies is in PORTFOLIO.md.
export const portfolioCompanies: PortfolioCompany[] = [
  { id: "1", name: "Valar Atomics",        url: "valaratomics.com" },
  { id: "2", name: "Eyebot",               url: "eyebot.tech" },
  { id: "3", name: "Portal Space Systems", url: "portalsystems.space" },
  { id: "4", name: "Halo Braid",           url: "halobraid.com" },
  { id: "5", name: "Civ Robotics",         url: "civrobotics.com" },
];

export const mockInvestors: Investor[] = [
  // ── HOT ─────────────────────────────────────────────────────────────────────

  {
    id: "1",
    name: "Riot Ventures",
    fund: { id: "f1", name: "Riot Ventures" },
    warmthTier: "Hot",
    lastSignalDate: "Mar 2025",
    suggestedAction:
      "Co-led Valar Atomics Seed alongside AlleyCorp (Mar 2025). Strong deep tech alignment — prioritize for next round.",
    signals: [
      {
        type: "co-investment",
        description: "Co-led Valar Atomics Seed $19M",
        date: "Mar 2025",
        weight: "High",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[0],
        round: "Seed",
        date: "Mar 2025",
        fundParticipated: true,
      },
    ],
  },

  {
    id: "2",
    name: "General Catalyst",
    fund: { id: "f2", name: "General Catalyst" },
    warmthTier: "Hot",
    lastSignalDate: "Aug 2025",
    suggestedAction:
      "Led Eyebot Series A $20M (Aug 2025) after co-leading Seed with AlleyCorp. Consistent partner across rounds.",
    signals: [
      {
        type: "co-investment",
        description: "Co-led Eyebot Seed $6M",
        date: "Jun 2024",
        weight: "High",
      },
      {
        type: "co-investment",
        description: "Led Eyebot Series A $20M",
        date: "Aug 2025",
        weight: "High",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[1],
        round: "Seed",
        date: "Jun 2024",
        fundParticipated: true,
      },
      {
        portfolioCompany: portfolioCompanies[1],
        round: "Series A",
        date: "Aug 2025",
        fundParticipated: true,
      },
    ],
  },

  {
    id: "3",
    name: "Mach33",
    fund: { id: "f3", name: "Mach33" },
    warmthTier: "Hot",
    lastSignalDate: "Apr 2025",
    suggestedAction:
      "Co-led Portal Space Systems Seed (Apr 2025). Top space tech fund — keep warm ahead of Series A.",
    signals: [
      {
        type: "co-investment",
        description: "Co-led Portal Space Systems Seed",
        date: "Apr 2025",
        weight: "High",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[2],
        round: "Seed",
        date: "Apr 2025",
        fundParticipated: true,
      },
    ],
  },

  // ── WARM ────────────────────────────────────────────────────────────────────

  {
    id: "4",
    name: "Flybridge",
    fund: { id: "f4", name: "Flybridge" },
    warmthTier: "Warm",
    lastSignalDate: "Jun 2024",
    suggestedAction:
      "Co-invested in Halo Braid Seed (Jun 2024) — 23 months ago. Relationship approaching stale threshold. Re-engage before next Halo Braid milestone.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Halo Braid Seed",
        date: "Jun 2024",
        weight: "Medium",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[3],
        round: "Seed",
        date: "Jun 2024",
        fundParticipated: true,
      },
    ],
  },

  // ── STALE ───────────────────────────────────────────────────────────────────

  {
    id: "5",
    name: "Trimble Ventures",
    fund: { id: "f5", name: "Trimble Ventures" },
    warmthTier: "Stale",
    lastSignalDate: "Sep 2022",
    suggestedAction:
      "Co-invested at Civ Robotics Seed (Sep 2022) but did not return for Series A (Jul 2025). 44 months of silence — relationship at risk. Outreach recommended before Series B.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Civ Robotics Seed $5M",
        date: "Sep 2022",
        weight: "Medium",
      },
      {
        type: "co-investment",
        description: "Did not participate in Civ Robotics Series A $7.5M",
        date: "Jul 2025",
        weight: "Medium",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[4],
        round: "Seed",
        date: "Sep 2022",
        fundParticipated: true,
      },
      {
        portfolioCompany: portfolioCompanies[4],
        round: "Series A",
        date: "Jul 2025",
        fundParticipated: false,
      },
    ],
  },

  // ── COLD ────────────────────────────────────────────────────────────────────

  {
    id: "6",
    name: "a16z American Dynamism",
    fund: { id: "f6", name: "a16z American Dynamism" },
    warmthTier: "Cold",
    lastSignalDate: undefined,
    suggestedAction:
      "No co-investment yet. Top defense/manufacturing fund with strong thesis overlap — Cargo Robotics is a natural intro. High-value target.",
    signals: [],
    coInvestments: [],
  },
];
