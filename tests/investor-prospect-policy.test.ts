import { describe, expect, it } from "vitest";
import { reviewInvestorProspectCandidate } from "../lib/investor-prospect-policy";

describe("investor prospect policy", () => {
  it("accepts an open-directory lead when profile fields have eligible source evidence", () => {
    const reviewed = reviewInvestorProspectCandidate({
      fundName: "Example Deep Tech Fund",
      website: "https://example.vc",
      discoverySourceUrl: "https://openvc.app/investors/example-deep-tech-fund",
      discoverySourceTitle: "OpenVC example profile",
      teamLocation: "New York",
      stageFocus: "Seed to Series A",
      geographyFocus: "US",
      checkSizeProxy: "Seed / early Series A",
      deepTechEvidence: "Fund website describes frontier robotics and industrial AI thesis",
      profileSourceUrls: ["https://example.vc"],
      fieldEvidence: [
        {
          field: "teamLocation",
          sourceUrl: "https://example.vc",
          rawSnippet: "Example Deep Tech Fund is based in New York.",
        },
        {
          field: "stageFocus",
          sourceUrl: "https://example.vc",
          rawSnippet: "We invest from Seed to Series A.",
        },
        {
          field: "geographyFocus",
          sourceUrl: "https://example.vc",
          rawSnippet: "We invest across the US.",
        },
        {
          field: "checkSizeProxy",
          sourceUrl: "https://example.vc",
          rawSnippet: "Typical checks support seed and early Series A rounds.",
        },
        {
          field: "deepTechEvidence",
          sourceUrl: "https://example.vc",
          rawSnippet: "Our thesis focuses on frontier robotics and industrial AI.",
        },
      ],
    });

    expect(reviewed.status).toBe("accepted_for_market_map");
    expect(reviewed.acceptedProfileSources).toEqual(["https://example.vc"]);
    expect(reviewed.acceptedFieldEvidence).toHaveLength(5);
    expect(reviewed.rejectionReasons).toHaveLength(0);
  });

  it("keeps records with unsourced profile fields as candidate-only", () => {
    const reviewed = reviewInvestorProspectCandidate({
      fundName: "Unsourced Deep Tech Fund",
      website: "https://unsourced.vc",
      discoverySourceUrl: "https://openvc.app/investors/unsourced-deep-tech-fund",
      discoverySourceTitle: "OpenVC profile",
      teamLocation: "Los Angeles",
      deepTechEvidence: "Official website describes a deep tech thesis",
      profileSourceUrls: ["https://unsourced.vc"],
    });

    expect(reviewed.status).toBe("candidate_only");
    expect(reviewed.rejectionReasons).toContain("missing source evidence for teamLocation");
    expect(reviewed.rejectionReasons).toContain("missing source evidence for deepTechEvidence");
  });

  it("does not require evidence for fields explicitly marked unknown", () => {
    const reviewed = reviewInvestorProspectCandidate({
      fundName: "Known Thesis Fund",
      website: "https://known-thesis.vc",
      discoverySourceUrl: "https://known-thesis.vc",
      discoverySourceTitle: "Known Thesis homepage",
      aumTier: "Unknown; verify before use",
      checkSizeProxy: "Unknown; verify before matching to raise amount",
      deepTechEvidence: "Official website describes a deep tech thesis",
      profileSourceUrls: ["https://known-thesis.vc"],
      fieldEvidence: [
        {
          field: "deepTechEvidence",
          sourceUrl: "https://known-thesis.vc",
          rawSnippet: "Known Thesis backs hard-science and industrial AI companies.",
        },
      ],
    });

    expect(reviewed.status).toBe("accepted_for_market_map");
    expect(reviewed.rejectionReasons).toHaveLength(0);
  });

  it("keeps directory-only records as candidate-only leads", () => {
    const reviewed = reviewInvestorProspectCandidate({
      fundName: "Directory Only Fund",
      discoverySourceUrl: "https://deeptechvclist.com/investors/directory-only-fund",
      discoverySourceTitle: "DeepTechVCList profile",
      profileSourceUrls: ["https://deeptechvclist.com/investors/directory-only-fund"],
    });

    expect(reviewed.status).toBe("candidate_only");
    expect(reviewed.rejectionReasons).toContain("missing fund website");
    expect(reviewed.rejectionReasons).toContain("missing deep tech evidence");
    expect(reviewed.rejectionReasons).toContain("no profile source is eligible for enrichment");
  });

  it("rejects malformed records with no fund name or source URL", () => {
    const reviewed = reviewInvestorProspectCandidate({
      fundName: "",
      discoverySourceUrl: "",
    });

    expect(reviewed.status).toBe("rejected");
    expect(reviewed.rejectionReasons).toContain("missing fund name");
    expect(reviewed.rejectionReasons).toContain("missing discovery source URL");
  });
});
