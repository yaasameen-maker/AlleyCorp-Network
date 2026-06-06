// Mock data aligned to seed.sql (Lauren Young confirmed portfolio, May 2026).

import { legacyPortfolioCompanies, toLegacyCompany, portfolioCompanyRecords } from "./portfolioCompanies";

const glacier = toLegacyCompany(portfolioCompanyRecords.find((c) => c.id === "6")!);
const valar = toLegacyCompany(portfolioCompanyRecords.find((c) => c.id === "1")!);

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
  source: string;
  weight: "High" | "Medium" | "Low";
}

export interface Investor {
  id: string;
  name: string;
  fund: Fund;
  warmthTier: WarmthTier;
  signals: Signal[];
  coInvestments: CoInvestment[];
  lastSignalDate?: string;
  suggestedAction?: string;
  contactFirstName?: string;
  contactEmail?: string;
}

export const portfolioCompanies = legacyPortfolioCompanies;

export const mockInvestors: Investor[] = [
  {
    id: "1",
    name: "Riot Ventures",
    fund: { id: "f1", name: "Riot Ventures" },
    warmthTier: "Hot",
    lastSignalDate: "Mar 2025",
    contactFirstName: "Alex",
    contactEmail: "alex@riotvc.com",
    suggestedAction:
      "Co-led Valar Atomics Seed alongside AlleyCorp (Mar 2025). Strong deep tech alignment — prioritize for next round.",
    signals: [
      {
        type: "co-investment",
        description: "Co-led Valar Atomics Seed $19M",
        date: "Mar 2025",
        source: "Crunchbase · SEC filing",
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
    lastSignalDate: "May 28 2026",
    contactFirstName: "Anna",
    contactEmail: "anna@generalcatalyst.com",
    suggestedAction:
      "Led Eyebot Series A $20M (Aug 2025) after co-leading Seed with AlleyCorp. Consistent partner across rounds.",
    signals: [
      {
        type: "co-investment",
        description: "Co-led Eyebot Seed $6M",
        date: "Jun 2024",
        source: "Crunchbase",
        weight: "High",
      },
      {
        type: "co-investment",
        description: "Led Eyebot Series A $20M",
        date: "Aug 2025",
        source: "Press release · TechCrunch",
        weight: "High",
      },
      {
        type: "event",
        description: "Both partners at AlleyCorp Deep Tech Summit",
        date: "Jan 2025",
        source: "Event attendance log",
        weight: "Medium",
      },
      {
        type: "meeting",
        description: "Partner sync on Eyebot Series B timing",
        date: "May 28 2026",
        source: "Calendar · AlleyCorp",
        weight: "Medium",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[1],
        round: "Series A",
        date: "Aug 2025",
        fundParticipated: true,
      },
      {
        portfolioCompany: portfolioCompanies[1],
        round: "Seed",
        date: "Jun 2024",
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
        source: "Crunchbase",
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
  {
    id: "4",
    name: "Flybridge",
    fund: { id: "f4", name: "Flybridge" },
    warmthTier: "Warm",
    lastSignalDate: "Jun 2024",
    contactFirstName: "Jeff",
    contactEmail: "jeff@flybridge.com",
    suggestedAction:
      "Co-invested in Halo Braid Seed (Jun 2024) — 23 months ago. Relationship approaching stale threshold. Re-engage before next Halo Braid milestone.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Halo Braid Seed",
        date: "Jun 2024",
        source: "Crunchbase",
        weight: "Medium",
      },
      {
        type: "email",
        description: "Intro thread with Halo Braid CEO",
        date: "Aug 2024",
        source: "Gmail · AlleyCorp inbox",
        weight: "Low",
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
  {
    id: "5",
    name: "Trimble Ventures",
    fund: { id: "f5", name: "Trimble Ventures" },
    warmthTier: "Stale",
    lastSignalDate: "Sep 2022",
    contactFirstName: "Chris",
    suggestedAction:
      "Co-invested at Civ Robotics Seed (Sep 2022) but did not return for Series A (Jul 2025). 44 months of silence — relationship at risk. Outreach recommended before Series B.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Civ Robotics Seed $5M",
        date: "Sep 2022",
        source: "Crunchbase · AlleyCorp deal memo",
        weight: "Medium",
      },
      {
        type: "co-investment",
        description: "Did not participate in Civ Robotics Series A $7.5M",
        date: "Jul 2025",
        source: "Crunchbase · inferred absence",
        weight: "Medium",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[4],
        round: "Series A",
        date: "Jul 2025",
        fundParticipated: false,
      },
      {
        portfolioCompany: portfolioCompanies[4],
        round: "Seed",
        date: "Sep 2022",
        fundParticipated: true,
      },
    ],
  },
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
  {
    id: "7",
    name: "Lux Capital",
    fund: { id: "f7", name: "Lux Capital" },
    warmthTier: "Stale",
    lastSignalDate: "Jan 2023",
    contactFirstName: "Josh",
    suggestedAction:
      "Co-invested in Glacier Series A (Jan 2023) — 41 months of silence. Climate portfolio overlap remains strong — schedule a re-intro before Glacier's next raise.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Glacier Series A",
        date: "Jan 2023",
        source: "Crunchbase",
        weight: "Medium",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: glacier,
        round: "Series A",
        date: "Jan 2023",
        fundParticipated: true,
      },
    ],
  },
  {
    id: "8",
    name: "Snowpoint Ventures",
    fund: { id: "f8", name: "Snowpoint Ventures" },
    warmthTier: "Warm",
    lastSignalDate: "Feb 2025",
    contactFirstName: "Sarah",
    suggestedAction:
      "Co-led Valar Atomics Seed with AlleyCorp (Feb 2025) — 16 months since last touch. Re-engage ahead of Valar's next milestone.",
    signals: [
      {
        type: "co-investment",
        description: "Co-led Valar Atomics Seed",
        date: "Feb 2025",
        source: "Crunchbase · SEC filing",
        weight: "High",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: valar,
        round: "Seed",
        date: "Feb 2025",
        fundParticipated: true,
      },
    ],
  },
];
