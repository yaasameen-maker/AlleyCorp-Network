import Link from "next/link";
import { mockInvestors } from "./data/mockData";
import { WarmthBadge } from "./components/WarmthBadge";

export default function Home() {
  const tierCounts = {
    Hot: mockInvestors.filter((i) => i.warmthTier === "Hot").length,
    Warm: mockInvestors.filter((i) => i.warmthTier === "Warm").length,
    Cold: mockInvestors.filter((i) => i.warmthTier === "Cold").length,
    Stale: mockInvestors.filter((i) => i.warmthTier === "Stale").length,
  };

  const needsAttention = [...mockInvestors]
    .filter((i) => i.warmthTier === "Stale" || i.warmthTier === "Cold")
    .slice(0, 3);

  const hotInvestors = mockInvestors.filter((i) => i.warmthTier === "Hot").slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-400 font-semibold mb-1">
                AlleyCorp
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Relationship Intelligence
              </h1>
            </div>
            <nav className="hidden sm:flex items-center gap-2">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 text-sm font-medium rounded-lg transition-colors"
              >
                Portfolio
              </Link>
              <Link
                href="/investors"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-500/30"
              >
                Investor List
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <section>
          <h2 className="text-lg font-semibold text-white mb-1">Warmth distribution</h2>
          <p className="text-sm text-slate-400 mb-4">
            {mockInvestors.length} tracked co-investors across the Deep Tech portfolio
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Hot"
              value={tierCounts.Hot}
              accent="bg-red-500/15 text-red-300 border-red-500/30"
            />
            <StatCard
              label="Warm"
              value={tierCounts.Warm}
              accent="bg-amber-500/15 text-amber-300 border-amber-500/30"
            />
            <StatCard
              label="Cold"
              value={tierCounts.Cold}
              accent="bg-sky-500/15 text-sky-300 border-sky-500/30"
            />
            <StatCard
              label="Stale"
              value={tierCounts.Stale}
              accent="bg-slate-700/40 text-slate-300 border-slate-600/60"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel
            title="Needs attention"
            description="Stale and Cold relationships worth re-engaging."
          >
            {needsAttention.length === 0 ? (
              <EmptyState message="No stale or cold relationships." />
            ) : (
              needsAttention.map((investor) => (
                <InvestorRow key={investor.id} investor={investor} />
              ))
            )}
          </Panel>

          <Panel title="Strongest signals" description="Hot co-investors with recent activity.">
            {hotInvestors.length === 0 ? (
              <EmptyState message="No hot relationships yet." />
            ) : (
              hotInvestors.map((investor) => <InvestorRow key={investor.id} investor={investor} />)
            )}
          </Panel>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:hidden">
          <Link
            href="/investors"
            className="inline-flex items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors w-full justify-center"
          >
            View investors
          </Link>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 text-sm font-medium rounded-lg transition-colors w-full justify-center"
          >
            View portfolio
          </Link>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${accent}`}>{label}</span>
      </div>
      <div className="text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400 mt-0.5 mb-4">{description}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InvestorRow({
  investor,
}: {
  investor: (typeof import("./data/mockData"))["mockInvestors"][number];
}) {
  return (
    <Link
      href="/investors"
      className="flex items-center justify-between gap-3 p-3 -mx-1 rounded-lg hover:bg-slate-900/60 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{investor.fund.name}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {investor.lastInteraction
            ? `Last interaction · ${investor.lastInteraction}`
            : `${investor.signals.length} signals`}
        </p>
      </div>
      <WarmthBadge tier={investor.warmthTier} size="sm" />
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-slate-500 py-2">{message}</p>;
}
