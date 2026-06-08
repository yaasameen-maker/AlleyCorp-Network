"use client";

import type { Investor, WarmthTier } from "@/app/data/mockData";
import { WarmthBadge } from "./InvestorRow";

interface BriefingDashboardProps {
  investors: Investor[];
  onSelectInvestor: (investor: Investor) => void;
  // When true: render only the hero card (no sections). Parent handles layout padding.
  hideSections?: boolean;
  // Called when the user clicks "Network health" — parent can filter to Stale tier.
  onNetworkHealthClick?: () => void;
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function ChevronIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function StatBlock({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xl font-bold tabular-nums leading-none text-white">{count}</span>
      <span className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">{label}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-2">
        {children}
      </h2>
      <hr className="brand-line" />
    </div>
  );
}

const NOW_MS = Date.now();

function monthsAgo(dateStr: string): number {
  return Math.floor((NOW_MS - new Date(dateStr).getTime()) / (30 * 86_400_000));
}

/* ── Intelligence helpers ── */

// Fund with the most signals (deepest engagement, not just most recent)
function mostEngagedInvestor(investors: Investor[]): Investor | undefined {
  return investors
    .filter((i) => i.warmthTier === "Hot")
    .sort((a, b) => b.signals.length - a.signals.length)[0];
}

// Most recent stale relationship — most urgent reconnect
function mostUrgentStale(investors: Investor[]): Investor | undefined {
  return investors
    .filter((i) => i.warmthTier === "Stale" && i.lastSignalDate)
    .sort((a, b) =>
      new Date(a.lastSignalDate!).getTime() - new Date(b.lastSignalDate!).getTime()
    )[0];
}

function networkHealthLabel(attentionCount: number, hotCount: number, total: number): string {
  if (total === 0) return "No data";
  const score = hotCount / total;
  if (attentionCount === 0 && score >= 0.3) return "Strong";
  if (attentionCount <= 1) return "Healthy";
  if (attentionCount <= 3) return "Needs attention";
  return "Needs outreach";
}

/* ── Hero intelligence row ── */

function HeroInsight({
  label, value, sub, onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  onClick?: () => void;
}) {
  const isClickable = !!onClick;
  return (
    <div
      className={`flex flex-col gap-0.5 min-w-0 ${isClickable ? "group cursor-pointer" : ""}`}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter") onClick?.(); } : undefined}
    >
      <span className="text-[9px] uppercase tracking-widest text-white/35 font-semibold">{label}</span>
      <span
        className={[
          "text-[12px] font-semibold text-white/90 leading-snug transition-opacity duration-150",
          isClickable ? "group-hover:opacity-70" : "",
        ].join(" ")}
      >
        {value}
      </span>
      {sub && <span className="text-[10px] text-white/40 leading-snug">{sub}</span>}
    </div>
  );
}

/* ── Main component ── */

export function BriefingDashboard({ investors, onSelectInvestor, hideSections = false, onNetworkHealthClick }: BriefingDashboardProps) {
  const stale = investors.filter((i) => i.warmthTier === "Stale");
  const warmAtRisk = investors.filter(
    (i) =>
      i.warmthTier === "Warm" &&
      i.lastSignalDate &&
      monthsAgo(i.lastSignalDate) >= 12
  );
  const attentionItems = [...stale, ...warmAtRisk].slice(0, 5);

  const counts = {
    Hot:   investors.filter((i) => i.warmthTier === "Hot").length,
    Warm:  investors.filter((i) => i.warmthTier === "Warm").length,
    Stale: investors.filter((i) => i.warmthTier === "Stale").length,
    Cold:  investors.filter((i) => i.warmthTier === "Cold").length,
  };

  const mostEngaged  = mostEngagedInvestor(investors);
  const urgentStale  = mostUrgentStale(investors);
  const healthLabel  = networkHealthLabel(attentionItems.length, counts.Hot, investors.length);

  return (
    <div className={hideSections ? "" : "max-w-2xl px-8 py-10 space-y-8"}>

      {/* ── Hero card ── */}
      <div className="relative overflow-hidden rounded-xl hero-aurora px-7 py-6 shadow-md">
        <div className="hero-shimmer absolute -inset-12" aria-hidden />

        <div className="relative z-10">
          {/* Top row: title + stats */}
          <div className="flex items-end justify-between gap-6 mb-5">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#0EA5D6] font-semibold mb-1.5">
                AlleyCorp · Deep Tech
              </p>
              <h1 className="text-xl font-bold text-white leading-tight tracking-tight">
                Relationship Intelligence
              </h1>
              <p className="text-[10px] text-white/35 mt-1">{todayLabel()}</p>
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <StatBlock label="Total" count={investors.length} />
              <div className="w-px h-6 bg-white/10" aria-hidden />
              <StatBlock label="Hot"   count={counts.Hot} />
              <StatBlock label="Warm"  count={counts.Warm} />
              <StatBlock label="Stale" count={counts.Stale} />
              <StatBlock label="Cold"  count={counts.Cold} />
            </div>
          </div>

          {/* Intelligence strip */}
          <div className="border-t border-white/10 pt-4 grid grid-cols-3 gap-5">
            <HeroInsight
              label="Strongest relationship"
              value={mostEngaged ? mostEngaged.fund.name : "No hot relationships"}
              sub={mostEngaged
                ? `${mostEngaged.signals.length} signal${mostEngaged.signals.length !== 1 ? "s" : ""} · ${mostEngaged.lastSignalDate ?? ""}`
                : undefined}
              onClick={mostEngaged ? () => onSelectInvestor(mostEngaged) : undefined}
            />
            <HeroInsight
              label="Reconnect urgently"
              value={urgentStale ? urgentStale.fund.name : "All clear"}
              sub={urgentStale?.lastSignalDate
                ? `Last contact ${urgentStale.lastSignalDate} · ${monthsAgo(urgentStale.lastSignalDate)}mo ago`
                : undefined}
              onClick={urgentStale ? () => onSelectInvestor(urgentStale) : undefined}
            />
            <HeroInsight
              label="Network health"
              value={healthLabel}
              sub={attentionItems.length === 0
                ? "All relationships on track"
                : `${attentionItems.length} stale or lapsing · ${counts.Hot} hot`}
              onClick={attentionItems.length > 0 ? onNetworkHealthClick : undefined}
            />
          </div>
        </div>
      </div>

      {/* ── Attention needed ── */}
      {!hideSections && attentionItems.length > 0 && (
        <section>
          <SectionLabel>Needs attention</SectionLabel>
          <div>
            {attentionItems.map((investor) => {
              const company = investor.coInvestments[0]?.portfolioCompany.name;
              const ago = investor.lastSignalDate ? monthsAgo(investor.lastSignalDate) : null;

              return (
                <button
                  key={investor.id}
                  type="button"
                  onClick={() => onSelectInvestor(investor)}
                  className="card-lift w-full text-left px-2 py-4 flex items-center justify-between gap-4 border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F8F7F4] rounded-lg transition-colors duration-150 group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0D1320] group-hover:text-[#0EA5D6] transition-colors duration-150">
                      {investor.fund.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      {ago !== null ? `${ago}mo since last contact` : "No contact on record"}
                      {company ? ` · ${company}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <WarmthBadge tier={investor.warmthTier} />
                    <ChevronIcon />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Strongest relationships ── */}
      {!hideSections && counts.Hot > 0 && (
        <section>
          <SectionLabel>Strongest relationships</SectionLabel>
          <div>
            {investors
              .filter((i) => i.warmthTier === "Hot")
              .map((investor) => {
                const company = investor.coInvestments[0]?.portfolioCompany.name;
                return (
                  <button
                    key={investor.id}
                    type="button"
                    onClick={() => onSelectInvestor(investor)}
                    className="card-lift w-full text-left px-2 py-4 flex items-center justify-between gap-4 border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F8F7F4] rounded-lg transition-colors duration-150 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0D1320] group-hover:text-[#0EA5D6] transition-colors duration-150">
                        {investor.fund.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        {company ? `Co-invested · ${company}` : "Active relationship"}
                        {investor.lastSignalDate ? ` · ${investor.lastSignalDate}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <WarmthBadge tier={investor.warmthTier} />
                      <ChevronIcon />
                    </div>
                  </button>
                );
              })}
          </div>
        </section>
      )}

    </div>
  );
}
