import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getAllRelationships,
  getInvestorByName,
  searchRelationships,
  listStaleRelationships,
  getWarmthSignals,
  getRecentSignals,
  pool,
} from "../lib/db";

describe("lib/db.ts mock fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("getAllRelationships returns mock data and never touches pool.query when DATABASE_URL is unset", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const querySpy = vi.spyOn(pool, "query");
    const rows = await getAllRelationships();
    expect(rows.length).toBe(44);
    expect(querySpy).not.toHaveBeenCalled();
  });

  it("getInvestorByName returns a mock relationship when DATABASE_URL is unset", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const rel = await getInvestorByName("Riot");
    expect(rel?.fund?.name).toBe("Riot Ventures");
  });

  it("searchRelationships, listStaleRelationships, getWarmthSignals, getRecentSignals all work without a DB", async () => {
    vi.stubEnv("DATABASE_URL", "");
    expect((await searchRelationships("Capital")).length).toBeGreaterThan(0);
    expect((await listStaleRelationships()).length).toBeGreaterThan(0);
    expect((await getWarmthSignals("mock-riot-ventures")).length).toBeGreaterThan(0);
    expect((await getRecentSignals(5)).length).toBeGreaterThan(0);
  });
});
