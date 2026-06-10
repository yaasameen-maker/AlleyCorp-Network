"use client";

import { useState } from "react";
import type { Investor, WarmthTier } from "@/app/data/mockData";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import { AskNetworkPullDown } from "./AskNetworkPullDown";
import { RelationshipsNavItem } from "./RelationshipsNavItem";

/** Mobile + tablet header nav (<1024px). Desktop uses left sidebar instead. */

interface MobileNavToolsProps {
  investors: Investor[];
  onSelectInvestor: (investor: Investor) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterTier: WarmthTier | "All";
  onFilterTierChange: (tier: WarmthTier | "All") => void;
  tierCounts: Record<WarmthTier | "All", number>;
  filteredInvestors: Investor[];
  totalCount: number;
  selectedInvestorId?: string;
  onOpenPortfolio: () => void;
  onOpenDigest: () => void;
}

export function MobileNavTools({
  investors,
  onSelectInvestor,
  searchQuery,
  onSearchChange,
  filterTier,
  onFilterTierChange,
  tierCounts,
  filteredInvestors,
  totalCount,
  selectedInvestorId,
  onOpenPortfolio,
  onOpenDigest,
}: MobileNavToolsProps) {
  const [askOpen, setAskOpen] = useState(false);
  const isMobileOrTablet = useMediaQuery("(max-width: 1023px)");

  // Close the Ask panel when leaving the mobile/tablet breakpoint. Adjusting
  // state during render (guarded by askOpen) instead of in an effect.
  if (!isMobileOrTablet && askOpen) {
    setAskOpen(false);
  }

  return (
    <div className="lg:hidden shrink-0 border-b border-line bg-paper safe-x relative z-[80]">
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">AlleyCorp</p>
          <h1 className="text-[17px] leading-tight font-semibold tracking-tight text-ink truncate">
            Investor Intelligence
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPortfolio}
            aria-label="Portfolio"
            className="touch-target touch-press flex items-center justify-center w-11 h-11 rounded-2xl border border-line bg-mist text-ink md:w-auto md:h-auto md:px-3 md:py-2 md:gap-1.5 md:rounded-xl md:text-xs md:font-medium"
          >
            <svg
              className="w-5 h-5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="hidden md:inline">Portfolio</span>
          </button>

          {/* MOBILE + TABLET (<1024px): button + pull-down — not on desktop */}
          <button
            type="button"
            onClick={() => setAskOpen(true)}
            aria-label="Ask the network"
            aria-expanded={askOpen}
            className="touch-target touch-press flex lg:hidden items-center justify-center w-11 h-11 rounded-2xl border border-line bg-mist text-ink md:w-auto md:h-auto md:px-3 md:py-2 md:gap-1.5 md:rounded-xl md:text-xs md:font-medium"
          >
            <svg
              className="w-5 h-5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="hidden md:inline">Ask network</span>
          </button>

          <button
            type="button"
            onClick={onOpenDigest}
            aria-label="Email digest"
            className="touch-target touch-press flex items-center justify-center w-11 h-11 rounded-2xl border border-line bg-mist text-ink md:w-auto md:h-auto md:px-3 md:py-2 md:gap-1.5 md:rounded-xl md:text-xs md:font-medium"
          >
            <svg
              className="w-5 h-5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="hidden md:inline">Digest</span>
          </button>
        </div>
      </div>

      {isMobileOrTablet && (
        <AskNetworkPullDown
          open={askOpen}
          onClose={() => setAskOpen(false)}
          investors={investors}
          onSelectInvestor={onSelectInvestor}
        />
      )}

      <div className="px-4 pb-3">
        <RelationshipsNavItem
          variant="mobile"
          filteredInvestors={filteredInvestors}
          totalCount={totalCount}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          filterTier={filterTier}
          onFilterTierChange={onFilterTierChange}
          tierCounts={tierCounts}
          onSelectInvestor={onSelectInvestor}
          selectedInvestorId={selectedInvestorId}
        />
      </div>
    </div>
  );
}
