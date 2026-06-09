import type { Investor, WarmthTier } from "@/app/data/mockData";
import type { PortfolioCompanyRecord } from "@/app/data/portfolioCompanies";
import { isWarmAtRisk } from "./alerts";
import { formatMonthsAgo } from "./dates";

export interface CoInvestorLink {
  investorId: string;
  fundName: string;
  warmthTier: WarmthTier;
  round: string;
  date: string;
  relationshipStatus: string;
  lastSignalLabel?: string;
}

export interface PortfolioCompanyView {
  company: PortfolioCompanyRecord;
  coInvestorCount: number;
  coInvestors: CoInvestorLink[];
}

const TIER_ORDER: Record<WarmthTier, number> = { Hot: 0, Warm: 1, Cold: 2, Stale: 3 };

function relationshipStatus(investor: Investor): string {
  if (investor.warmthTier === "Stale") return "Stale";
  if (investor.warmthTier === "Warm" && isWarmAtRisk(investor.lastSignalDate))
    return "Warm at risk";
  if (investor.warmthTier === "Cold") return "No recent activity";
  return investor.warmthTier;
}

function buildCoInvestorsForCompany(companyId: string, investors: Investor[]): CoInvestorLink[] {
  const links: CoInvestorLink[] = [];

  for (const investor of investors) {
    for (const ci of investor.coInvestments) {
      if (ci.portfolioCompany.id === companyId && ci.fundParticipated) {
        links.push({
          investorId: investor.id,
          fundName: investor.fund.name,
          warmthTier: investor.warmthTier,
          round: ci.round,
          date: ci.date,
          relationshipStatus: relationshipStatus(investor),
          lastSignalLabel: investor.lastSignalDate
            ? formatMonthsAgo(investor.lastSignalDate)
            : undefined,
        });
      }
    }
  }

  const uniqueByFund = Array.from(new Map(links.map((c) => [c.fundName, c])).values()).sort(
    (a, b) => TIER_ORDER[a.warmthTier] - TIER_ORDER[b.warmthTier]
  );

  return uniqueByFund;
}

export function buildPortfolioIndex(
  companies: PortfolioCompanyRecord[],
  investors: Investor[]
): PortfolioCompanyView[] {
  return companies.map((company) => {
    const coInvestors = buildCoInvestorsForCompany(company.id, investors);
    return {
      company,
      coInvestorCount: coInvestors.length,
      coInvestors,
    };
  });
}

export function getPortfolioSectors(companies: PortfolioCompanyRecord[]): string[] {
  return Array.from(new Set(companies.map((c) => c.sector))).sort();
}
