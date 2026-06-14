import { describe, expect, it } from "vitest";
import {
  canAutoPublishSource,
  confidenceFromUrl,
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
});
