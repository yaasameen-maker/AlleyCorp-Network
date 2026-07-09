import { describe, it, expect, afterEach, vi } from "vitest";
import { getAllPortfolioCompanies, pool } from "../lib/db";

describe("getAllPortfolioCompanies mock fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns all 20 mock portfolio companies and never touches pool.query when DATABASE_URL is unset", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const querySpy = vi.spyOn(pool, "query");
    const companies = await getAllPortfolioCompanies();
    expect(companies.length).toBe(20);
    expect(querySpy).not.toHaveBeenCalled();
  });

  it("includes both active and alumni companies", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const companies = await getAllPortfolioCompanies();
    const statuses = new Set(companies.map((c) => c.status));
    expect(statuses).toEqual(new Set(["active", "alumni"]));
  });
});
