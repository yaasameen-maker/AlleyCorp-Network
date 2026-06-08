"use client";

import type { Investor, WarmthTier } from "@/app/data/mockData";

/* ── Warmth badge ── */

const BADGE_DOT: Record<WarmthTier, string> = {
  Hot:   "bg-[#0EA5D6]",
  Warm:  "bg-[#94A3B8]",
  Stale: "bg-[#CBD5E1]",
  Cold:  "bg-[#E2E8F0]",
};

export function WarmthBadge({ tier }: { tier: WarmthTier }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-[#EAECEF]">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${BADGE_DOT[tier]}`} aria-hidden />
      <span className="text-[9px] font-semibold tracking-widest uppercase text-[#6B7280] leading-none">
        {tier}
      </span>
    </span>
  );
}

/* ── Investor row ── */

interface InvestorRowProps {
  investor: Investor;
  isSelected: boolean;
  onClick: () => void;
}

export function InvestorRow({ investor, isSelected, onClick }: InvestorRowProps) {
  const company = investor.coInvestments[0]?.portfolioCompany.name;

  return (
    // group added so fund name can react to row hover — Luba, Jun 2026
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full text-left px-4 py-3.5 flex items-start justify-between gap-2",
        "border-l-2 transition-all duration-150 ease-out",
        isSelected
          ? "border-l-[#0EA5D6] bg-[#F8F7F4]"
          : "border-l-transparent hover:bg-[#F8F7F4] hover:border-l-[#0EA5D6]",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <p className={[
          "text-[12px] truncate leading-snug transition-colors duration-150",
          isSelected
            ? "font-bold text-[#0D1320]"
            : "font-semibold text-[#1F2937] group-hover:text-[#0EA5D6]",
        ].join(" ")}>
          {investor.fund.name}
        </p>
        <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate leading-snug">
          {company ?? ""}
          {investor.lastSignalDate ? ` · ${investor.lastSignalDate}` : ""}
        </p>
      </div>
      <WarmthBadge tier={investor.warmthTier} />
    </button>
  );
}
