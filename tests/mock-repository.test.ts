import { describe, it, expect } from "vitest";
import {
  getAllRelationshipsMock,
  getInvestorByNameMock,
  searchRelationshipsMock,
  listStaleRelationshipsMock,
  getWarmthSignalsMock,
  getRecentSignalsMock,
  getAlertsMock,
  compareByLastSignalDateAscNullsLast,
} from "../lib/mock/repository";

describe("mock repository", () => {
  it("getAllRelationshipsMock returns the full dataset", async () => {
    const rows = await getAllRelationshipsMock();
    expect(rows.length).toBe(44);
  });

  it("getInvestorByNameMock finds a fund by partial name match", async () => {
    const rel = await getInvestorByNameMock("Riot");
    expect(rel?.fund?.name).toBe("Riot Ventures");
  });

  it("getInvestorByNameMock returns null for no match", async () => {
    const rel = await getInvestorByNameMock("Nonexistent Fund XYZ");
    expect(rel).toBeNull();
  });

  it("searchRelationshipsMock matches across fund name, company, tier, and focus", async () => {
    const rows = await searchRelationshipsMock("Capital");
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      const haystack = [
        r.fund?.name,
        r.portfolioCompany?.name,
        r.warmthTier,
        r.fund?.focus,
        r.fund?.deepTechSignal,
        r.fund?.hqLocation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      expect(haystack).toContain("capital");
    }
  });

  it("listStaleRelationshipsMock returns only Stale relationships", async () => {
    const rows = await listStaleRelationshipsMock();
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.warmthTier).toBe("Stale");
    }
  });

  it("getWarmthSignalsMock returns signals for a known relationship id", async () => {
    const signals = await getWarmthSignalsMock("mock-riot-ventures");
    expect(signals.length).toBeGreaterThan(0);
  });

  it("getWarmthSignalsMock returns an empty array for an unknown id", async () => {
    const signals = await getWarmthSignalsMock("does-not-exist");
    expect(signals).toEqual([]);
  });

  it("getRecentSignalsMock respects the limit", async () => {
    const signals = await getRecentSignalsMock(3);
    expect(signals.length).toBeLessThanOrEqual(3);
  });

  it("getAlertsMock returns high severity for stale and medium for at-risk warm", async () => {
    const alerts = await getAlertsMock();
    expect(alerts.length).toBeGreaterThan(0);
    for (const a of alerts) {
      expect(["high", "medium"]).toContain(a.severity);
    }
  });

  it("getAllRelationshipsMock returns a fresh array, not a reference to the shared fixture", async () => {
    const rows = await getAllRelationshipsMock();
    rows.reverse();
    const rowsAgain = await getAllRelationshipsMock();
    expect(rowsAgain[0].id).not.toBe(rows[0].id);
  });

  it("listStaleRelationshipsMock sorts ascending by lastSignalDate", async () => {
    const rows = await listStaleRelationshipsMock();
    const dates = rows.map((r) => (r.lastSignalDate ? new Date(r.lastSignalDate).getTime() : null));
    const nonNullDates = dates.filter((d): d is number => d !== null);
    for (let i = 1; i < nonNullDates.length; i++) {
      expect(nonNullDates[i]).toBeGreaterThanOrEqual(nonNullDates[i - 1]);
    }
  });

  it("compareByLastSignalDateAscNullsLast puts null dates last", () => {
    const rows = [
      { lastSignalDate: undefined },
      { lastSignalDate: "2024-01-01" },
      { lastSignalDate: undefined },
      { lastSignalDate: "2023-01-01" },
    ];
    const sorted = [...rows].sort(compareByLastSignalDateAscNullsLast);
    expect(sorted.map((r) => r.lastSignalDate)).toEqual([
      "2023-01-01",
      "2024-01-01",
      undefined,
      undefined,
    ]);
  });
});
