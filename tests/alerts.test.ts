import { describe, it, expect, afterAll } from "vitest";
import { getAlerts } from "../lib/alerts";
import { pool } from "../lib/db";

// Close the pg connection pool after all tests so the process exits cleanly.
afterAll(async () => {
  await pool.end();
});

// ─────────────────────────────────────────
// Integration tests — run against the local alleycorp DB with seed data.
//
// Expected alerts from seed data (as of 2026-05-26):
//   1. Lux Capital + Inductive Bio  → stale_relationship (high)   last signal 2023-12-01
//   2. USV + Viam                   → warm_at_risk      (medium)  last signal 2023-06-01
// ─────────────────────────────────────────

describe("getAlerts (integration)", () => {

  it("returns exactly 2 alerts from seed data", async () => {
    const alerts = await getAlerts();
    expect(alerts).toHaveLength(2);
  });

  it("orders stale (high severity) before warm-at-risk (medium severity)", async () => {
    const alerts = await getAlerts();
    expect(alerts.map((a) => a.severity)).toEqual(["high", "medium"]);
  });

  describe("stale alert — Lux Capital on Inductive Bio", () => {
    it("has the correct type and severity", async () => {
      const alerts = await getAlerts();
      expect(alerts[0].type).toBe("stale_relationship");
      expect(alerts[0].severity).toBe("high");
    });

    it("identifies the correct fund and portfolio company", async () => {
      const alerts = await getAlerts();
      expect(alerts[0].fund).toBe("Lux Capital");
      expect(alerts[0].portfolioCompany).toBe("Inductive Bio");
    });

    it("carries the correct last signal date", async () => {
      const alerts = await getAlerts();
      expect(alerts[0].lastSignalDate).toBe("2023-12-01");
    });

    it("has a non-empty message that names the fund", async () => {
      const alerts = await getAlerts();
      expect(alerts[0].message).toContain("Lux Capital");
      expect(alerts[0].message.length).toBeGreaterThan(0);
    });
  });

  describe("warm-at-risk alert — USV on Viam", () => {
    it("has the correct type and severity", async () => {
      const alerts = await getAlerts();
      expect(alerts[1].type).toBe("warm_at_risk");
      expect(alerts[1].severity).toBe("medium");
    });

    it("identifies the correct fund and portfolio company", async () => {
      const alerts = await getAlerts();
      expect(alerts[1].fund).toBe("Union Square Ventures");
      expect(alerts[1].portfolioCompany).toBe("Viam");
    });

    it("carries the correct last signal date", async () => {
      const alerts = await getAlerts();
      expect(alerts[1].lastSignalDate).toBe("2023-06-01");
    });

    it("has a non-empty message that names the fund", async () => {
      const alerts = await getAlerts();
      expect(alerts[1].message).toContain("Union Square Ventures");
      expect(alerts[1].message.length).toBeGreaterThan(0);
    });
  });

  describe("alert shape", () => {
    it("every alert has all required fields", async () => {
      const alerts = await getAlerts();
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("fund");
        expect(alert).toHaveProperty("portfolioCompany");
        expect(alert).toHaveProperty("lastSignalDate");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always 'high' or 'medium'", async () => {
      const alerts = await getAlerts();
      for (const alert of alerts) {
        expect(["high", "medium"]).toContain(alert.severity);
      }
    });

    it("type is always a known alert type", async () => {
      const alerts = await getAlerts();
      for (const alert of alerts) {
        expect(["stale_relationship", "warm_at_risk"]).toContain(alert.type);
      }
    });
  });
});
