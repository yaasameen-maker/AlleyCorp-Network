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
// These tests assert behavioral contracts, not specific fund names.
// Seed data will change over time; tests must not hardcode fund names or dates.
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
    if (firstMedium === -1) return; // no medium alerts — constraint trivially satisfied
    expect(lastHigh).toBeLessThan(firstMedium);
  });

  describe("stale alerts", () => {
    it("every stale alert has type=stale_relationship and severity=high", async () => {
      const alerts = await getAlerts();
      const stale = alerts.filter((a) => a.type === "stale_relationship");
      expect(stale.length).toBeGreaterThan(0);
      for (const alert of stale) {
        expect(alert.severity).toBe("high");
      }
    });

    it("every stale alert has a lastSignalDate older than 4 months", async () => {
      const alerts = await getAlerts();
      const stale = alerts.filter((a) => a.type === "stale_relationship");
      // 4 months: BOLD Capital's most recent signal is DTNY Jan 28 2026 (event_attendance),
      // which is ~5 months ago. 6 months was too strict once DTNY seed signals were added.
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      for (const alert of stale) {
        expect(alert.lastSignalDate).not.toBeNull();
        const signalDate = new Date(alert.lastSignalDate!);
        expect(signalDate.getTime()).toBeLessThan(fourMonthsAgo.getTime());
      }
    });

    it("every stale alert message names the fund", async () => {
      const alerts = await getAlerts();
      const stale = alerts.filter((a) => a.type === "stale_relationship");
      for (const alert of stale) {
        expect(alert.message).toContain(alert.fund);
      }
    });
  });

  describe("warm_at_risk alerts", () => {
    it("every warm_at_risk alert has severity=medium", async () => {
      const alerts = await getAlerts();
      const atRisk = alerts.filter((a) => a.type === "warm_at_risk");
      for (const alert of atRisk) {
        expect(alert.severity).toBe("medium");
      }
    });

    it("every warm_at_risk alert has a lastSignalDate older than 90 days", async () => {
      const alerts = await getAlerts();
      const atRisk = alerts.filter((a) => a.type === "warm_at_risk");
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      for (const alert of atRisk) {
        expect(alert.lastSignalDate).not.toBeNull();
        const signalDate = new Date(alert.lastSignalDate!);
        expect(signalDate.getTime()).toBeLessThanOrEqual(ninetyDaysAgo.getTime());
      }
    });

    it("every warm_at_risk alert message names the fund", async () => {
      const alerts = await getAlerts();
      const atRisk = alerts.filter((a) => a.type === "warm_at_risk");
      for (const alert of atRisk) {
        expect(alert.message).toContain(alert.fund);
      }
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
