import type { Investor, WarmthTier } from "@/lib/investors";

const TIER_NAMES: WarmthTier[] = ["Hot", "Warm", "Stale", "Cold"];

/**
 * Filter investors by fund, contact, portfolio company, or warmth tier keyword.
 */
export function matchesInvestorSearch(investor: Investor, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const tierMatch = TIER_NAMES.find((t) => t.toLowerCase().startsWith(q));
  if (tierMatch && investor.warmthTier === tierMatch) return true;

  if (investor.fund.name.toLowerCase().includes(q)) return true;
  if (investor.name.toLowerCase().includes(q)) return true;
  if (investor.contact?.name.toLowerCase().includes(q)) return true;

  if (investor.coInvestments.some((c) => c.portfolioCompany.name.toLowerCase().includes(q))) {
    return true;
  }

  if (
    investor.signals.some(
      (s) =>
        s.portfolioCompanyName?.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    )
  ) {
    return true;
  }

  return false;
}
