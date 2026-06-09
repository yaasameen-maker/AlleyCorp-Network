import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateWarmthTier, isWarmAtRisk } from "../lib/scoring";
import type { Signal } from "../lib/types";

// ─────────────────────────────────────────
// Freeze time so all window calculations are deterministic.
// "now" = 2026-05-26
//
// Derived cutoffs:
//   active window    (24 months back) → 2024-05-26
//   hot co-invest    (18 months back) → 2024-11-26
//   warm at-risk     (90 days back)   → 2026-02-25
// ─────────────────────────────────────────
const NOW = new Date("2026-05-26T00:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────
// Helper — build a minimal valid Signal
// ─────────────────────────────────────────
function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: crypto.randomUUID(),
    relationshipId: "rel-1",
    type: "co_investment",
    date: "2025-06-01", // active by default (within 24 months)
    source: "Crunchbase",
    value: "",
    weight: "high",
    ...overrides,
  };
}

// ─────────────────────────────────────────
// calculateWarmthTier
// ─────────────────────────────────────────
describe("calculateWarmthTier", () => {
  describe("Cold", () => {
    it("returns Cold when there are no signals", () => {
      expect(calculateWarmthTier([])).toBe("Cold");
    });
  });

  describe("Stale", () => {
    it("returns Stale when all signals are older than 24 months", () => {
      const signals = [
        makeSignal({ date: "2024-05-25" }), // one day before cutoff
        makeSignal({ date: "2023-01-01" }),
      ];
      expect(calculateWarmthTier(signals)).toBe("Stale");
    });

    it("returns Stale when there is only one active signal", () => {
      const signals = [
        makeSignal({ date: "2025-01-01" }), // active
      ];
      expect(calculateWarmthTier(signals)).toBe("Stale");
    });

    it("returns Stale when active signal count is exactly 1 despite older signals", () => {
      const signals = [
        makeSignal({ date: "2025-03-01" }), // active
        makeSignal({ date: "2023-06-01" }), // decayed
        makeSignal({ date: "2022-01-01" }), // decayed
      ];
      expect(calculateWarmthTier(signals)).toBe("Stale");
    });
  });

  describe("Warm", () => {
    it("returns Warm when there are exactly 2 active signals", () => {
      const signals = [
        makeSignal({ date: "2025-01-01", type: "event_attendance" }),
        makeSignal({ date: "2025-06-01", type: "linkedin_connection" }),
      ];
      expect(calculateWarmthTier(signals)).toBe("Warm");
    });

    it("returns Warm when there are 2 active signals including a co_investment outside 18 months", () => {
      const signals = [
        makeSignal({ date: "2024-08-01", type: "co_investment" }), // active but outside 18-month hot window
        makeSignal({ date: "2025-06-01", type: "event_attendance" }),
      ];
      expect(calculateWarmthTier(signals)).toBe("Warm");
    });

    it("returns Warm when there are 3+ active signals but no recent co_investment", () => {
      const signals = [
        makeSignal({ date: "2025-01-01", type: "event_attendance" }),
        makeSignal({ date: "2025-03-01", type: "linkedin_connection" }),
        makeSignal({ date: "2025-06-01", type: "press_mention" }),
      ];
      expect(calculateWarmthTier(signals)).toBe("Warm");
    });

    it("returns Warm when there are 3+ active signals but co_investment is older than 18 months", () => {
      const signals = [
        makeSignal({ date: "2024-06-01", type: "co_investment" }), // active but > 18 months ago
        makeSignal({ date: "2025-01-01", type: "event_attendance" }),
        makeSignal({ date: "2025-06-01", type: "press_mention" }),
      ];
      expect(calculateWarmthTier(signals)).toBe("Warm");
    });
  });

  describe("Hot", () => {
    it("returns Hot with 3 active signals and a co_investment within 18 months", () => {
      const signals = [
        makeSignal({ date: "2025-06-01", type: "co_investment" }), // within 18 months
        makeSignal({ date: "2025-01-01", type: "event_attendance" }),
        makeSignal({ date: "2025-03-01", type: "linkedin_connection" }),
      ];
      expect(calculateWarmthTier(signals)).toBe("Hot");
    });

    it("returns Hot with more than 3 active signals and a recent co_investment", () => {
      const signals = [
        makeSignal({ date: "2025-06-01", type: "co_investment" }),
        makeSignal({ date: "2025-01-01", type: "event_attendance" }),
        makeSignal({ date: "2025-03-01", type: "linkedin_connection" }),
        makeSignal({ date: "2025-04-01", type: "press_mention" }),
      ];
      expect(calculateWarmthTier(signals)).toBe("Hot");
    });

    it("counts only active signals toward the Hot threshold", () => {
      // 4 total signals but only 3 are active — should still be Hot
      const signals = [
        makeSignal({ date: "2025-06-01", type: "co_investment" }), // active, within 18m
        makeSignal({ date: "2025-01-01", type: "event_attendance" }), // active
        makeSignal({ date: "2025-03-01", type: "linkedin_connection" }), // active
        makeSignal({ date: "2023-01-01", type: "press_mention" }), // decayed
      ];
      expect(calculateWarmthTier(signals)).toBe("Hot");
    });
  });

  describe("boundary conditions", () => {
    it("treats a signal exactly on the 24-month boundary as decayed (exclusive)", () => {
      // exactly 24 months before 2026-05-26 = 2024-05-26 — NOT active
      const signals = [makeSignal({ date: "2024-05-26" })];
      expect(calculateWarmthTier(signals)).toBe("Stale");
    });

    it("treats a signal one day inside the 24-month window as active", () => {
      // one day after the cutoff = 2024-05-27
      const signals = [makeSignal({ date: "2024-05-27" }), makeSignal({ date: "2025-01-01" })];
      expect(calculateWarmthTier(signals)).toBe("Warm");
    });

    it("treats a co_investment exactly on the 18-month boundary as qualifying for Hot (inclusive)", () => {
      // exactly 18 months before 2026-05-26 = 2024-11-26
      // "within 18 months" uses >= so the boundary date IS included
      const signals = [
        makeSignal({ date: "2024-11-26", type: "co_investment" }),
        makeSignal({ date: "2025-01-01" }),
        makeSignal({ date: "2025-03-01" }),
      ];
      expect(calculateWarmthTier(signals)).toBe("Hot");
    });

    it("treats a co_investment one day inside the 18-month window as qualifying for Hot", () => {
      // 2024-11-27 is inside the 18-month window
      const signals = [
        makeSignal({ date: "2024-11-27", type: "co_investment" }),
        makeSignal({ date: "2025-01-01" }),
        makeSignal({ date: "2025-03-01" }),
      ];
      expect(calculateWarmthTier(signals)).toBe("Hot");
    });
  });
});

// ─────────────────────────────────────────
// isWarmAtRisk
// ─────────────────────────────────────────
describe("isWarmAtRisk", () => {
  it("returns true when lastSignalDate is null", () => {
    expect(isWarmAtRisk(null)).toBe(true);
  });

  it("returns true when lastSignalDate is undefined", () => {
    expect(isWarmAtRisk(undefined)).toBe(true);
  });

  it("returns true when last signal was more than 90 days ago", () => {
    expect(isWarmAtRisk("2026-02-24")).toBe(true); // 91 days before 2026-05-26
  });

  it("returns true when last signal was exactly 90 days ago", () => {
    expect(isWarmAtRisk("2026-02-25")).toBe(true); // exactly 90 days before 2026-05-26
  });

  it("returns false when last signal was within the last 90 days", () => {
    expect(isWarmAtRisk("2026-03-01")).toBe(false); // 86 days before 2026-05-26
  });

  it("returns false when last signal was yesterday", () => {
    expect(isWarmAtRisk("2026-05-25")).toBe(false);
  });
});
