// Mock data — fallback for local dev when DATABASE_URL is not set.
// Types are imported from lib/investors (the real source of truth).
// Source of truth for company names: PORTFOLIO.md

import type { Investor, PortfolioCompany } from "@/lib/investors";

// Re-export so any file that still imports types from here keeps working.
export type { Investor };
export type { WarmthTier, DiscoveryContext, DiscoverySource, CoInvestment } from "@/lib/investors";
// InvestorSignal is the real name; Signal is the old alias used by stories/warmthAnalysis.
export type { InvestorSignal as Signal } from "@/lib/investors";

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
        portfolioCompanyName: "Valar Atomics",
        sourceUrl: "https://alleycorp.substack.com",
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
        portfolioCompanyName: "Eyebot",
      },
      {
        type: "co-investment",
        description: "Led Eyebot Series A $20M",
        date: "Aug 2025",
        weight: "High",
        portfolioCompanyName: "Eyebot",
        sourceUrl: "https://alleycorp.substack.com",
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
      "Co-led Portal Space Systems Seed (Apr 2025). Top space tech fund. Keep warm ahead of Series A.",
    signals: [
      {
        type: "co-investment",
        description: "Co-led Portal Space Systems Seed",
        date: "Apr 2025",
        weight: "High",
        portfolioCompanyName: "Portal Space Systems",
        sourceUrl: "https://alleycorp.substack.com",
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
        portfolioCompanyName: "Halo Braid",
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
      "Co-invested at Civ Robotics Seed (Sep 2022) but did not return for Series A (Jul 2025). 44 months of silence. Relationship at risk. Outreach recommended before Series B.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Civ Robotics Seed $5M",
        date: "Sep 2022",
        weight: "Medium",
        portfolioCompanyName: "Civ Robotics",
      },
      {
        type: "co-investment",
        description: "Did not participate in Civ Robotics Series A $7.5M",
        date: "Jul 2025",
        weight: "Medium",
        portfolioCompanyName: "Civ Robotics",
        sourceUrl: "https://alleycorp.substack.com",
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
      "No co-investment yet. Top defense/manufacturing fund with strong thesis overlap. Cargo Robotics is a natural intro. High-value target.",
    signals: [],
    coInvestments: [],
  },
];
