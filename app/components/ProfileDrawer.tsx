"use client";

import type { Investor, WarmthTier } from "@/app/data/mockData";
import { WarmthBadge } from "./InvestorRow";

interface ProfileDrawerProps {
  investor: Investor;
  onClose: () => void;
}

/* ── Close button icon ── */
function IconClose() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Thin teal bullet ── */
function Bullet() {
  return <span className="inline-block w-1 h-1 rounded-full bg-[#0EA5D6] shrink-0 mt-[7px]" aria-hidden />;
}

/* ── Signal type label ── */
function signalLabel(type: string): string {
  switch (type) {
    case "co_investment":
    case "co_investment_recency":
    case "co-investment":        return "Co-investment";
    case "event":
    case "event_attendance":     return "Event";
    case "email":
    case "email_contact":        return "Email";
    case "meeting":              return "Meeting";
    default:                     return type.replace(/_/g, " ");
  }
}

/* ── Relationship summary — intelligence prose ── */
function RelationshipSummary({ investor }: { investor: Investor }) {
  const tier = investor.warmthTier;
  const uniqueCoInvestments = investor.coInvestments.filter(
    (ci, idx, arr) =>
      arr.findIndex((c) => c.portfolioCompany.name === ci.portfolioCompany.name) === idx
  );
  const companyNames = uniqueCoInvestments.map((c) => c.portfolioCompany.name);
  const uniqueSignalTypes = Array.from(new Set(investor.signals.map((s) => s.type)));
  const latestSignal = investor.signals[investor.signals.length - 1];

  if (tier === "Cold") {
    return (
      <p className="text-sm text-[#6B7280] leading-relaxed">
        No co-investment or contact history on record with {investor.fund.name}.
        An introduction through a mutual portfolio company would be the natural entry point.
      </p>
    );
  }

  if (tier === "Stale") {
    return (
      <div className="space-y-2.5">
        {companyNames.length > 0 && (
          <div className="flex items-start gap-2.5">
            <Bullet />
            <p className="text-sm text-[#374151] leading-relaxed">
              Co-investor relationship established through{" "}
              <span className="font-medium text-[#0D1320]">{companyNames.join(" and ")}</span>
              {", "}the foundation is there but contact has lapsed.
            </p>
          </div>
        )}
        {investor.lastSignalDate && (
          <div className="flex items-start gap-2.5">
            <Bullet />
            <p className="text-sm text-[#374151] leading-relaxed">
              Last recorded engagement:{" "}
              <span className="font-medium text-[#0D1320]">
                {latestSignal ? `${signalLabel(latestSignal.type).toLowerCase()} (${investor.lastSignalDate})` : investor.lastSignalDate}
              </span>
              {". "}No touchpoint since.
            </p>
          </div>
        )}
        {uniqueSignalTypes.length > 0 && (
          <div className="flex items-start gap-2.5">
            <Bullet />
            <p className="text-sm text-[#374151] leading-relaxed">
              Relationship evidence:{" "}
              <span className="text-[#6B7280]">{uniqueSignalTypes.map(signalLabel).join(", ")}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  // Hot or Warm
  return (
    <div className="space-y-2.5">
      {companyNames.length > 0 && (
        <div className="flex items-start gap-2.5">
          <Bullet />
          <p className="text-sm text-[#374151] leading-relaxed">
            Direct co-investor relationship established through{" "}
            <span className="font-medium text-[#0D1320]">{companyNames.join(" and ")}</span>.
          </p>
        </div>
      )}
      {uniqueSignalTypes.map((type) => (
        <div key={type} className="flex items-start gap-2.5">
          <Bullet />
          <p className="text-sm text-[#374151] leading-relaxed">
            {type.includes("co") && type.includes("invest")
              ? `Active co-investment engagement on record`
              : `${signalLabel(type)} engagement on record`}
          </p>
        </div>
      ))}
      {investor.lastSignalDate && latestSignal && (
        <div className="flex items-start gap-2.5">
          <Bullet />
          <p className="text-sm text-[#374151] leading-relaxed">
            Most recent engagement:{" "}
            <span className="font-medium text-[#0D1320]">
              {companyNames[0]
                ? `${companyNames[0]} ${signalLabel(latestSignal.type).toLowerCase()} (${investor.lastSignalDate})`
                : `${signalLabel(latestSignal.type)} (${investor.lastSignalDate})`}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Section divider label ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[9px] uppercase tracking-[0.15em] text-[#C4C9D4] font-semibold mb-3">
      {children}
    </h3>
  );
}

/* ── Drawer ── */
export function ProfileDrawer({ investor, onClose }: ProfileDrawerProps) {
  const uniqueCoInvestments = investor.coInvestments.filter(
    (ci, idx, arr) =>
      arr.findIndex((c) => c.portfolioCompany.name === ci.portfolioCompany.name) === idx
  );

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-black/10 z-40 animate-scrim-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel */}
      <aside
        className="fixed top-0 right-0 h-[100dvh] w-[440px] max-w-[92vw] bg-white z-50 flex flex-col shadow-2xl animate-drawer-in"
        aria-label={`${investor.fund.name} profile`}
      >

        {/* ── Header ── */}
        <div className="px-7 pt-7 pb-6 border-b border-[#F3F4F6] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#C4C9D4] font-semibold mb-1.5">
                Co-investor
              </p>
              <h2 className="text-xl font-bold text-[#0D1320] leading-tight truncate">
                {investor.fund.name}
              </h2>
              <div className="mt-2.5">
                <WarmthBadge tier={investor.warmthTier} />
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 mt-1 w-7 h-7 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#0D1320] hover:bg-[#F3F4F6] transition-colors"
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* Relationship summary */}
          <div className="px-7 pt-6 pb-6 border-b border-[#F3F4F6]">
            <SectionLabel>Relationship status</SectionLabel>
            <RelationshipSummary investor={investor} />
          </div>

          {/* Recommended action */}
          {investor.suggestedAction && (
            <div className="px-7 pt-6 pb-6 border-b border-[#F3F4F6]">
              <SectionLabel>Recommended action</SectionLabel>
              <p className="text-sm text-[#374151] leading-relaxed border-l-[1.5px] border-[#0EA5D6] pl-4">
                {investor.suggestedAction}
              </p>
            </div>
          )}

          {/* Co-investment history */}
          {uniqueCoInvestments.length > 0 && (
            <div className="px-7 pt-6 pb-6 border-b border-[#F3F4F6]">
              <SectionLabel>Co-investments</SectionLabel>
              <div className="space-y-0">
                {uniqueCoInvestments.map((ci, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 border-b border-[#FAFAFA] last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#0D1320]">
                        {ci.portfolioCompany.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        {[ci.round, ci.date].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signal timeline */}
          {investor.signals.length > 0 && (
            <div className="px-7 pt-6 pb-8">
              <SectionLabel>Engagement history</SectionLabel>
              <div className="space-y-4">
                {investor.signals.map((signal, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-[10px] text-[#9CA3AF] shrink-0 w-[72px] tabular-nums pt-0.5 text-right">
                      {signal.date}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0D1320]">
                        {signalLabel(signal.type)}
                      </p>
                      {signal.description && (
                        <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
                          {signal.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
