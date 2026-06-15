import { describe, expect, it } from "vitest";
import {
  canAutoPublishSource,
  canEnrichProfile,
  canPublishRelationshipSignal,
  confidenceFromUrl,
  isCandidateOnlySource,
  sourceNameFromUrl,
  sourceUseFromUrl,
} from "../lib/source-policy";

describe("source policy", () => {
  it("treats trusted news domains as high-confidence publishable sources", () => {
    const url = "https://www.axios.com/newsletters/axios-pro-rata-d119cf31-901c";

    expect(sourceUseFromUrl(url)).toBe("verified_candidate");
    expect(confidenceFromUrl(url)).toBe("high");
    expect(canAutoPublishSource(url)).toBe(true);
    expect(sourceNameFromUrl(url)).toBe("Axios");
  });

  it("treats Crunchbase as candidate-only without direct access evidence", () => {
    const url = "https://www.crunchbase.com/organization/example";

    expect(sourceUseFromUrl(url)).toBe("candidate_only");
    expect(confidenceFromUrl(url)).toBe("low");
    expect(canAutoPublishSource(url)).toBe(false);
    expect(sourceNameFromUrl(url)).toBe("Crunchbase");
  });

  it("treats AlleyCorp Substack as a high-value relationship source", () => {
    const url = "https://alleycorp.substack.com/p/example-post";

    expect(sourceUseFromUrl(url)).toBe("relationship_signal");
    expect(confidenceFromUrl(url)).toBe("high");
    expect(canAutoPublishSource(url)).toBe(true);
  });

  it("treats SEC regulatory filings as high-confidence profile sources", () => {
    const url = "https://reports.adviserinfo.sec.gov/reports/ADV/123456/PDF/123456.pdf";

    expect(sourceUseFromUrl(url)).toBe("profile_enrichment");
    expect(confidenceFromUrl(url)).toBe("high");
    expect(sourceNameFromUrl(url)).toBe("SEC");
    // Regulatory filings back profile fields but are not relationship signals.
    expect(canEnrichProfile(url)).toBe(true);
    expect(canPublishRelationshipSignal(url)).toBe(false);
  });

  it("treats open investor directories as candidate-only leads", () => {
    const openvc = "https://openvc.app/investors/example-fund";
    const differentFunds = "https://www.differentfunds.com/fund/example";
    const deepTechVcList = "https://deeptechvclist.com/investors/example-fund";
    const helloTomorrow = "https://www.hellotomorrow.org/deep-tech-investors";
    const publicSheet = "https://docs.google.com/spreadsheets/d/example";

    for (const url of [openvc, differentFunds, deepTechVcList, helloTomorrow, publicSheet]) {
      expect(isCandidateOnlySource(url)).toBe(true);
      expect(canPublishRelationshipSignal(url)).toBe(false);
      expect(canEnrichProfile(url)).toBe(false);
    }
    expect(sourceNameFromUrl(openvc)).toBe("OpenVC");
    expect(sourceNameFromUrl(deepTechVcList)).toBe("DeepTechVCList");
    expect(sourceNameFromUrl(helloTomorrow)).toBe("Hello Tomorrow");
  });

  it("allows medium-confidence press to enrich profiles but not publish signals", () => {
    const url = "https://www.forbes.com/sites/example/2025/01/01/a-fund-profile/";

    expect(confidenceFromUrl(url)).toBe("medium");
    expect(canEnrichProfile(url)).toBe(true);
    expect(canPublishRelationshipSignal(url)).toBe(false);
  });
});
