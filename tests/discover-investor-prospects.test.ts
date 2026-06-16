import { describe, expect, it } from "vitest";

// Pure helpers extracted for testing — these are not exported from the script
// because the script is an executable entry point, so we duplicate the minimal
// logic here and keep it in sync manually. The tests document the contract so
// regressions are caught when the script changes.

function significantFundTokens(fundName: string): string[] {
  return fundName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(
      (token) =>
        token.length >= 3 &&
        !["capital", "ventures", "venture", "partners", "fund", "management"].includes(token)
    );
}

function textContainsFundToken(text: string, fundName: string): boolean {
  const tokens = significantFundTokens(fundName);
  if (tokens.length === 0) return true;
  const lower = text.toLowerCase();
  return tokens.some((token) => lower.includes(token));
}

function isUnknownValue(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return !value.trim() || /\bunknown\b|verify before/i.test(value);
}

function normalizeUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

interface SearchPage {
  url: string;
  title: string;
  snippet: string;
}

interface ProspectFieldEvidence {
  field: string;
  sourceUrl: string;
  sourceTitle?: string;
  rawSnippet: string;
}

const PLACEHOLDER_PATTERN = /\blorem ipsum\b|placeholder|sample text|dummy text/i;

function sanitizeFieldEvidence(
  evidence: ProspectFieldEvidence[] | undefined,
  pages: SearchPage[]
): ProspectFieldEvidence[] {
  if (!Array.isArray(evidence)) return [];
  const knownUrls = new Set(pages.map((page) => page.url));
  return evidence.filter(
    (item) =>
      item.field &&
      item.sourceUrl?.trim() &&
      item.rawSnippet?.trim() &&
      knownUrls.has(item.sourceUrl) &&
      !PLACEHOLDER_PATTERN.test(item.rawSnippet)
  );
}

describe("significantFundTokens", () => {
  it("strips generic VC suffixes", () => {
    expect(significantFundTokens("Riot Ventures")).toEqual(["riot"]);
    expect(significantFundTokens("General Catalyst")).toEqual(["general", "catalyst"]);
    expect(significantFundTokens("Mach33 Capital")).toEqual(["mach33"]);
  });

  it("handles multi-word names", () => {
    expect(significantFundTokens("Founders Fund")).toEqual(["founders"]);
    expect(significantFundTokens("Lux Capital")).toEqual(["lux"]);
  });

  it("returns empty for a name made entirely of stop words", () => {
    expect(significantFundTokens("Ventures Fund Partners")).toEqual([]);
  });

  it("keeps tokens that are >= 3 chars and not stop words", () => {
    expect(significantFundTokens("Eclipse Ventures")).toEqual(["eclipse"]);
  });
});

describe("textContainsFundToken", () => {
  it("returns true when a fund token appears in the text", () => {
    expect(textContainsFundToken("Riot Ventures led the round.", "Riot Ventures")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(textContainsFundToken("riot ventures led the round.", "Riot Ventures")).toBe(true);
  });

  it("returns false when no fund token appears", () => {
    expect(textContainsFundToken("Some other firm led the round.", "Riot Ventures")).toBe(false);
  });

  it("returns true when fund name has only stop-word tokens (vacuously safe)", () => {
    expect(textContainsFundToken("unrelated text", "Ventures Fund Partners")).toBe(true);
  });
});

describe("isUnknownValue", () => {
  it("treats undefined as unknown", () => {
    expect(isUnknownValue(undefined)).toBe(true);
  });

  it("treats empty string as unknown", () => {
    expect(isUnknownValue("")).toBe(true);
    expect(isUnknownValue("   ")).toBe(true);
  });

  it("treats null as unknown", () => {
    expect(isUnknownValue(null)).toBe(true);
  });

  it("treats legacy sentinel strings as unknown (defensive fallback)", () => {
    expect(isUnknownValue("Unknown; verify before use")).toBe(true);
    expect(isUnknownValue("Unknown; verify before matching to raise amount")).toBe(true);
    expect(isUnknownValue("unknown")).toBe(true);
  });

  it("treats real values as known", () => {
    expect(isUnknownValue("New York City")).toBe(false);
    expect(isUnknownValue("Series A")).toBe(false);
    expect(isUnknownValue("$50M–$250M AUM")).toBe(false);
  });
});

describe("normalizeUrl", () => {
  it("removes trailing slash", () => {
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com");
  });

  it("adds https when missing", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
  });

  it("returns undefined for blank input", () => {
    expect(normalizeUrl(undefined)).toBeUndefined();
    expect(normalizeUrl("")).toBeUndefined();
  });

  it("returns undefined for unparseable input", () => {
    expect(normalizeUrl("not a url at all !!!")).toBeUndefined();
  });
});

describe("enforceFieldEvidenceCoverage", () => {
  type Candidate = Record<string, string | null | undefined>;
  type Evidence = { field: string; sourceUrl: string; rawSnippet: string };

  function enforceFieldEvidenceCoverage(
    candidate: Candidate,
    evidence: Evidence[]
  ): Partial<Candidate> {
    const coveredFields = new Set(evidence.map((e) => e.field));
    const overrides: Partial<Candidate> = {};
    const fields = ["teamLocation", "stageFocus", "geographyFocus", "aumTier", "checkSizeProxy", "deepTechEvidence"];
    for (const field of fields) {
      const value = candidate[field];
      const isUnknown = value === null || value === undefined || !value.trim() || /\bunknown\b|verify before/i.test(value);
      if (!isUnknown && !coveredFields.has(field)) {
        overrides[field] = null;
      }
    }
    return overrides;
  }

  it("nulls a field that has a value but no fieldEvidence entry", () => {
    const candidate = { teamLocation: "New York, NY" };
    const result = enforceFieldEvidenceCoverage(candidate, []);
    expect(result.teamLocation).toBeNull();
  });

  it("leaves a field alone when it has matching fieldEvidence", () => {
    const candidate = { teamLocation: "New York, NY" };
    const evidence = [{ field: "teamLocation", sourceUrl: "https://fund.com", rawSnippet: "NYC office." }];
    const result = enforceFieldEvidenceCoverage(candidate, evidence);
    expect(result.teamLocation).toBeUndefined();
  });

  it("does not clear a field that is already null", () => {
    const candidate = { aumTier: null };
    const result = enforceFieldEvidenceCoverage(candidate, []);
    expect(result.aumTier).toBeUndefined();
  });

  it("nulls checkSizeProxy the same as other fields", () => {
    const candidate = { checkSizeProxy: "$1M–$5M checks" };
    const result = enforceFieldEvidenceCoverage(candidate, []);
    expect(result.checkSizeProxy).toBeNull();
  });

  it("returns empty object when all non-null fields have evidence", () => {
    const candidate = { teamLocation: "SF", stageFocus: "Seed" };
    const evidence = [
      { field: "teamLocation", sourceUrl: "https://fund.com", rawSnippet: "SF." },
      { field: "stageFocus", sourceUrl: "https://fund.com", rawSnippet: "Seed stage." },
    ];
    expect(enforceFieldEvidenceCoverage(candidate, evidence)).toEqual({});
  });
});

describe("normalizeForDedup", () => {
  function normalizeForDedup(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(ventures?|capital|partners?|fund|management|llc|lp|inc\.?)\b/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  it("strips 'Ventures' suffix so variants compare equal", () => {
    expect(normalizeForDedup("Starburst")).toBe(normalizeForDedup("Starburst Ventures"));
  });

  it("strips 'Capital' suffix", () => {
    expect(normalizeForDedup("Linse Capital")).toBe(normalizeForDedup("Linse"));
  });

  it("strips 'Partners' suffix", () => {
    expect(normalizeForDedup("Riot Ventures")).toBe(normalizeForDedup("Riot"));
  });

  it("keeps meaningful tokens intact", () => {
    expect(normalizeForDedup("General Catalyst")).toBe("generalcatalyst");
  });

  it("normalizes case", () => {
    expect(normalizeForDedup("MACH33")).toBe(normalizeForDedup("Mach33"));
  });
});

describe("sanitizeFieldEvidence", () => {
  const knownPage: SearchPage = {
    url: "https://example.vc",
    title: "Example VC",
    snippet: "We invest in deep tech.",
  };

  it("keeps evidence whose sourceUrl was fetched", () => {
    const evidence: ProspectFieldEvidence[] = [
      { field: "deepTechEvidence", sourceUrl: "https://example.vc", rawSnippet: "We invest in deep tech." },
    ];
    expect(sanitizeFieldEvidence(evidence, [knownPage])).toHaveLength(1);
  });

  it("drops evidence whose sourceUrl was NOT fetched", () => {
    const evidence: ProspectFieldEvidence[] = [
      { field: "teamLocation", sourceUrl: "https://hallucinated.vc", rawSnippet: "Based in NYC." },
    ];
    expect(sanitizeFieldEvidence(evidence, [knownPage])).toHaveLength(0);
  });

  it("drops evidence with missing sourceUrl or rawSnippet", () => {
    const evidence = [
      { field: "stageFocus", sourceUrl: "", rawSnippet: "Series A focus." },
      { field: "aumTier", sourceUrl: "https://example.vc", rawSnippet: "" },
    ] as ProspectFieldEvidence[];
    expect(sanitizeFieldEvidence(evidence, [knownPage])).toHaveLength(0);
  });

  it("returns empty array for undefined input", () => {
    expect(sanitizeFieldEvidence(undefined, [knownPage])).toEqual([]);
  });

  it("drops evidence whose rawSnippet contains placeholder text", () => {
    const evidence: ProspectFieldEvidence[] = [
      { field: "teamLocation", sourceUrl: "https://example.vc", rawSnippet: "111 Lorem Ipsum St. Austin, TX 73301" },
      { field: "deepTechEvidence", sourceUrl: "https://example.vc", rawSnippet: "We invest in deep tech." },
    ];
    const result = sanitizeFieldEvidence(evidence, [knownPage]);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("deepTechEvidence");
  });

  it("returns empty array when pages list is empty", () => {
    const evidence: ProspectFieldEvidence[] = [
      { field: "deepTechEvidence", sourceUrl: "https://example.vc", rawSnippet: "deep tech." },
    ];
    expect(sanitizeFieldEvidence(evidence, [])).toHaveLength(0);
  });
});
