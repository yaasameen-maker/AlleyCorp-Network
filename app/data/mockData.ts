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
  lastInteraction?: string;
  suggestedAction?: string;
}

export const portfolioCompanies: PortfolioCompany[] = [
  { id: "1", name: "Inductive Bio", url: "inductive.bio" },
  { id: "2", name: "Viam", url: "viam.com" },
  { id: "3", name: "Valar Atomics", url: "valaratomics.com" },
  { id: "4", name: "Portal Space Systems", url: "portalsystems.space" },
  { id: "5", name: "Glacier", url: "endwaste.io" },
];

export const mockInvestors: Investor[] = [
  {
    id: "1",
    name: "Lux Capital",
    fund: { id: "f1", name: "Lux Capital" },
    warmthTier: "Stale",
    lastInteraction: "Dec 2023",
    suggestedAction:
      "Co-invested at Inductive Bio Seed (Dec 2023) but not at Series A (May 2025). Relationship may be cooling.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Inductive Bio Seed",
        date: "Dec 2023",
        weight: "High",
      },
      {
        type: "co-investment",
        description: "Did not participate in Inductive Bio Series A",
        date: "May 2025",
        weight: "Medium",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[0],
        round: "Seed",
        date: "Dec 2023",
        fundParticipated: true,
      },
      {
        portfolioCompany: portfolioCompanies[0],
        round: "Series A",
        date: "May 2025",
        fundParticipated: false,
      },
    ],
  },
  {
    id: "2",
    name: "Riot Ventures",
    fund: { id: "f2", name: "Riot Ventures" },
    warmthTier: "Hot",
    lastInteraction: "Mar 2026",
    suggestedAction:
      "Strong relationship. Led Valar Atomics Seed. Consider for future co-investment opportunities.",
    signals: [
      {
        type: "co-investment",
        description: "Led Valar Atomics Seed",
        date: "Jan 2024",
        weight: "High",
      },
      {
        type: "meeting",
        description: "Partner meeting at SF office",
        date: "Feb 2026",
        weight: "High",
      },
      {
        type: "email",
        description: "Intro thread re: deep tech deal flow",
        date: "Mar 2026",
        weight: "Medium",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[2],
        round: "Seed",
        date: "Jan 2024",
        fundParticipated: true,
      },
    ],
  },
  {
    id: "3",
    name: "Snowpoint Ventures",
    fund: { id: "f3", name: "Snowpoint Ventures" },
    warmthTier: "Hot",
    lastInteraction: "Apr 2026",
    suggestedAction: "Strong relationship. Co-invested in Valar Atomics Series A.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Valar Atomics Series A",
        date: "Apr 2026",
        weight: "High",
      },
      {
        type: "event",
        description: "Met at Defense Tech Summit",
        date: "Mar 2026",
        weight: "Medium",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[2],
        round: "Series A",
        date: "Apr 2026",
        fundParticipated: true,
      },
    ],
  },
  {
    id: "4",
    name: "General Catalyst",
    fund: { id: "f4", name: "General Catalyst" },
    warmthTier: "Hot",
    lastInteraction: "May 2026",
    suggestedAction: "Strong relationship. Multiple co-investments across portfolio.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Viam Series B",
        date: "May 2026",
        weight: "High",
      },
      {
        type: "meeting",
        description: "Lunch with partner re: AI infra thesis",
        date: "May 2026",
        weight: "Medium",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[1],
        round: "Series B",
        date: "May 2026",
        fundParticipated: true,
      },
    ],
  },
  {
    id: "5",
    name: "Founders Fund",
    fund: { id: "f5", name: "Founders Fund" },
    warmthTier: "Hot",
    lastInteraction: "May 2026",
    suggestedAction: "Led Portal Space Series A. High signal partner relationship.",
    signals: [
      {
        type: "co-investment",
        description: "Led Portal Space Series A",
        date: "Feb 2026",
        weight: "High",
      },
      {
        type: "email",
        description: "Follow-up on space/defense thesis alignment",
        date: "May 2026",
        weight: "High",
      },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[3],
        round: "Series A",
        date: "Feb 2026",
        fundParticipated: true,
      },
    ],
  },
  {
    id: "6",
    name: "Andreessen Horowitz",
    fund: { id: "f6", name: "Andreessen Horowitz" },
    warmthTier: "Warm",
    lastInteraction: "Feb 2026",
    suggestedAction: "One co-investment last year. Re-engage on climate thesis.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Glacier Series A",
        date: "Aug 2025",
        weight: "High",
      },
      { type: "event", description: "Brief chat at a16z summit", date: "Feb 2026", weight: "Low" },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[4],
        round: "Series A",
        date: "Aug 2025",
        fundParticipated: true,
      },
    ],
  },
  {
    id: "7",
    name: "Sequoia Capital",
    fund: { id: "f7", name: "Sequoia Capital" },
    warmthTier: "Cold",
    lastInteraction: "Jul 2025",
    suggestedAction: "Limited recent contact. Worth a check-in given pipeline overlap.",
    signals: [
      {
        type: "co-investment",
        description: "Co-invested in Viam Series A",
        date: "Mar 2024",
        weight: "Medium",
      },
      { type: "email", description: "Quarterly update reply", date: "Jul 2025", weight: "Low" },
    ],
    coInvestments: [
      {
        portfolioCompany: portfolioCompanies[1],
        round: "Series A",
        date: "Mar 2024",
        fundParticipated: true,
      },
    ],
  },
];
