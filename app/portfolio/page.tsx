// Michael's file — fixed by Luba/Claude:
// Was using mockInvestors/portfolioCompanies instead of live DB.
// Now: fetches all 20 portfolio companies + overlays co-investor relationship data.
// Shows all companies including those with no co-investors seeded yet.

export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAllRelationships, pool } from "../../lib/db";
import { WarmthBadge } from "../components/InvestorRow";
import { AskFAB } from "../components/AskFAB";
import type { WarmthTier } from "@/lib/investors";

interface CoInvestorRow {
  fundName: string;
  warmthTier: WarmthTier;
  date: string;
}

interface CompanyGroup {
  id: string;
  name: string;
  website: string;
  status: string;
  coInvestors: CoInvestorRow[];
}

const TIER_ORDER: Record<WarmthTier, number> = { Hot: 0, Warm: 1, Stale: 2, Cold: 3 };

function toWarmthTier(s: string): WarmthTier {
  const map: Record<string, WarmthTier> = {
    hot: "Hot",
    warm: "Warm",
    stale: "Stale",
    cold: "Cold",
  };
  return map[s.toLowerCase()] ?? "Cold";
}

function formatDate(d: string | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

async function getPortfolioData(): Promise<CompanyGroup[]> {
  try {
    // 1. Get all portfolio companies (all 20, regardless of co-investor data)
    const { rows: allCompanies } = await pool.query<{
      id: string;
      name: string;
      website: string | null;
      status: string;
    }>(`SELECT id, name, website, status FROM portfolio_company ORDER BY name`);

    // 2. Build map seeded with all companies — co-investors start empty
    const companyMap = new Map<string, CompanyGroup>(
      allCompanies.map((pc) => [
        pc.id,
        {
          id: pc.id,
          name: pc.name,
          website: pc.website ?? "",
          status: pc.status ?? "active",
          coInvestors: [],
        },
      ])
    );

    // 3. Overlay relationship data
    const relationships = await getAllRelationships();
    for (const rel of relationships) {
      if (!rel.portfolioCompanyId) continue;
      const group = companyMap.get(rel.portfolioCompanyId);
      if (!group) continue;

      const fundName = rel.fund?.name ?? "Unknown fund";
      if (!group.coInvestors.find((c) => c.fundName === fundName)) {
        group.coInvestors.push({
          fundName,
          warmthTier: toWarmthTier(rel.warmthTier),
          date: formatDate(rel.lastSignalDate),
        });
      }
    }

    // 4. Sort companies alphabetically; sort co-investors by warmth tier
    return Array.from(companyMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((group) => ({
        ...group,
        coInvestors: group.coInvestors.sort(
          (a, b) => TIER_ORDER[a.warmthTier] - TIER_ORDER[b.warmthTier]
        ),
      }));
  } catch (err) {
    console.error("[PortfolioPage]", err);
    return [];
  }
}

export default async function PortfolioPage() {
  const companies = await getPortfolioData();
  const withCoInvestors = companies.filter((c) => c.coInvestors.length > 0);
  const totalLinks = companies.reduce((sum, c) => sum + c.coInvestors.length, 0);
  const activeCount = companies.filter((c) => c.status === "active").length;
  const alumniCount = companies.filter((c) => c.status === "alumni").length;

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-[#EAECEF] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center gap-5">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[#9CA3AF] hover:text-[#0D1320] transition-colors text-sm font-medium shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Home
          </Link>
          <div className="w-px h-5 bg-[#EAECEF]" aria-hidden />
          <div>
            <h1 className="text-xl font-bold text-[#0D1320] tracking-tight">Portfolio Companies</h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {activeCount} active · {alumniCount} alumni · {withCoInvestors.length} with
              co-investors · {totalLinks} co-investor links tracked
            </p>
          </div>
        </div>
      </header>

      {/* ── Brand divider ── */}
      <div className="max-w-5xl mx-auto px-8 pt-5">
        <hr className="brand-line" />
      </div>

      {/* ── Context note ── */}
      <div className="max-w-5xl mx-auto px-8 pt-4 pb-1">
        <p className="text-xs text-[#9CA3AF] leading-relaxed">
          AlleyCorp Deep Tech portfolio. {companies.length} companies total. Each card shows the
          funds that co-invested alongside AlleyCorp and the current warmth of that relationship.
          {companies.length - withCoInvestors.length > 0 && (
            <>
              {" "}
              {companies.length - withCoInvestors.length} companies have no co-investor data
              recorded yet.
            </>
          )}
        </p>
      </div>

      {/* ── Company cards ── */}
      <div className="max-w-5xl mx-auto px-8 py-5 space-y-3">
        {companies.map((company) => {
          const isAlumni = company.status === "alumni";
          const href = company.website
            ? company.website.startsWith("http")
              ? company.website
              : `https://${company.website}`
            : null;

          return (
            <div
              key={company.id}
              className={`card-lift bg-white border rounded overflow-hidden ${isAlumni ? "border-[#F3F4F6] opacity-75" : "border-[#E5E7EB]"}`}
            >
              {/* Company header */}
              <div className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <p
                    className={`text-sm font-bold truncate ${isAlumni ? "text-[#9CA3AF]" : "text-[#0D1320]"}`}
                  >
                    {company.name}
                  </p>
                  {isAlumni && (
                    <span className="shrink-0 text-[8px] font-bold uppercase tracking-widest text-[#C4C9D4] border border-[#EAECEF] rounded px-1.5 py-0.5">
                      Alumni
                    </span>
                  )}
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#0EA5D6] hover:underline truncate hidden sm:block"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
                <span className="text-[10px] text-[#C4C9D4] shrink-0 ml-4">
                  {company.coInvestors.length === 0
                    ? "No co-investors recorded"
                    : `${company.coInvestors.length} co-investor${company.coInvestors.length !== 1 ? "s" : ""}`}
                </span>
              </div>

              {/* Co-investor rows */}
              {company.coInvestors.length > 0 && (
                <>
                  <div className="grid grid-cols-[1fr_auto_100px] px-5 py-2 gap-6 bg-[#FAFAFA] border-t border-[#F3F4F6]">
                    <span className="text-[9px] uppercase tracking-widest text-[#C4C9D4] font-semibold">
                      Fund
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-[#C4C9D4] font-semibold">
                      Warmth
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-[#C4C9D4] font-semibold">
                      Last signal
                    </span>
                  </div>
                  {company.coInvestors.map((ci) => (
                    <div
                      key={ci.fundName}
                      className="group grid grid-cols-[1fr_auto_100px] px-5 py-3 gap-6 border-t border-[#F3F4F6] hover:bg-[#F8F7F4] transition-colors items-center"
                    >
                      <p className="text-sm text-[#374151] group-hover:text-[#0EA5D6] transition-colors duration-150">
                        {ci.fundName}
                      </p>
                      <WarmthBadge tier={ci.warmthTier} />
                      <p className="text-xs text-[#9CA3AF]">{ci.date || ""}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
      <AskFAB />
    </main>
  );
}
