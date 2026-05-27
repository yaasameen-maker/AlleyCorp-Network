export type WarmthTier = 'Hot' | 'Warm' | 'Cold' | 'Stale';

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
  type: 'co-investment' | 'event' | 'email' | 'meeting';
  description: string;
  date: string;
  weight: 'High' | 'Medium' | 'Low';
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
  { id: '1', name: 'Inductive Bio', url: 'inductive.bio' },
  { id: '2', name: 'Viam', url: 'viam.com' },
  { id: '3', name: 'Valar Atomics', url: 'valaratomics.com' },
  { id: '4', name: 'Portal Space Systems', url: 'portalsystems.space' },
  { id: '5', name: 'Glacier', url: 'endwaste.io' },
];

export const mockInvestors: Investor[] = [
  {
    id: '1',
    name: 'Lux Capital',
    fund: { id: 'f1', name: 'Lux Capital' },
    warmthTier: 'Stale',
    lastInteraction: 'Dec 2023',
    suggestedAction: 'Co-invested at Inductive Bio Seed but not Series A.',
    signals: [
      { type: 'co-investment', description: 'Co-invested in Inductive Bio Seed', date: 'Dec 2023', weight: 'High' }
    ],
    coInvestments: [
      { portfolioCompany: portfolioCompanies[0], round: 'Seed', date: 'Dec 2023', fundParticipated: true }
    ]
  },
  {
    id: '2',
    name: 'Riot Ventures',
    fund: { id: 'f2', name: 'Riot Ventures' },
    warmthTier: 'Hot',
    lastInteraction: 'Mar 2026',
    suggestedAction: 'Strong relationship. Led Valar Atomics Seed.',
    signals: [
      { type: 'co-investment', description: 'Led Valar Atomics Seed', date: 'Jan 2024', weight: 'High' }
    ],
    coInvestments: [
      { portfolioCompany: portfolioCompanies[2], round: 'Seed', date: 'Jan 2024', fundParticipated: true }
    ]
  }
];
