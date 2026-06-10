"use client";

import type { Investor, WarmthTier, DiscoveryContext } from "@/lib/investors";
import { WarmthBadge } from "./InvestorRow";

interface ProfileDrawerProps {
  investor: Investor;
  onClose: () => void;
}

/* ── Close button icon ── */
function IconClose() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M1 1L11 11M11 1L1 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Thin teal bullet ── */
function Bullet() {
  return (
    <span
      className="inline-block w-1 h-1 rounded-full bg-[#0EA5D6] shrink-0 mt-[7px]"
      aria-hidden
    />
  );
}

/* ── Fund logo with initials fallback ── */
function FundLogo({ name, logoUrl, size = 40 }: { name: string; logoUrl?: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className="rounded-lg object-contain bg-white border border-[#F3F4F6] shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => {
          // On Clearbit 404 — swap to initials fallback
          const target = e.currentTarget as HTMLImageElement;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
    );
  }

  return (
    <div
      className="rounded-lg bg-[#0EA5D6] text-white font-bold flex items-center justify-center shrink-0 text-sm tracking-wide"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

/* ── Network Expansion badge — matches WarmthBadge style from InvestorRow.tsx ── */
function NetworkExpansionBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F0FBFF] border border-[#0EA5D6]/30">
      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#0EA5D6]" aria-hidden />
      <span className="text-[9px] font-semibold tracking-widest uppercase text-[#0EA5D6] leading-none">
        Network Target
      </span>
    </span>
  );
}

/* ── Network expansion explanation ── */
function NetworkExpansionSummary({ ctx }: { ctx: DiscoveryContext }) {
  return (
    <div className="space-y-2.5">
      {ctx.via_fund && (
        <div className="flex items-start gap-2.5">
          <Bullet />
          <p className="text-sm text-[#374151] leading-relaxed">
            Frequently co-invests with{" "}
            <span className="font-medium text-[#0D1320]">{ctx.via_fund}</span>
          </p>
        </div>
      )}
      {ctx.shared_rounds !== undefined && (
        <div className="flex items-start gap-2.5">
          <Bullet />
          <p className="text-sm text-[#374151] leading-relaxed">
            Appeared in{" "}
            <span className="font-medium text-[#0D1320]">{ctx.shared_rounds} related rounds</span>
            {ctx.oldest_signal_months !== undefined &&
              ` over the last ${ctx.oldest_signal_months} months`}
          </p>
        </div>
      )}
      {ctx.companies && ctx.companies.length > 0 && (
        <div className="flex items-start gap-2.5">
          <Bullet />
          <p className="text-sm text-[#374151] leading-relaxed">
            Connected through{" "}
            <span className="font-medium text-[#0D1320]">{ctx.companies.join(", ")}</span>
          </p>
        </div>
      )}
      <div className="flex items-start gap-2.5">
        <Bullet />
        <p className="text-sm text-[#374151] leading-relaxed">
          No direct AlleyCorp relationship signals yet
        </p>
      </div>
    </div>
  );
}

/* ── Signal type label ── */
function signalLabel(type: string): string {
  switch (type) {
    case "co_investment":
    case "co_investment_recency":
    case "co-investment":
      return "Co-investment";
    case "event":
    case "event_attendance":
      return "Event";
    case "email":
    case "email_contact":
      return "Email";
    case "meeting":
      return "Meeting";
    default:
      return type.replace(/_/g, " ");
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

  if (
    tier === "Cold" &&
    investor.discoverySource === "network_expansion" &&
    investor.discoveryContext
  ) {
    return <NetworkExpansionSummary ctx={investor.discoveryContext} />;
  }

  if (tier === "Cold") {
    // Cold with past co-investments = relationship gone cold, not "no history"
    if (companyNames.length > 0) {
      return (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Bullet />
            <p className="text-sm text-[#374151] leading-relaxed">
              Co-invested with {investor.fund.name} on{" "}
              <span className="font-medium text-[#0D1320]">{companyNames.join(" and ")}</span>
              {", "}but there has been no contact since. The relationship has gone cold.
            </p>
          </div>
          {investor.lastSignalDate && (
            <div className="flex items-start gap-2.5">
              <Bullet />
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Last signal:{" "}
                {new Date(investor.lastSignalDate).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
                . Re-engaging through a shared portfolio company is the most natural path.
              </p>
            </div>
          )}
        </div>
      );
    }
    // Truly cold — no history at all
    return (
      <p className="text-sm text-[#6B7280] leading-relaxed">
        No co-investment or contact history on record with {investor.fund.name}. An introduction
        through a mutual portfolio company would be the natural entry point.
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
                {latestSignal
                  ? `${signalLabel(latestSignal.type).toLowerCase()} (${investor.lastSignalDate})`
                  : investor.lastSignalDate}
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
              <span className="text-[#6B7280]">
                {uniqueSignalTypes.map(signalLabel).join(", ")}
              </span>
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
      {/* Scrim — z-[50] so it sits above the AskPanel (z-40) when both are open */}
      <div
        className="fixed inset-0 bg-black/10 z-[50] animate-scrim-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel — z-[60] so it's above its own scrim */}
      <aside
        className="fixed top-0 right-0 h-[100dvh] w-[440px] max-w-[92vw] bg-white z-[60] flex flex-col shadow-2xl animate-drawer-in"
        aria-label={`${investor.fund.name} profile`}
      >
        {/* ── Header ── */}
        <div className="px-7 pt-7 pb-6 border-b border-[#F3F4F6] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {/* Fund logo */}
              <FundLogo name={investor.fund.name} logoUrl={investor.fund.logoUrl} size={40} />
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.15em] text-[#C4C9D4] font-semibold mb-1.5">
                  Co-investor
                </p>
                {investor.fund.website ? (
                  <a
                    href={`https://${investor.fund.website.replace(/^https?:\/\//, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-bold text-[#0D1320] leading-tight truncate hover:text-[#0EA5D6] transition-colors inline-block"
                  >
                    {investor.fund.name} ↗
                  </a>
                ) : (
                  <h2 className="text-xl font-bold text-[#0D1320] leading-tight truncate">
                    {investor.fund.name}
                  </h2>
                )}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <WarmthBadge tier={investor.warmthTier} />
                  {investor.discoverySource === "network_expansion" && <NetworkExpansionBadge />}
                </div>
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
          {(investor.suggestedAction || investor.discoverySource === "network_expansion") && (
            <div className="px-7 pt-6 pb-6 border-b border-[#F3F4F6]">
              <SectionLabel>Suggested action</SectionLabel>
              <p className="text-sm text-[#374151] leading-relaxed border-l-[1.5px] border-[#0EA5D6] pl-4">
                {investor.discoverySource === "network_expansion"
                  ? `Track as a target co-investor. ${investor.discoveryContext?.via_fund ? `Consider a warm intro through ${investor.discoveryContext.via_fund}.` : "Identify a warm intro path through existing hot relationships."}`
                  : investor.suggestedAction}
              </p>
            </div>
          )}

          {/* Point of contact */}
          {investor.contact && (
            <div className="px-7 pt-6 pb-6 border-b border-[#F3F4F6]">
              <SectionLabel>Point of contact</SectionLabel>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar — initials in teal circle */}
                  <div className="w-9 h-9 rounded-full bg-[#0EA5D6]/10 border border-[#0EA5D6]/20 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-[#0EA5D6] tracking-wide">
                      {investor.contact.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0D1320] leading-tight truncate">
                      {investor.contact.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">
                      {investor.contact.role}
                    </p>
                  </div>
                </div>
                {investor.contact.linkedinUrl && (
                  <a
                    href={investor.contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-[#0EA5D6] hover:text-[#0284C7] transition-colors"
                    aria-label={`${investor.contact.name} on LinkedIn`}
                  >
                    LinkedIn
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                      <path
                        d="M1.5 8.5L8.5 1.5M8.5 1.5H3.5M8.5 1.5V6.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                )}
              </div>
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
                        {signal.type === "co-investment" && signal.portfolioCompanyName && (
                          <span className="font-normal text-[#6B7280]">
                            {" · "}
                            {signal.portfolioCompanyName}
                          </span>
                        )}
                      </p>
                      {signal.description && (
                        <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
                          {signal.description}
                        </p>
                      )}
                      {signal.sourceUrl && (
                        <a
                          href={signal.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#0EA5D6] hover:text-[#0284C7] transition-colors mt-1"
                        >
                          {signal.source ?? "Source"}
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
                            <path
                              d="M1.5 8.5L8.5 1.5M8.5 1.5H3.5M8.5 1.5V6.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
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
