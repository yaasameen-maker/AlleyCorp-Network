import { describe, it, expect, afterEach, vi } from "vitest";
import { getAlerts } from "../lib/alerts.server";
import { pool } from "../lib/db";

describe("getAlerts mock fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns mock alerts and never touches pool.query when DATABASE_URL is unset", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const querySpy = vi.spyOn(pool, "query");
    const alerts = await getAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    expect(querySpy).not.toHaveBeenCalled();
  });
});
