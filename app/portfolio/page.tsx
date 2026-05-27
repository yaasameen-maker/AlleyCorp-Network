import Link from "next/link";
import { mockInvestors, portfolioCompanies, type WarmthTier } from "../data/mockData";
import { WarmthBadge } from "../components/WarmthBadge";

type CoInvestorRef = {
  investorId: string;
  fundName: string;
  warmthTier: WarmthTier;
  round: string;
  date: string;
};

const TIER_ORDER: Record<WarmthTier, number> = { Hot: 0, Warm: 1, Cold: 2, Stale: 3 };

function buildCompanyIndex() {
  return portfolioCompanies.map((company) => {
    const coInvestors: CoInvestorRef[] = [];
    for (const investor of mockInvestors) {
      for (const ci of investor.coInvestments) {
        if (ci.portfolioCompany.id === company.id && ci.fundParticipated) {
          coInvestors.push({
            investorId: investor.id,
            fundName: investor.fund.name,
            warmthTier: investor.warmthTier,
            round: ci.round,
            date: ci.date,
          });
        }
      }
    }

    const uniqueByFund = Array.from(new Map(coInvestors.map((c) => [c.fundName, c])).values()).sort(
      (a, b) => TIER_ORDER[a.warmthTier] - TIER_ORDER[b.warmthTier]
    );

    const tierCounts: Record<WarmthTier, number> = { Hot: 0, Warm: 0, Cold: 0, Stale: 0 };
    for (const c of uniqueByFund) tierCounts[c.warmthTier]++;

    const rounds = Array.from(new Set(coInvestors.map((c) => `${c.round} ${c.date}`)));
    const latestRound = coInvestors
      .map((c) => ({ label: `${c.round} · ${c.date}`, date: c.date }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];

    return {
      company,
      coInvestors: uniqueByFund,
      tierCounts,
      roundCount: rounds.length,
      latestRound: latestRound?.label ?? null,
    };
  });
}

export default function PortfolioPage() {
  const index = buildCompanyIndex();
  const totalCompanies = portfolioCompanies.length;
  const totalCoInvestorRows = index.reduce((sum, row) => sum + row.coInvestors.length, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors mt-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  Portfolio Companies
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Deep Tech portfolio with co-investor relationships per company
                </p>
              </div>
            </div>
            <Link
              href="/investors"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Investors
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-slate-400 mb-4">
          Showing {totalCompanies} {totalCompanies === 1 ? "company" : "companies"} ·{" "}
          {totalCoInvestorRows} tracked co-investor {totalCoInvestorRows === 1 ? "link" : "links"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {index.map(({ company, coInvestors, tierCounts, roundCount, latestRound }) => (
            <article
              key={company.id}
              className="p-5 border border-slate-800 rounded-xl bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-white truncate">{company.name}</h3>
                  <a
                    href={`https://${company.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline break-all"
                  >
                    {company.url}
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-1 shrink-0 max-w-[55%] justify-end">
                  {(["Hot", "Warm", "Cold", "Stale"] as const).map((tier) =>
                    tierCounts[tier] > 0 ? (
                      <span
                        key={tier}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                          tier === "Hot"
                            ? "bg-red-500/15 text-red-300 border-red-500/30"
                            : tier === "Warm"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : tier === "Cold"
                                ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                                : "bg-slate-700/40 text-slate-300 border-slate-600/60"
                        }`}
                      >
                        {tier} · {tierCounts[tier]}
                      </span>
                    ) : null
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-400">Co-investors</div>
                  <div className="text-lg font-semibold text-white">{coInvestors.length}</div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-400">Rounds tracked</div>
                  <div className="text-lg font-semibold text-white">{roundCount}</div>
                </div>
              </div>

              {coInvestors.length === 0 ? (
                <p className="text-sm text-slate-500">No co-investors recorded yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {coInvestors.map((c) => (
                    <li
                      key={c.investorId + c.round + c.date}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-slate-100 truncate">{c.fundName}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500 hidden sm:inline">
                          {c.round} · {c.date}
                        </span>
                        <WarmthBadge tier={c.warmthTier} size="sm" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {latestRound && (
                <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-800">
                  Latest round · {latestRound}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
