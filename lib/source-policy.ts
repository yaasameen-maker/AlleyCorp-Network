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

export const CANDIDATE_ONLY_DOMAINS = [
  "crunchbase.com",
  "news.crunchbase.com",
  "pitchbook.com",
  "openvc.app",
  "airtable.com",
  "docs.google.com",
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
  if (hostMatches(hostname, VERIFIED_NEWS_DOMAINS)) return "verified_candidate";
  if (hostMatches(hostname, MEDIUM_CONFIDENCE_DOMAINS)) return "verified_candidate";

  return "profile_enrichment";
}

export function confidenceFromUrl(url: string): SourceConfidence {
  const hostname = hostnameFromUrl(url);

  if (hostMatches(hostname, CANDIDATE_ONLY_DOMAINS)) return "low";
  if (hostMatches(hostname, VERIFIED_NEWS_DOMAINS)) return "high";
  if (hostMatches(hostname, RELATIONSHIP_SIGNAL_DOMAINS)) return "high";
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

  return hostname;
}

export function canAutoPublishSource(url: string): boolean {
  return sourceUseFromUrl(url) !== "candidate_only" && confidenceFromUrl(url) === "high";
}
