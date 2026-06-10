/**
 * Unit tests for the /api/investors route transformation layer.
 *
 * Tests the groupByFund() mapper which was updated June 2026 to include:
 *   - contact (name, role, linkedinUrl) from the investor table
 *   - fund.logoUrl from Clearbit enrichment
 *   - fund.website
 *
 * These tests use in-memory mock Relationship objects — no DB required.
 */

import { describe, it, expect } from "vitest";
import { groupByFund } from "../lib/investors";
import type { Relationship, WarmthTier } from "../lib/types";

// ── Helper: build a minimal valid Relationship ───────────────────────────────

function makeRelationship(overrides: Partial<Relationship> = {}): Relationship {
  return {
    id: crypto.randomUUID(),
    fundId: "fund-1",
    portfolioCompanyId: "pc-1",
    alleyPartner: "Abe",
    warmthTier: "Hot",
    signals: [],
    fund: {
      id: "fund-1",
      name: "Riot Ventures",
      website: "riotvc.com",
      logoUrl: "https://logo.clearbit.com/riotvc.com",
    },
    investor: null,
    ...overrides,
  };
}

// ── Contact mapping ──────────────────────────────────────────────────────────

describe("groupByFund — contact mapping", () => {
  it("maps investor name, role, and linkedinUrl to contact field", () => {
    const rel = makeRelationship({
      investor: {
        id: "inv-1",
        name: "Stephen Marcus",
        role: "Managing Partner",
        linkedinUrl: "https://linkedin.com/in/stephen-marcus",
      },
    });

    const [result] = groupByFund([rel]);

    expect(result.contact).toEqual({
      name: "Stephen Marcus",
      role: "Managing Partner",
      linkedinUrl: "https://linkedin.com/in/stephen-marcus",
    });
  });

  it("omits contact when investor is null", () => {
    const rel = makeRelationship({ investor: null });
    const [result] = groupByFund([rel]);
    expect(result.contact).toBeUndefined();
  });

  it("omits contact when investor is undefined (cold fund, never enriched)", () => {
    const rel = makeRelationship({ investor: undefined });
    const [result] = groupByFund([rel]);
    expect(result.contact).toBeUndefined();
  });

  it("omits linkedinUrl from contact when investor has no URL", () => {
    const rel = makeRelationship({
      investor: {
        id: "inv-2",
        name: "Jane Doe",
        role: "Partner",
        linkedinUrl: undefined,
      },
    });

    const [result] = groupByFund([rel]);
    expect(result.contact?.name).toBe("Jane Doe");
    expect(result.contact?.linkedinUrl).toBeUndefined();
  });
});

// ── Logo and website mapping ─────────────────────────────────────────────────

describe("groupByFund — fund logo and website", () => {
  it("passes logoUrl from fund into the response", () => {
    const rel = makeRelationship({
      fund: {
        id: "fund-1",
        name: "Riot Ventures",
        logoUrl: "https://logo.clearbit.com/riotvc.com",
        website: "riotvc.com",
      },
    });

    const [result] = groupByFund([rel]);
    expect(result.fund.logoUrl).toBe("https://logo.clearbit.com/riotvc.com");
  });

  it("passes website from fund into the response", () => {
    const rel = makeRelationship({
      fund: {
        id: "fund-1",
        name: "Riot Ventures",
        website: "riotvc.com",
      },
    });

    const [result] = groupByFund([rel]);
    expect(result.fund.website).toBe("riotvc.com");
  });

  it("omits logoUrl when fund has none (not yet enriched)", () => {
    const rel = makeRelationship({
      fund: {
        id: "fund-1",
        name: "Unknown Fund",
        logoUrl: undefined,
      },
    });

    const [result] = groupByFund([rel]);
    expect(result.fund.logoUrl).toBeUndefined();
  });
});

// ── Merging multiple relationships for same fund ─────────────────────────────

describe("groupByFund — merging (one card per fund)", () => {
  it("produces one card per fund even with multiple relationships", () => {
    const rel1 = makeRelationship({ id: "r1", portfolioCompanyId: "pc-1" });
    const rel2 = makeRelationship({ id: "r2", portfolioCompanyId: "pc-2" });

    const result = groupByFund([rel1, rel2]);
    expect(result).toHaveLength(1);
    expect(result[0].fund.name).toBe("Riot Ventures");
  });

  it("keeps contact from the first relationship when merging", () => {
    const rel1 = makeRelationship({
      id: "r1",
      portfolioCompanyId: "pc-1",
      investor: {
        id: "inv-1",
        name: "Stephen Marcus",
        role: "Managing Partner",
        linkedinUrl: "https://linkedin.com/in/stephen-marcus",
      },
    });
    const rel2 = makeRelationship({ id: "r2", portfolioCompanyId: "pc-2" });

    const [result] = groupByFund([rel1, rel2]);
    expect(result.contact?.name).toBe("Stephen Marcus");
  });
});

// ── Warmth tier mapping ──────────────────────────────────────────────────────

describe("groupByFund — warmth tier", () => {
  it("converts lowercase DB tier to Title Case for the frontend", () => {
    const cases: [WarmthTier, string][] = [
      ["Hot", "Hot"],
      ["Warm", "Warm"],
      ["Stale", "Stale"],
      ["Cold", "Cold"],
    ];
    for (const [db, title] of cases) {
      const rel = makeRelationship({ warmthTier: db });
      const [result] = groupByFund([rel]);
      expect(result.warmthTier).toBe(title);
    }
  });
});
