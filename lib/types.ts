export type WarmthTier = "Hot" | "Warm" | "Stale" | "Cold";

export type SignalType =
  | "co_investment"
  | "co_investment_recency"
  | "event_attendance"
  | "linkedin_connection"
  | "press_mention"
  | "email_thread"
  | "email_contact";

export interface Fund {
  id: string;
  name: string;
  focus?: string;
  aumTier?: string;
  emergingManager?: boolean;
  website?: string;
  logoUrl?: string;
  stage?: string;
  hqLocation?: string;
  geographyFocus?: string;
  checkSizeProxy?: string;
  deepTechSignal?: string;
  investorStatus?: string;
  isVip?: boolean;
  profileLastCheckedAt?: string;
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
  sourceUrl?: string;
  sourceTitle?: string;
  rawSnippet?: string;
  uniqueHash?: string;
  value: string;
  weight: "high" | "medium" | "low";
  confidence?: "confirmed" | "inferred" | "pending";
}

export interface RelationshipInvestor {
  id: string;
  name: string;
  role: string;
  linkedinUrl?: string;
}

// How this fund entered the system.
export type DiscoverySource = "manual" | "portfolio_scan" | "network_expansion";

// Structured explanation stored as JSONB in relationship.discovery_context.
// Phase 1 (portfolio_scan): source article + round details.
// Phase 2 (network_expansion): network path + evidence count.
export interface DiscoveryContext {
  // Phase 1
  source_url?: string;
  round?: string;
  company?: string;
  // Phase 2
  via_fund?: string;
  shared_rounds?: number;
  companies?: string[]; // non-AlleyCorp companies where overlap was observed
  oldest_signal_months?: number;
  // Both
  summary: string;
}

export interface Relationship {
  id: string;
  fundId: string;
  fund?: Fund;
  investor?: RelationshipInvestor | null;
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
  discoverySource?: DiscoverySource;
  discoveryContext?: DiscoveryContext | null;
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
