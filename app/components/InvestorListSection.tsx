"use client";

import { InvestorCard } from "@/app/components/InvestorCard";
import { WarmthBadge } from "@/app/components/WarmthBadge";
import type { Investor, WarmthTier } from "@/app/data/mockData";

interface InvestorListSectionProps {
  filteredInvestors: Investor[];
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterTier: WarmthTier | "All";
  onFilterTierChange: (tier: WarmthTier | "All") => void;
  tierCounts: Record<WarmthTier | "All", number>;
  selectedInvestorId?: string;
  onSelectInvestor: (investor: Investor) => void;
  inModal?: boolean;
}

export function InvestorListSection({
  filteredInvestors,
  totalCount,
  searchQuery,
  onSearchChange,
  filterTier,
  onFilterTierChange,
  tierCounts,
  selectedInvestorId,
  onSelectInvestor,
  inModal = false,
}: InvestorListSectionProps) {
  const tableBreakpoint = inModal ? "md" : "lg";
  const tabletCardsHide = inModal ? "xl:hidden" : "lg:hidden";

  return (
    <section className={inModal ? "px-4 py-4" : "px-4 max-md:px-4 md:px-4 lg:px-6 py-4 max-md:py-3 lg:py-6"}>
      {!inModal && (
        <div className="mb-4 lg:mb-5">
          <h2 className="text-sm font-semibold text-ink hidden lg:block">Relationships</h2>
          <p className="text-xs text-muted mt-0.5 hidden lg:block">
            Browse co-investor warmth across the network
          </p>
        </div>
      )}

      <div className="relative mb-4">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          enterKeyHint="search"
          placeholder="Search investors..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-mist border border-line rounded-2xl text-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-ink/20"
        />
      </div>

      <div className={`${inModal ? "" : "-mx-4 px-4 lg:mx-0 lg:px-0"} mb-5 overflow-x-auto scrollbar-hide snap-scroll-x lg:overflow-visible`}>
        <div className="flex gap-2 min-w-max lg:flex-wrap lg:min-w-0 pb-1">
          {(["All", "Hot", "Warm", "Cold", "Stale"] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => onFilterTierChange(tier)}
              className={`touch-press snap-item px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
                filterTier === tier
                  ? "bg-ink text-paper"
                  : "bg-mist text-muted border border-line"
              }`}
            >
              {tier} · {tierCounts[tier]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted mb-3">
        {filteredInvestors.length} of {totalCount} relationships
      </p>

      <div className={`${tableBreakpoint === "md" ? "hidden md:block" : "hidden lg:block"} border border-line rounded-2xl overflow-hidden bg-mist/30`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy text-left text-paper">
              <th className="font-semibold px-4 py-3">Fund</th>
              <th className="font-semibold px-4 py-3">Warmth</th>
              <th className="font-semibold px-4 py-3 hidden xl:table-cell">Co-investments</th>
              <th className="font-semibold px-4 py-3 hidden xl:table-cell">Last signal</th>
              <th className="font-semibold px-4 py-3 hidden 2xl:table-cell">Signals</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvestors.map((investor, index) => {
              const selected = investor.id === selectedInvestorId;
              return (
                <tr
                  key={investor.id}
                  onClick={() => onSelectInvestor(investor)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectInvestor(investor);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  className={`border-t border-line cursor-pointer transition-colors ${
                    selected
                      ? "bg-navy/50"
                      : index % 2 === 1
                        ? "bg-mist/40 hover:bg-mist/70"
                        : "bg-paper/40 hover:bg-mist/70"
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{investor.fund.name}</p>
                    <p className="text-xs text-muted mt-0.5">{investor.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <WarmthBadge tier={investor.warmthTier} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-muted hidden xl:table-cell">
                    {investor.coInvestments.length}
                  </td>
                  <td className="px-4 py-3 text-muted hidden xl:table-cell">
                    {investor.lastSignalDate ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted hidden 2xl:table-cell">
                    {investor.signals.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: single column stack */}
      <div className="flex flex-col gap-3 md:hidden">
        {filteredInvestors.map((investor) => (
          <InvestorCard
            key={investor.id}
            investor={investor}
            onClick={() => onSelectInvestor(investor)}
          />
        ))}
      </div>

      {/* Tablet: two columns */}
      <div className={`hidden md:grid md:grid-cols-2 md:gap-3 ${tabletCardsHide}`}>
        {filteredInvestors.map((investor) => (
          <InvestorCard
            key={investor.id}
            investor={investor}
            onClick={() => onSelectInvestor(investor)}
          />
        ))}
      </div>

      {filteredInvestors.length === 0 && (
        <div className="text-center py-20">
          <p className="text-ink text-lg font-medium">No investors found</p>
          <p className="text-muted text-sm mt-2">Try a different search or filter</p>
        </div>
      )}
    </section>
  );
}
