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

type CompanyGroup = {
  company: (typeof portfolioCompanies)[number];
  coInvestors: CoInvestorRef[];
};

const TIER_ORDER: Record<WarmthTier, number> = { Hot: 0, Warm: 1, Cold: 2, Stale: 3 };

function buildCompanyIndex(): CompanyGroup[] {
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

    return { company, coInvestors: uniqueByFund };
  });
}

export default function PortfolioPage() {
  const index = buildCompanyIndex();
  const totalCompanies = portfolioCompanies.length;
  const totalCoInvestorRows = index.reduce((sum, row) => sum + row.coInvestors.length, 0);

  // Flatten to one table row per (company × co-investor). Companies with no
  // recorded co-investors still get a single placeholder row so they appear.
  let rowParity = 0;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-muted hover:text-ink transition-colors mt-1.5"
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
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
                  Portfolio Companies
                </h1>
                <p className="text-sm text-muted mt-1">
                  Deep Tech portfolio with co-investor relationships per company
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-muted hover:text-ink text-sm font-medium transition-colors"
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
        <p className="text-sm text-muted mb-4">
          Showing {totalCompanies} {totalCompanies === 1 ? "company" : "companies"} ·{" "}
          {totalCoInvestorRows} tracked co-investor {totalCoInvestorRows === 1 ? "link" : "links"}
        </p>

        <div className="overflow-x-auto border border-line rounded-xl">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-navy text-paper text-left">
                <th className="font-semibold px-4 py-3">Company</th>
                <th className="font-semibold px-4 py-3">Co-investor</th>
                <th className="font-semibold px-4 py-3">Warmth</th>
                <th className="font-semibold px-4 py-3 whitespace-nowrap">Round</th>
                <th className="font-semibold px-4 py-3 whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody>
              {index.map(({ company, coInvestors }) => {
                if (coInvestors.length === 0) {
                  const zebra = rowParity++ % 2 === 1 ? "bg-mist" : "bg-paper";
                  return (
                    <tr key={company.id} className={`border-t border-line ${zebra}`}>
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-ink">{company.name}</div>
                        <a
                          href={`https://${company.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-ink underline underline-offset-2 hover:text-muted break-all"
                        >
                          {company.url}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted italic" colSpan={4}>
                        No co-investors recorded yet
                      </td>
                    </tr>
                  );
                }

                return coInvestors.map((c, i) => {
                  const zebra = rowParity++ % 2 === 1 ? "bg-mist" : "bg-paper";
                  return (
                    <tr
                      key={company.id + c.investorId + c.round + c.date}
                      className={`border-t border-line ${zebra}`}
                    >
                      <td className="px-4 py-3 align-top">
                        {i === 0 ? (
                          <>
                            <div className="font-medium text-ink">{company.name}</div>
                            <a
                              href={`https://${company.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-ink underline underline-offset-2 hover:text-muted break-all"
                            >
                              {company.url}
                            </a>
                          </>
                        ) : (
                          <span className="text-muted" aria-hidden="true">
                            ↳
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink">{c.fundName}</td>
                      <td className="px-4 py-3">
                        <WarmthBadge tier={c.warmthTier} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{c.round}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{c.date}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
