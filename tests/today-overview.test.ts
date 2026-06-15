import { describe, expect, it } from "vitest";
import { mockInvestors } from "../app/data/mockData";
import { buildTodayOverview, formatTodayOverviewPlainText } from "../lib/today-overview-client";
import { matchesInvestorSearch } from "../app/lib/investorSearch";
import type { Investor } from "../lib/investors";

function isoDaysAgo(days: number): string {
  const date = new Date(Date.now() - days * 86_400_000);
  return date.toISOString().slice(0, 10);
}

function makeInvestor(overrides: Partial<Investor> = {}): Investor {
  return {
    id: "test-investor",
    name: "Test Capital",
    fund: { id: "test-fund", name: "Test Capital" },
    warmthTier: "Cold",
    signals: [],
    coInvestments: [],
    ...overrides,
  };
}

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

  it("surfaces a relationship-change item for every stale investor", () => {
    // Contract-based: do not hardcode fund names — tiers change as data is updated.
    const overview = buildTodayOverview(mockInvestors);
    const rel = overview.sections.find((s) => s.id === "relationship-changes");
    const staleInvestors = mockInvestors.filter((i) => i.warmthTier === "Stale");

    for (const investor of staleInvestors) {
      expect(rel?.items.some((item) => item.investorId === investor.id)).toBe(true);
    }
  });

  it("marks deep tech headlines as pending news feed", () => {
    const overview = buildTodayOverview(mockInvestors);
    const headlines = overview.sections.find((s) => s.id === "deep-tech-headlines");
    expect(headlines?.pending).toBe(true);
    expect(headlines?.items).toHaveLength(0);
    expect(headlines?.pendingMessage).toMatch(/news feed pending/i);
  });

  it("excludes stale media signals from the Today Overview media section", () => {
    const investor = makeInvestor({
      signals: [
        {
          type: "event",
          description: "Attended DTNY deep tech event",
          date: isoDaysAgo(240),
          weight: "High",
          source: "DTNY",
        },
      ],
    });

    const overview = buildTodayOverview([investor]);
    const media = overview.sections.find((s) => s.id === "media-signals");
    expect(media?.items).toHaveLength(0);
  });

  it("excludes stale discovery rows from new investor signals", () => {
    const investor = makeInvestor({
      discoverySource: "network_expansion",
      lastSignalDate: isoDaysAgo(240),
    });

    const overview = buildTodayOverview([investor]);
    const newSignals = overview.sections.find((s) => s.id === "new-signals");
    expect(newSignals?.items).toHaveLength(0);
  });

  it("copies pending news feed state into plain text", () => {
    const overview = buildTodayOverview([]);
    const text = formatTodayOverviewPlainText(overview);
    expect(text).toMatch(/News feed pending/i);
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
