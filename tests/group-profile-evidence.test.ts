import { describe, expect, it } from "vitest";
import { groupProfileEvidence, sourceLinkLabel } from "../app/lib/groupProfileEvidence";
import type { InvestorSignal } from "../lib/investors";

const sampleSignals: InvestorSignal[] = [
  {
    type: "co-investment",
    description: "Co-led Valar Atomics Seed",
    date: "Mar 2025",
    weight: "High",
    portfolioCompanyName: "Valar Atomics",
    sourceUrl: "https://example.com/valar",
    sourceTitle: "TechCrunch — Valar Seed",
  },
  {
    type: "event",
    description: "DTNY attendance",
    date: "Jan 2026",
    weight: "Medium",
  },
  {
    type: "co-investment",
    description: "Eyebot Series A",
    date: "Aug 2025",
    weight: "High",
    portfolioCompanyName: "Eyebot",
  },
];

describe("groupProfileEvidence", () => {
  it("groups co-investment signals by portfolio company", () => {
    const groups = groupProfileEvidence(sampleSignals);
    const valar = groups.find((g) => g.title === "Valar Atomics");
    const eyebot = groups.find((g) => g.title === "Eyebot");
    expect(valar?.signals).toHaveLength(1);
    expect(eyebot?.signals).toHaveLength(1);
  });

  it("groups non-company signals by source type", () => {
    const groups = groupProfileEvidence(sampleSignals);
    const events = groups.find((g) => g.title === "Events & attendance");
    expect(events?.signals).toHaveLength(1);
  });
});

describe("sourceLinkLabel", () => {
  it("prefers sourceTitle when present", () => {
    expect(sourceLinkLabel(sampleSignals[0])).toBe("TechCrunch — Valar Seed");
  });

  it("falls back when no public URL", () => {
    expect(sourceLinkLabel(sampleSignals[1])).toBe("Internal record — no public URL");
  });
});
