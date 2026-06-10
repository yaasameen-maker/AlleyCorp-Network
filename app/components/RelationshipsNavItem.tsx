"use client";

import { useState } from "react";
import type { Investor, WarmthTier } from "@/lib/investors";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import { DialogShell } from "./DialogShell";
import { InvestorListSection } from "./InvestorListSection";

interface RelationshipsNavItemProps {
  filteredInvestors: Investor[];
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterTier: WarmthTier | "All";
  onFilterTierChange: (tier: WarmthTier | "All") => void;
  tierCounts: Record<WarmthTier | "All", number>;
  selectedInvestorId?: string;
  onSelectInvestor: (investor: Investor) => void;
  variant: "sidebar" | "mobile";
}

export function RelationshipsNavItem({
  filteredInvestors,
  totalCount,
  searchQuery,
  onSearchChange,
  filterTier,
  onFilterTierChange,
  tierCounts,
  selectedInvestorId,
  onSelectInvestor,
  variant,
}: RelationshipsNavItemProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reopenAfterProfile, setReopenAfterProfile] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const closeModal = () => {
    setModalOpen(false);
    setReopenAfterProfile(false);
  };

  const handleSelect = (investor: Investor) => {
    onSelectInvestor(investor);
    if (isDesktop) {
      // Desktop profile opens in side panel — hide list modal, restore after profile closes
      setReopenAfterProfile(true);
      setModalOpen(false);
    }
    // Mobile/tablet: keep relationships modal open behind profile dialog
  };

  // Reopen the relationships list once the desktop profile panel closes
  // (selectedInvestorId cleared). Adjusting state during render — the
  // React-recommended alternative to a setState-in-effect — the guard flips
  // reopenAfterProfile so this runs exactly once.
  if (reopenAfterProfile && !selectedInvestorId) {
    setReopenAfterProfile(false);
    setModalOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={
          variant === "mobile"
            ? "touch-press w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-ink border border-line rounded-xl bg-mist/50"
            : "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-ink hover:bg-mist/50 transition-colors"
        }
      >
        <span className="flex items-center gap-2 md:gap-3">
          <svg
            className={variant === "mobile" ? "w-4 h-4 text-muted" : "w-5 h-5"}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Relationships
        </span>
        <svg
          className="w-4 h-4 text-muted shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {modalOpen && (
        <DialogShell onClose={closeModal} ariaLabelledBy="relationships-title">
          <header className="shrink-0 flex items-start justify-between gap-3 px-4 py-4 border-b border-line safe-top">
            <div>
              <h2 id="relationships-title" className="text-base font-semibold text-ink">
                Relationships
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Browse co-investor warmth across the network
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close relationships"
              className="touch-target touch-press shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border border-line bg-paper text-muted hover:text-ink"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <InvestorListSection
              inModal
              filteredInvestors={filteredInvestors}
              totalCount={totalCount}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              filterTier={filterTier}
              onFilterTierChange={onFilterTierChange}
              tierCounts={tierCounts}
              selectedInvestorId={selectedInvestorId}
              onSelectInvestor={handleSelect}
            />
          </div>
        </DialogShell>
      )}
    </>
  );
}
