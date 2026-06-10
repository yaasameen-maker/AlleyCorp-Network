"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AskPanel } from "@/app/components/AskPanel";
import { BriefingDashboard } from "@/app/components/BriefingDashboard";
import { InvestorRow } from "@/app/components/InvestorRow";
import { ProfileDrawer } from "@/app/components/ProfileDrawer";
import { DigestView } from "@/app/components/DigestView";
import { getInvestors } from "@/app/data/investors";
import { type Investor, type WarmthTier } from "@/lib/investors";
import { useDarkMode } from "@/app/hooks/useDarkMode";

// AppSidebar is no longer used — layout is now full-width single column.
// The sidebar's investor list, filter chips, and nav have moved inline below.

const WARMTH_ORDER: Record<WarmthTier, number> = { Hot: 0, Warm: 1, Stale: 2, Cold: 3 };
const TIERS: WarmthTier[] = ["Hot", "Warm", "Stale", "Cold"];

// Warmth dot colors — same as WarmthBadge in InvestorRow
const TIER_DOT: Record<WarmthTier, string> = {
  Hot: "#0EA5D6",
  Warm: "#94A3B8",
  Stale: "#CBD5E1",
  Cold: "#E2E8F0",
};

function DarkToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={on ? "Switch to light mode" : "Switch to dark mode"}
      className="text-[11px] font-medium text-[#9CA3AF] hover:text-[#0D1320] dark:hover:text-white transition-colors duration-150 tracking-wide"
    >
      {on ? "Light mode" : "Dark mode"}
    </button>
  );
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="7" strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const [allInvestors, setAllInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterTier, setFilterTier] = useState<WarmthTier | "All">("All");
  const [activeView, setActiveView] = useState<"briefing" | "digest">("briefing");
  const [askOpen, setAskOpen] = useState(false);
  const { dark, toggle: toggleDark } = useDarkMode();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getInvestors()
      .then(setAllInvestors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sortedInvestors = useMemo(
    () => [...allInvestors].sort((a, b) => WARMTH_ORDER[a.warmthTier] - WARMTH_ORDER[b.warmthTier]),
    [allInvestors]
  );

  const filteredInvestors = useMemo(() => {
    return sortedInvestors.filter((investor) => {
      const matchesSearch =
        searchQuery === "" || investor.fund.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = filterTier === "All" || investor.warmthTier === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [sortedInvestors, searchQuery, filterTier]);

  const tierCounts = useMemo(
    () => ({
      Hot: allInvestors.filter((i) => i.warmthTier === "Hot").length,
      Warm: allInvestors.filter((i) => i.warmthTier === "Warm").length,
      Stale: allInvestors.filter((i) => i.warmthTier === "Stale").length,
      Cold: allInvestors.filter((i) => i.warmthTier === "Cold").length,
    }),
    [allInvestors]
  );

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchQuery("");
    setSearchOpen(false);
  }

  function toggleFilter(tier: WarmthTier | "All") {
    setFilterTier(tier);
  }

  const handleSelectInvestor = (investor: Investor) => {
    setSelectedInvestor(investor);
    setActiveView("briefing");
  };

  return (
    <div className="min-h-[100dvh] bg-transparent">
      {/* ── Teal aurora strip — top edge ── */}
      <div
        className="hero-aurora pointer-events-none fixed top-0 left-0 right-0 z-50"
        style={{
          height: "3px",
          filter: "blur(0.5px)",
          boxShadow: "0 2px 12px 2px rgba(14,165,214,0.2)",
        }}
        aria-hidden
      />

      {/* ── Sticky top header ── */}
      <header
        className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm"
        style={{ paddingTop: "3px" }}
      >
        <div className="w-full px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/logo.png"
              alt="AlleyCorp"
              width={28}
              height={28}
              className="object-contain rounded-sm shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-[#0EA5D6] font-semibold leading-none">
                AlleyCorp
              </p>
              <p className="text-[11px] text-[#9CA3AF] leading-snug mt-0.5">
                Co-investor network · Deep Tech · 2026
              </p>
            </div>
          </div>

          {/* Nav + dark toggle */}
          <div className="flex items-center gap-4 shrink-0">
            <nav className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveView(activeView === "digest" ? "briefing" : "digest")}
                className={`text-[11px] font-medium transition-colors rounded ${
                  activeView === "digest"
                    ? "text-[#0EA5D6] hover:text-[#0891B2]"
                    : "text-[#9CA3AF] hover:text-[#6B7280]"
                }`}
              >
                {activeView === "digest" ? "Home" : "Digest"}
              </button>
              <Link
                href="/portfolio"
                className="text-[11px] font-medium text-[#9CA3AF] hover:text-[#6B7280] transition-colors rounded"
              >
                Portfolio
              </Link>
            </nav>
            <div className="w-px h-4 bg-[#E5E7EB]" aria-hidden />
            <DarkToggle on={dark} onToggle={toggleDark} />
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-2xl mx-auto px-6 pb-28">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-[#9CA3AF]">Loading…</p>
          </div>
        ) : activeView === "digest" ? (
          <div className="pt-6">
            <DigestView investors={allInvestors} />
          </div>
        ) : (
          <>
            {/* Hero card — sections hidden, parent handles layout */}
            <div className="pt-6">
              <BriefingDashboard
                investors={allInvestors}
                onSelectInvestor={handleSelectInvestor}
                onNetworkHealthClick={() => setFilterTier("Stale")}
                hideSections
              />
            </div>

            {/* ── Filter chips + search ── */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* All */}
                <button
                  type="button"
                  onClick={() => toggleFilter("All")}
                  className={`px-3 py-1.5 rounded text-[11px] font-semibold border transition-all duration-150 ${
                    filterTier === "All"
                      ? "bg-[#0EA5D6] text-white border-[#0EA5D6]"
                      : "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#4B5563] hover:bg-[#F3F4F6] hover:border-[#E5E7EB]"
                  }`}
                >
                  All
                  <span className="ml-1.5 tabular-nums font-normal opacity-70">
                    {allInvestors.length}
                  </span>
                </button>

                {TIERS.map((tier) => {
                  const active = filterTier === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => toggleFilter(tier)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold border transition-all duration-150 ${
                        active
                          ? "bg-[#0EA5D6] text-white border-[#0EA5D6]"
                          : "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#4B5563] hover:bg-[#F3F4F6] hover:border-[#E5E7EB]"
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: active ? "rgba(255,255,255,0.7)" : TIER_DOT[tier],
                        }}
                      />
                      {tier}
                      <span className="tabular-nums font-normal opacity-70">
                        {tierCounts[tier]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Collapsible search */}
              <div className="flex items-center gap-2 shrink-0">
                {searchOpen && (
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) closeSearch();
                    }}
                    placeholder="Search funds…"
                    className="w-40 px-3 py-1.5 text-[12px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-[#0D1320] placeholder:text-[#C4C9D4] focus:outline-none focus:border-[#0EA5D6] transition-all"
                  />
                )}
                <button
                  type="button"
                  onClick={searchOpen ? closeSearch : openSearch}
                  aria-label={searchOpen ? "Close search" : "Search funds"}
                  className={`p-2 rounded-lg transition-colors ${
                    searchOpen || searchQuery
                      ? "text-[#0EA5D6] bg-[#F0F9FF]"
                      : "text-[#9CA3AF] hover:text-[#4B5563] hover:bg-[#F3F4F6]"
                  }`}
                >
                  <SearchIcon />
                </button>
              </div>
            </div>

            {/* Brand line + count label */}
            <div className="mt-3 mb-2">
              <hr className="brand-line" />
              <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-[#C4C9D4] font-semibold">
                {filterTier !== "All" ? `${filterTier} · ` : ""}
                {filteredInvestors.length} fund{filteredInvestors.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Investor list — each row is its own card so card-lift works per item */}
            <div className="space-y-1.5">
              {filteredInvestors.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#9CA3AF]">No funds match</p>
              ) : (
                filteredInvestors.map((investor) => (
                  <div
                    key={investor.id}
                    className="card-lift bg-white rounded border border-[#E5E7EB] overflow-hidden"
                  >
                    <InvestorRow
                      investor={investor}
                      isSelected={investor.id === selectedInvestor?.id}
                      onClick={() => handleSelectInvestor(investor)}
                    />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* ── FAB: Ask the network ── */}
      <button
        type="button"
        onClick={() => setAskOpen(true)}
        aria-label="Ask the network"
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#0EA5D6] text-white shadow-xl hover:bg-[#0891B2] active:scale-95 transition-all duration-150 flex items-center justify-center"
      >
        <ChatIcon />
      </button>

      {/* ── Profile drawer ── */}
      {selectedInvestor && (
        <ProfileDrawer investor={selectedInvestor} onClose={() => setSelectedInvestor(null)} />
      )}

      {/* ── Ask panel ── */}
      {askOpen && (
        <AskPanel
          investors={allInvestors}
          onSelectInvestor={handleSelectInvestor}
          onClose={() => setAskOpen(false)}
        />
      )}
    </div>
  );
}
