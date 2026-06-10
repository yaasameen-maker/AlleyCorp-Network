/**
 * Shared contracts for the relationship discovery pipeline.
 *
 * Used by all adapters (substackAdapter, eventPageAdapter, eventExportAdapter)
 * and the top-level discovery agent. Keeps the adapter layer decoupled from
 * DB schema — signal type mapping to DB lowercase happens at write time.
 */

// ── Signal + event types ──────────────────────────────────────────────────────

export type DiscoverySignalType =
  | "CO_INVESTMENT"
  | "ROUND_PARTICIPATION"
  | "MISSED_FOLLOW_ON"
  | "PRESS_CO_MENTION"
  | "EVENT_PARTICIPATION";

export type EventRole =
  | "speaker"
  | "panelist"
  | "sponsor"
  | "host"
  | "partner"
  | "attendee"
  | "venue";

export type ConfidenceLevel = "high" | "medium" | "low";

// ── Source record ─────────────────────────────────────────────────────────────
// Every signal candidate must link back to one of these.

export interface SourceRecord {
  sourceId: string; // stable hash of url + retrievedAt date
  url: string;
  title: string;
  sourceType: "press_release" | "news_article" | "newsletter" | "event_page" | "event_export";
  publisher?: string;
  publishedAt?: string; // YYYY-MM-DD
  retrievedAt: string; // YYYY-MM-DD
}

// ── Signal candidate ──────────────────────────────────────────────────────────
// Raw output from any adapter. Not yet written to DB — semantic layer resolves
// entity IDs and gold layer computes warmth tiers from these.

export interface DiscoverySignalCandidate {
  tempId: string; // stable composite key for deduplication
  portfolioCompanyName?: string;
  fundName?: string;
  investorName?: string;
  signalType: DiscoverySignalType;
  signalDate?: string; // YYYY-MM-DD
  sourceId: string; // foreign key to SourceRecord
  evidenceSnippet: string; // exact quote from source, max 300 chars
  confidence: ConfidenceLevel;
  value?: string; // human-readable signal summary
  metadata?: {
    roundName?: string;
    stage?: string;
    amount?: number;
    currency?: string;
    eventName?: string;
    venue?: string;
    city?: string;
    role?: EventRole;
    counterpartyName?: string;
  };
}

// ── Adapter I/O contracts ─────────────────────────────────────────────────────

export interface RelationshipDiscoveryInput {
  portfolioCompanies: string[];
  knownFunds: string[];
  knownInvestors: string[];
  eventPageUrls?: string[];
  eventExportFiles?: {
    filePath: string;
    title: string;
    publishedAt?: string;
  }[];
  maxSourcesPerCompany?: number;
}

export interface RelationshipDiscoveryOutput {
  sources: SourceRecord[];
  signals: DiscoverySignalCandidate[];
}

// ── DB signal type mapping ────────────────────────────────────────────────────
// Discovery layer uses uppercase. DB schema uses lowercase.
// All DB writes go through this map.

export const SIGNAL_TYPE_TO_DB: Record<DiscoverySignalType, string> = {
  CO_INVESTMENT: "co_investment",
  ROUND_PARTICIPATION: "co_investment",
  MISSED_FOLLOW_ON: "co_investment",
  PRESS_CO_MENTION: "press_mention",
  EVENT_PARTICIPATION: "event_attendance",
};
