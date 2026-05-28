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
// Expected alerts from seed data (as of 2026-05-27):
//   Stale (3, ordered oldest signal first):
//     1. SineWave Ventures + Aon 3D          → stale_relationship (high)   2021-09-02
//     2. Trimble Ventures + Civ Robotics     → stale_relationship (high)   2022-09-21
//     3. BOLD Capital Partners + Earth Force → stale_relationship (high)   2022-11-29
//   Warm-at-risk (2, ordered oldest signal first):
//     4. Flybridge + Halo Braid              → warm_at_risk       (medium) 2024-06-15
//     5. Cherubic Ventures + Cargo Robotics  → warm_at_risk       (medium) 2024-10-01
//
//   NOTE: Lux Capital + Inductive Bio and USV + Viam removed — Inductive Bio
//   and Viam are not on Lauren Young's confirmed Deep Tech portfolio list.
//   NOTE: SOSV + Renovate Robotics is HOT — HAX returned for Seed VC-II Aug 2025.
// ─────────────────────────────────────────

describe("getAlerts (integration)", () => {

  it("returns exactly 5 alerts from seed data", async () => {
    const alerts = await getAlerts();
    expect(alerts).toHaveLength(5);
  });

  it("orders all stale (high severity) before all warm-at-risk (medium severity)", async () => {
    const alerts = await getAlerts();
    const severities = alerts.map((a) => a.severity);
    const firstMedium = severities.indexOf("medium");
    const lastHigh = severities.lastIndexOf("high");
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
      expect(alert!.lastSignalDate).toBe("2021-09-02");
    });

    it("has a non-empty message that names the fund", async () => {
      const alerts = await getAlerts();
      const alert = alerts.find((a) => a.fund === "SineWave Ventures");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("SineWave Ventures");
      expect(alert!.message.length).toBeGreaterThan(0);
    });
  });

  describe("warm-at-risk alert — Flybridge on Halo Braid", () => {
    it("has the correct type and severity", async () => {
      const alerts = await getAlerts();
      const alert = alerts.find((a) => a.fund === "Flybridge");
      expect(alert).toBeDefined();
      expect(alert!.type).toBe("warm_at_risk");
      expect(alert!.severity).toBe("medium");
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
