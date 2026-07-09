import { describe, it, expect } from "vitest";
import { MOCK_RELATIONSHIPS } from "../lib/mock/relationships";

describe("MOCK_RELATIONSHIPS", () => {
  it("includes all four warmth tiers", () => {
    const tiers = new Set(MOCK_RELATIONSHIPS.map((r) => r.warmthTier));
    expect(tiers).toEqual(new Set(["Hot", "Warm", "Stale", "Cold"]));
  });

  it("never links a real individual LinkedIn profile — only the generic homepage", () => {
    for (const r of MOCK_RELATIONSHIPS) {
      if (r.investor?.linkedinUrl) {
        expect(r.investor.linkedinUrl).toBe("https://www.linkedin.com");
      }
    }
  });

  it("every relationship has a unique id", () => {
    const ids = MOCK_RELATIONSHIPS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has all 44 relationships, matching the real live count", () => {
    expect(MOCK_RELATIONSHIPS.length).toBe(44);
  });

  it("never mentions the real client firm's name anywhere in the dataset", () => {
    const serialized = JSON.stringify(MOCK_RELATIONSHIPS);
    expect(serialized).not.toContain("AlleyCorp");
  });

  it("Cold relationships never have a researched contact, even if they have an event signal", () => {
    // Cold means "no confirmed co-investment" — a Cold fund can still have a
    // non-co-investment signal (e.g. attended an event) without becoming Warm/Hot.
    // What Cold guarantees is no Point of Contact has been researched yet.
    const cold = MOCK_RELATIONSHIPS.filter((r) => r.warmthTier === "Cold");
    expect(cold.length).toBeGreaterThan(0);
    for (const r of cold) {
      expect(r.investor).toBeNull();
    }
  });
});
