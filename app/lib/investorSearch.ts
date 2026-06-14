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

  // Match the portfolio company named on a signal, but NOT free-text signal descriptions —
  // matching descriptions surfaced unrelated funds (e.g. searching "Mach33" returned Geodesic
  // because its signal text reads "co-lead alongside Mach33"). Keep results to structured fields.
  if (investor.signals.some((s) => s.portfolioCompanyName?.toLowerCase().includes(q))) {
    return true;
  }

  return false;
}
