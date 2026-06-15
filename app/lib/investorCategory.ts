import type { Investor } from "@/lib/investors";

export type InvestorCategory =
  | "active_relationship"
  | "co_investor_vip"
  | "market_prospect"
  | "newly_discovered";

export interface InvestorCategoryMeta {
  id: InvestorCategory;
  label: string;
  shortLabel: string;
}

const CATEGORY_META: Record<InvestorCategory, InvestorCategoryMeta> = {
  active_relationship: {
    id: "active_relationship",
    label: "Active relationship",
    shortLabel: "Active",
  },
  co_investor_vip: {
    id: "co_investor_vip",
    label: "Co-investor / VIP",
    shortLabel: "VIP",
  },
  market_prospect: {
    id: "market_prospect",
    label: "Market prospect",
    shortLabel: "Prospect",
  },
  newly_discovered: {
    id: "newly_discovered",
    label: "Newly discovered",
    shortLabel: "New",
  },
};

function hasCoInvestment(investor: Investor): boolean {
  return investor.coInvestments.some((c) => c.fundParticipated);
}

/** Known co-investor with VIP/starred status in the network map. */
export function isVipInvestor(investor: Investor): boolean {
  return investor.fund.isVip === true;
}

/** Primary relationship category for list rows and profile header. */
export function getInvestorCategory(investor: Investor): InvestorCategoryMeta {
  const coInvestor = hasCoInvestment(investor);

  if (
    investor.discoverySource &&
    !coInvestor &&
    investor.fund.investorStatus !== "market_prospect"
  ) {
    return CATEGORY_META.newly_discovered;
  }

  if (
    investor.fund.investorStatus === "market_prospect" ||
    (investor.discoverySource === "network_expansion" && !coInvestor)
  ) {
    return CATEGORY_META.market_prospect;
  }

  if (isVipInvestor(investor)) {
    return CATEGORY_META.co_investor_vip;
  }

  if (coInvestor && (investor.warmthTier === "Hot" || investor.warmthTier === "Warm")) {
    return CATEGORY_META.active_relationship;
  }

  if (coInvestor) {
    return CATEGORY_META.active_relationship;
  }

  return CATEGORY_META.market_prospect;
}
