"use client";

import type { Investor, WarmthTier } from "@/lib/investors";

/* ── Warmth badge ── */

const BADGE_DOT: Record<WarmthTier, string> = {
  Hot: "bg-[#0EA5D6]",
  Warm: "bg-[#94A3B8]",
  Stale: "bg-[#CBD5E1]",
  Cold: "bg-[#E2E8F0]",
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

/* ── Small fund logo with initials fallback ── */
function RowLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  if (logoUrl) {
    return (
      <div className="relative w-6 h-6 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          width={24}
          height={24}
          className="w-6 h-6 rounded object-contain bg-white border border-[#EAECEF]"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div
          className="w-6 h-6 rounded bg-[#0EA5D6] text-white text-[8px] font-bold items-center justify-center absolute inset-0"
          style={{ display: "none" }}
          aria-hidden
        >
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-6 h-6 rounded bg-[#0EA5D6]/10 border border-[#0EA5D6]/20 text-[#0EA5D6] text-[8px] font-bold flex items-center justify-center shrink-0"
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function InvestorRow({ investor, isSelected, onClick }: InvestorRowProps) {
  const company = investor.coInvestments[0]?.portfolioCompany.name;
  const signalCount = investor.signals.length;

  // Build the subtext parts: company · N signals · date
  const subtextParts: string[] = [];
  if (company) subtextParts.push(company);
  if (signalCount > 0) subtextParts.push(`${signalCount} signal${signalCount !== 1 ? "s" : ""}`);
  if (investor.lastSignalDate) subtextParts.push(investor.lastSignalDate);

  return (
    // group added so fund name can react to row hover — Luba, Jun 2026
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full text-left px-4 py-3.5 flex items-center justify-between gap-2",
        "border-l-2 transition-all duration-150 ease-out",
        isSelected
          ? "border-l-[#0EA5D6] bg-[#F8F7F4]"
          : "border-l-transparent hover:bg-[#F8F7F4] hover:border-l-[#0EA5D6]",
      ].join(" ")}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <RowLogo name={investor.fund.name} logoUrl={investor.fund.logoUrl} />
        <div className="min-w-0">
          <p
            className={[
              "text-[12px] truncate leading-snug transition-colors duration-150",
              isSelected
                ? "font-bold text-[#0D1320]"
                : "font-semibold text-[#1F2937] group-hover:text-[#0EA5D6]",
            ].join(" ")}
          >
            {investor.fund.name}
          </p>
          {subtextParts.length > 0 && (
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate leading-snug">
              {subtextParts.join(" · ")}
            </p>
          )}
        </div>
      </div>
      <WarmthBadge tier={investor.warmthTier} />
    </button>
  );
}
