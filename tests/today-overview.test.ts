import { describe, expect, it } from "vitest";
import { mockInvestors } from "../app/data/mockData";
import { buildTodayOverview } from "../lib/today-overview-client";
import { matchesInvestorSearch } from "../app/lib/investorSearch";

describe("buildTodayOverview", () => {
  it("returns all four sections for demo safety", () => {
    const overview = buildTodayOverview(mockInvestors);
    expect(overview.sections).toHaveLength(4);
    expect(overview.sections.map((s) => s.id)).toEqual([
      "new-signals",
      "relationship-changes",
      "deep-tech-headlines",
      "media-signals",
    ]);
  });

  it("builds from investor data without throwing when empty", () => {
    const overview = buildTodayOverview([]);
    expect(overview.headline).toContain("No new updates");
    overview.sections.forEach((section) => {
      expect(section.items).toHaveLength(0);
    });
  });

  it("includes relationship changes for stale investors", () => {
    const overview = buildTodayOverview(mockInvestors);
    const rel = overview.sections.find((s) => s.id === "relationship-changes");
    expect(rel?.items.some((i) => i.headline.includes("Trimble Ventures"))).toBe(true);
  });
});

describe("matchesInvestorSearch", () => {
  const investor = mockInvestors[0];

  it("matches fund name", () => {
    expect(matchesInvestorSearch(investor, "riot")).toBe(true);
  });

  it("matches portfolio company", () => {
    expect(matchesInvestorSearch(investor, "valar")).toBe(true);
  });

  it("matches tier keyword", () => {
    expect(matchesInvestorSearch(investor, "hot")).toBe(true);
  });

  it("returns true for empty query", () => {
    expect(matchesInvestorSearch(investor, "")).toBe(true);
  });
});
