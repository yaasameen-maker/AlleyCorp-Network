export type WarmthTier = "Hot" | "Warm" | "Stale" | "Cold";

export type SignalType =
  | "co_investment"
  | "event_attendance"
  | "linkedin_connection"
  | "press_mention"
  | "recency";

export interface Fund {
  id: string;
  name: string;
  focus: string;
  aumTier?: string;
  emergingManager: boolean;
  website?: string;
}

export interface Investor {
  id: string;
  name: string;
  fundId: string;
  fund?: Fund;
  role: string;
  linkedin?: string;
  stageFocus?: string;
}

export interface PortfolioCompany {
  id: string;
  name: string;
  sector: string;
  stage: string;
  alleycorpRole: string;
  website?: string;
}

export interface Signal {
  id: string;
  relationshipId: string;
  type: SignalType;
  date: string;
  source: string;
  value: string;
  confidence: "high" | "medium" | "low";
}

export interface Relationship {
  id: string;
  fundId: string;
  fund?: Fund;
  portfolioCompanyId: string;
  portfolioCompany?: PortfolioCompany;
  alleyPartner: string;
  warmthTier: WarmthTier;
  lastSignalDate?: string;
  overrideNote?: string;
  signals?: Signal[];
}
