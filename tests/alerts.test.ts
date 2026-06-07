import { describe, it, expect, afterAll } from "vitest";
import { getAlerts } from "../lib/alerts.server";
import { pool } from "../lib/db";

// Close the pg connection pool after all tests so the process exits cleanly.
afterAll(async () => {
  await pool.end();
});

// ─────────────────────────────────────────
// Integration tests — run against Railway DB.
//
// Core stale alerts (always expected, ordered oldest signal first):
//     1. Trimble Ventures + Civ Robotics     → stale_relationship (high)   2022-09-22
//     2. Flybridge + Halo Braid              → stale_relationship (high)   2024-06-15
//     3. Cherubic Ventures + Cargo Robotics  → stale_relationship (high)   2024-10-01
//     4. BOLD Capital Partners + Earth Force → stale_relationship (high)   2026-01-28
//     5. SineWave Ventures + Aon 3D          → stale_relationship (high)   2026-01-28
//
//   NOTE: Flybridge and Cherubic recalibrated Warm → Stale (last signal >180 days ago).
//   NOTE: SineWave last_signal_date updated to 2026-01-28 (Cycle Capital follow-on found by scraper).
//   NOTE: BOLD last_signal_date updated to 2026-01-28 (DTNY event attendance signal).
//   NOTE: June 7 — co-investor discovery added more stale relationships (Koop, Mapless AI,
//         Dexai Robotics co-investors). Count is now >= 5, not exactly 5.
// ─────────────────────────────────────────

describe("getAlerts (integration)", () => {

  it("returns at least 5 alerts from seed data", async () => {
    const alerts = await getAlerts();
    expect(alerts.length).toBeGreaterThanOrEqual(5);
  });

  it("orders all stale (high severity) before all warm-at-risk (medium severity)", async () => {
    const alerts = await getAlerts();
    const severities = alerts.map((a) => a.severity);
    const firstMedium = severities.indexOf("medium");
    const lastHigh = severities.lastIndexOf("high");
    // If no medium alerts, ordering constraint is trivially satisfied
    if (firstMedium === -1) return;
    // All highs must appear before all mediums
    expect(lastHigh).toBeLessThan(firstMedium);
  });

  describe("stale alert — SineWave Ventures on Aon 3D", () => {
    it("has the correct type and severity", async () => {
      const alerts = await getAlerts();
      const alert = alerts.find((a) => a.fund === "SineWave Ventures");
      expect(alert).toBeDefined();
      expect(alert!.type).toBe("stale_relationship");
      expect(alert!.severity).toBe("high");
    });

    it("identifies the correct fund and portfolio company", async () => {
      const alerts = await getAlerts();
      const alert = alerts.find((a) => a.fund === "SineWave Ventures");
      expect(alert).toBeDefined();
      expect(alert!.fund).toBe("SineWave Ventures");
      expect(alert!.portfolioCompany).toBe("Aon 3D");
    });

    it("carries the correct last signal date", async () => {
      const alerts = await getAlerts();
      const alert = alerts.find((a) => a.fund === "SineWave Ventures");
      expect(alert).toBeDefined();
      expect(alert!.lastSignalDate).toBe("2026-01-28");
    });

    it("has a non-empty message that names the fund", async () => {
      const alerts = await getAlerts();
      const alert = alerts.find((a) => a.fund === "SineWave Ventures");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("SineWave Ventures");
      expect(alert!.message.length).toBeGreaterThan(0);
    });
  });

  describe("stale alert — Flybridge on Halo Braid", () => {
    it("has the correct type and severity", async () => {
      const alerts = await getAlerts();
      const alert = alerts.find((a) => a.fund === "Flybridge");
      expect(alert).toBeDefined();
      expect(alert!.type).toBe("stale_relationship");
      expect(alert!.severity).toBe("high");
    });

    it("identifies the correct fund and portfolio company", async () => {
      const alerts = await getAlerts();
      const alert = alerts.find((a) => a.fund === "Flybridge");
      expect(alert).toBeDefined();
      expect(alert!.fund).toBe("Flybridge");
      expect(alert!.portfolioCompany).toBe("Halo Braid");
    });

    it("carries the correct last signal date", async () => {
      const alerts = await getAlerts();
      const alert = alerts.find((a) => a.fund === "Flybridge");
      expect(alert).toBeDefined();
      expect(alert!.lastSignalDate).toBe("2024-06-15");
    });

    it("has a non-empty message that names the fund", async () => {
      const alerts = await getAlerts();
      const alert = alerts.find((a) => a.fund === "Flybridge");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("Flybridge");
      expect(alert!.message.length).toBeGreaterThan(0);
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
