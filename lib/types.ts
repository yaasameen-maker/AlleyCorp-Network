export type WarmthTier = "Hot" | "Warm" | "Stale" | "Cold";

export type SignalType =
  | "co_investment"
  | "event_attendance"
  | "linkedin_connection"
  | "press_mention"
  | "co_investment_recency";

export interface Fund {
  id: string;
  name: string;
  focus?: string;
  aumTier?: string;
  emergingManager?: boolean;
  website?: string;
  stage?: string;
  hqLocation?: string;
  linkedinUrl?: string;
  notes?: string;
}

export interface Investor {
  id: string;
  name: string;
  fundId: string;
  fund?: Fund;
  role: string;
  linkedinUrl?: string;
  stageFocus?: string;
  email?: string;
  sectorFocus?: string;
  location?: string;
  alleyContact?: string;
  notes?: string;
}

export interface PortfolioCompany {
  id: string;
  name: string;
  sector: string;
  stage: string;
  alleycorpRole: string;
  status: "active" | "alumni";
  website?: string;
  team?: string;
  foundedYear?: number;
  notes?: string;
}

export interface Signal {
  id: string;
  relationshipId: string;
  type: SignalType;
  date: string;
  source: string;
  value: string;
  weight: "high" | "medium" | "low";
  confidence?: "confirmed" | "inferred" | "pending";
}

export interface Relationship {
  id: string;
  fundId: string;
  fund?: Fund;
  investorId?: string;
  portfolioCompanyId: string;
  portfolioCompany?: PortfolioCompany;
  alleyPartner: string;
  warmthTier: WarmthTier;
  warmthCalculatedAt?: string;
  lastSignalDate?: string;
  override?: boolean;
  overrideNote?: string;
  overrideBy?: string;
  overrideAt?: string;
  signals?: Signal[];
}

// ── View models ───────────────────────────────────────────────────────

export interface CoInvestment {
  companyName: string;
  round: string;
  date: string;
  alleyRole: string;
}

export interface InvestorProfile {
  fundName: string;
  warmthTier: WarmthTier;
  lastSignalDate?: string;
  coInvestments: CoInvestment[];
  signals: Signal[];
  suggestedAction: string;
}

export interface DigestItem {
  type: "WARMTH_CHANGE" | "NEW_CO_INVESTOR" | "STALE_ALERT";
  fundName: string;
  summary: string;
  deepLinkPath: string; // e.g. /investors/lux-capital
  generatedAt: string;
}
