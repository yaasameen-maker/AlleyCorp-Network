"use client";

import type { Investor, InvestorSignal } from "@/lib/investors";
import type { InvestorCategoryMeta } from "@/app/lib/investorCategory";
import {
  formatProfileFreshness,
  groupProfileEvidence,
  sourceLinkLabel,
} from "@/app/lib/groupProfileEvidence";

function signalLabel(type: string): string {
  switch (type) {
    case "co-investment":
      return "Co-investment";
    case "event":
      return "Event";
    case "email":
      return "Email";
    case "meeting":
      return "Meeting";
    default:
      return type.replace(/_/g, " ");
  }
}

function SourceLink({ signal }: { signal: InvestorSignal }) {
  const label = sourceLinkLabel(signal);

  if (signal.sourceUrl) {
    return (
      <a
        href={signal.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-[#0EA5D6] hover:text-[#0284C7] transition-colors mt-1.5"
      >
        {label}
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
    );
  }

  return <p className="text-[11px] text-[#9CA3AF] mt-1.5 italic">{label}</p>;
}

function SignalRow({ signal }: { signal: InvestorSignal }) {
  return (
    <div className="flex gap-4 py-3 border-b border-[#FAFAFA] last:border-0">
      <span className="text-[10px] text-[#9CA3AF] shrink-0 w-[72px] tabular-nums pt-0.5 text-right">
        {signal.date || "—"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0D1320]">{signalLabel(signal.type)}</p>
        {signal.description ? (
          <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{signal.description}</p>
        ) : null}
        {signal.rawSnippet ? (
          <p className="text-[11px] text-[#9CA3AF] mt-1 leading-relaxed line-clamp-2">
            {signal.rawSnippet}
          </p>
        ) : null}
        <SourceLink signal={signal} />
      </div>
    </div>
  );
}

export function ProfileFreshness({ investor }: { investor: Investor }) {
  const lastChecked = formatProfileFreshness(investor.fund.profileLastCheckedAt);
  const lastSignal = investor.lastSignalDate ?? null;

  if (!lastChecked && !lastSignal) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#9CA3AF] mt-3">
      {lastSignal ? (
        <span>
          Last signal: <span className="text-[#6B7280] tabular-nums">{lastSignal}</span>
        </span>
      ) : null}
      {lastChecked ? (
        <span>
          Profile checked: <span className="text-[#6B7280] tabular-nums">{lastChecked}</span>
        </span>
      ) : null}
    </div>
  );
}

export function MarketProspectNotice({ category }: { category: InvestorCategoryMeta }) {
  if (category.id !== "market_prospect" && category.id !== "newly_discovered") {
    return null;
  }

  return (
    <div className="mx-7 mt-6 rounded border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-[#6B7280] font-semibold mb-1">
        Market intelligence — not a confirmed relationship
      </p>
      <p className="text-xs text-[#6B7280] leading-relaxed">
        {category.id === "newly_discovered"
          ? "Recently added to the network map. Evidence is preliminary until verified against a co-investment or direct contact."
          : "Tracked as a deep tech prospect. No confirmed AlleyCorp co-investment or warmth tier commitment yet."}
      </p>
    </div>
  );
}

export function GroupedProfileEvidence({ signals }: { signals: InvestorSignal[] }) {
  const groups = groupProfileEvidence(signals);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-[#9CA3AF] leading-relaxed">
        No source-backed evidence on record yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id}>
          <h4 className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-2">
            {group.title}
            {group.kind === "company" ? (
              <span className="ml-1.5 text-[#C4C9D4] font-normal normal-case tracking-normal">
                · portfolio company
              </span>
            ) : null}
          </h4>
          <div className="rounded border border-[#F3F4F6] bg-[#FDFDFC] px-3">
            {group.signals.map((signal, i) => (
              <SignalRow key={`${group.id}-${i}`} signal={signal} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
