export type SourceConfidence = "high" | "medium" | "low";
export type SourceUse =
  | "verified_candidate"
  | "relationship_signal"
  | "profile_enrichment"
  | "candidate_only";

export const VERIFIED_NEWS_DOMAINS = [
  "axios.com",
  "techcrunch.com",
  "prnewswire.com",
  "businesswire.com",
  "reuters.com",
  "bloomberg.com",
  "venturebeat.com",
] as const;

export const MEDIUM_CONFIDENCE_DOMAINS = ["forbes.com", "wsj.com", "ft.com", "cnbc.com"] as const;

export const RELATIONSHIP_SIGNAL_DOMAINS = [
  "alleycorp.substack.com",
  "substack.com",
  "podcasts.apple.com",
  "spotify.com",
] as const;

export const INVESTOR_PROFILE_SOURCE_TYPES = [
  "fund_website",
  "sec_iapd",
  "sec_edgar",
  "linkedin_public",
  "company_press",
] as const;

// Public regulatory filings — high-trust sources for investor profile fields
// (AUM tier, team location, registration). Used by the enrichment agent, not for
// relationship signals. See Sprint June 14-17 Section 3 "Investor Profile Sources".
export const REGULATORY_PROFILE_DOMAINS = [
  "sec.gov",
  "adviserinfo.sec.gov",
  "reports.adviserinfo.sec.gov",
  "efts.sec.gov",
] as const;

// Open investor directories and shared lists. They can DISCOVER candidate investors
// but must never create a verified relationship signal on their own — the agent has
// to confirm the claim against an accessible primary source first.
export const CANDIDATE_ONLY_DOMAINS = [
  "crunchbase.com",
  "news.crunchbase.com",
  "pitchbook.com",
  "openvc.app",
  "differentfunds.com",
  "airtable.com",
  "docs.google.com",
  "notion.so",
  "coda.io",
] as const;

export function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function hostMatches(hostname: string, domains: readonly string[]): boolean {
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

export function sourceUseFromUrl(url: string): SourceUse {
  const hostname = hostnameFromUrl(url);

  if (hostMatches(hostname, CANDIDATE_ONLY_DOMAINS)) return "candidate_only";
  if (hostMatches(hostname, RELATIONSHIP_SIGNAL_DOMAINS)) return "relationship_signal";
  if (hostMatches(hostname, REGULATORY_PROFILE_DOMAINS)) return "profile_enrichment";
  if (hostMatches(hostname, VERIFIED_NEWS_DOMAINS)) return "verified_candidate";
  if (hostMatches(hostname, MEDIUM_CONFIDENCE_DOMAINS)) return "verified_candidate";

  return "profile_enrichment";
}

export function confidenceFromUrl(url: string): SourceConfidence {
  const hostname = hostnameFromUrl(url);

  if (hostMatches(hostname, CANDIDATE_ONLY_DOMAINS)) return "low";
  if (hostMatches(hostname, VERIFIED_NEWS_DOMAINS)) return "high";
  if (hostMatches(hostname, RELATIONSHIP_SIGNAL_DOMAINS)) return "high";
  if (hostMatches(hostname, REGULATORY_PROFILE_DOMAINS)) return "high";
  if (hostMatches(hostname, MEDIUM_CONFIDENCE_DOMAINS)) return "medium";

  return "low";
}

export function sourceNameFromUrl(url: string): string {
  const hostname = hostnameFromUrl(url);

  if (hostname.includes("techcrunch.com")) return "TechCrunch";
  if (hostname.includes("prnewswire.com")) return "PR Newswire";
  if (hostname.includes("businesswire.com")) return "Business Wire";
  if (hostname.includes("crunchbase.com")) return "Crunchbase";
  if (hostname.includes("axios.com")) return "Axios";
  if (hostname.includes("reuters.com")) return "Reuters";
  if (hostname.includes("bloomberg.com")) return "Bloomberg";
  if (hostname.includes("forbes.com")) return "Forbes";
  if (hostname.includes("wsj.com")) return "Wall Street Journal";
  if (hostname.includes("ft.com")) return "Financial Times";
  if (hostname.includes("cnbc.com")) return "CNBC";
  if (hostname.includes("venturebeat.com")) return "VentureBeat";
  if (hostname.includes("substack.com")) return "Substack";
  if (hostname.includes("podcasts.apple.com")) return "Apple Podcasts";
  if (hostname.includes("spotify.com")) return "Spotify";
  if (hostname.includes("sec.gov")) return "SEC";
  if (hostname.includes("openvc.app")) return "OpenVC";
  if (hostname.includes("differentfunds.com")) return "DifferentFunds";
  if (hostname.includes("pitchbook.com")) return "PitchBook";

  return hostname;
}

export function canAutoPublishSource(url: string): boolean {
  return sourceUseFromUrl(url) !== "candidate_only" && confidenceFromUrl(url) === "high";
}

// ── Discovery vs. publication gates ───────────────────────────────────────────
// Sprint June 14-17 rule: discovery/enrichment agents may surface CANDIDATES from
// many sources, but only verified relationship/news/regulatory sources may publish
// a signal that affects warmth or Today Overview. Open directories are leads only.

// True when the source is an open directory or aggregator that should be treated as
// a lead for follow-up research, never as standalone verified evidence.
export function isCandidateOnlySource(url: string): boolean {
  return sourceUseFromUrl(url) === "candidate_only";
}

// True when a signal from this source may be published to live relationship state.
// Stricter than canAutoPublishSource: a relationship signal must come from a credible
// news source or an AlleyCorp relationship source (Substack/podcast). High-confidence
// profile sources like SEC filings back profile fields, not co-investment claims.
export function canPublishRelationshipSignal(url: string): boolean {
  const use = sourceUseFromUrl(url);
  const publishable = use === "verified_candidate" || use === "relationship_signal";
  return publishable && confidenceFromUrl(url) === "high";
}

// True when a source may back an investor PROFILE field (location, AUM tier, stage).
// Broader than publishing a relationship signal — accepts medium-confidence press and
// regulatory filings — but still excludes candidate-only directories and unknown hosts.
export function canEnrichProfile(url: string): boolean {
  return !isCandidateOnlySource(url) && confidenceFromUrl(url) !== "low";
}
