import { canEnrichProfile, hostnameFromUrl, sourceNameFromUrl } from "./source-policy";

export type ProspectReviewStatus = "accepted_for_market_map" | "candidate_only" | "rejected";
export type ProspectEvidenceField =
  | "teamLocation"
  | "stageFocus"
  | "geographyFocus"
  | "aumTier"
  | "checkSizeProxy"
  | "deepTechEvidence";

export interface ProspectFieldEvidence {
  field: ProspectEvidenceField;
  sourceUrl: string;
  sourceTitle?: string;
  rawSnippet: string;
}

export interface InvestorProspectCandidate {
  fundName: string;
  aliases?: string[];
  website?: string;
  discoverySourceUrl: string;
  discoverySourceTitle?: string;
  teamLocation?: string | null;
  stageFocus?: string | null;
  geographyFocus?: string | null;
  aumTier?: string | null;
  checkSizeProxy?: string | null;
  deepTechEvidence?: string | null;
  profileSourceUrls?: string[];
  fieldEvidence?: ProspectFieldEvidence[];
  qualityWarnings?: string[];
}

export interface ReviewedInvestorProspect extends InvestorProspectCandidate {
  status: ProspectReviewStatus;
  sourceName: string;
  rejectionReasons: string[];
  acceptedProfileSources: string[];
  acceptedFieldEvidence: ProspectFieldEvidence[];
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function isUnknownValue(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return !hasText(value) || /\bunknown\b|verify before/i.test(value);
}

function isOfficialWebsiteSource(sourceUrl: string, website: string | undefined): boolean {
  if (!hasText(website)) return false;
  return hostnameFromUrl(sourceUrl) === hostnameFromUrl(website!);
}

function isEligibleProfileSource(sourceUrl: string, website: string | undefined): boolean {
  return canEnrichProfile(sourceUrl) || isOfficialWebsiteSource(sourceUrl, website);
}

const PROFILE_FIELDS: ProspectEvidenceField[] = [
  "teamLocation",
  "stageFocus",
  "geographyFocus",
  "aumTier",
  "checkSizeProxy",
  "deepTechEvidence",
];

export function reviewInvestorProspectCandidate(
  candidate: InvestorProspectCandidate
): ReviewedInvestorProspect {
  const rejectionReasons: string[] = [];
  const candidateOnlyReasons: string[] = [];
  const fieldEvidence = candidate.fieldEvidence ?? [];
  const profileSourceUrls = [
    ...(candidate.profileSourceUrls ?? []),
    ...fieldEvidence.map((evidence) => evidence.sourceUrl),
  ];
  const acceptedProfileSources = [...new Set(profileSourceUrls)].filter((url) =>
    isEligibleProfileSource(url, candidate.website)
  );
  const acceptedFieldEvidence = fieldEvidence.filter(
    (evidence) =>
      hasText(evidence.sourceUrl) &&
      hasText(evidence.rawSnippet) &&
      isEligibleProfileSource(evidence.sourceUrl, candidate.website)
  );
  const discoverySourceName = sourceNameFromUrl(candidate.discoverySourceUrl);

  if (!hasText(candidate.fundName)) {
    rejectionReasons.push("missing fund name");
  }

  if (!hasText(candidate.discoverySourceUrl)) {
    rejectionReasons.push("missing discovery source URL");
  }

  if (!hasText(candidate.website)) {
    candidateOnlyReasons.push("missing fund website");
  }

  if (!hasText(candidate.deepTechEvidence)) {
    candidateOnlyReasons.push("missing deep tech evidence");
  }

  if (profileSourceUrls.length === 0) {
    candidateOnlyReasons.push("missing profile source URL");
  } else if (acceptedProfileSources.length === 0) {
    candidateOnlyReasons.push("no profile source is eligible for enrichment");
  }

  // Hard warnings block acceptance — data is untrustworthy.
  // Soft warnings (unknown optional fields, official website label mismatch) are
  // informational only; the profile just shows what it has and omits the rest.
  const HARD_WARNING_PREFIXES = [
    "source evidence contains placeholder text",
    "fund name is not visible in captured evidence snippets",
  ];
  const hardWarnings = (candidate.qualityWarnings ?? []).filter((w) =>
    HARD_WARNING_PREFIXES.some((prefix) => w.startsWith(prefix))
  );
  if (hardWarnings.length > 0) {
    candidateOnlyReasons.push(`quality warnings present: ${hardWarnings.join("; ")}`);
  }

  // Only deepTechEvidence requires a source-backed evidence entry for acceptance.
  // Optional profile fields (location, stage, AUM, geography, check size) display
  // when present and are omitted from the UI when Unknown — they do not block acceptance.
  if (!isUnknownValue(candidate.deepTechEvidence)) {
    const hasDeepTechEvidence = acceptedFieldEvidence.some((e) => e.field === "deepTechEvidence");
    if (!hasDeepTechEvidence) {
      candidateOnlyReasons.push("missing source evidence for deepTechEvidence");
    }
  }

  if (rejectionReasons.length > 0) {
    return {
      ...candidate,
      status: "rejected",
      sourceName: discoverySourceName,
      rejectionReasons,
      acceptedProfileSources,
      acceptedFieldEvidence,
    };
  }

  if (candidateOnlyReasons.length > 0) {
    return {
      ...candidate,
      status: "candidate_only",
      sourceName: discoverySourceName,
      rejectionReasons: candidateOnlyReasons,
      acceptedProfileSources,
      acceptedFieldEvidence,
    };
  }

  return {
    ...candidate,
    status: "accepted_for_market_map",
    sourceName: discoverySourceName,
    rejectionReasons,
    acceptedProfileSources,
    acceptedFieldEvidence,
  };
}
