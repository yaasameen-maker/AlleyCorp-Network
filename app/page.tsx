"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InvestorCard } from "./components/InvestorCard";
import { InvestorProfile } from "./components/InvestorProfile";
import { getInvestors } from "./data/investors";
import { type Investor, type WarmthTier } from "./data/mockData";

export default function InvestorListPage() {
  const router = useRouter();
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<WarmthTier | "All">("All");

  // Single source of investor data. Swap getInvestors() to a real fetch when the
  // backend is live (see app/data/investors.ts) — no other UI changes needed.
  const allInvestors = useMemo(() => getInvestors(), []);

  const filteredInvestors = useMemo(() => {
    return allInvestors.filter((investor) => {
      const matchesSearch =
        searchQuery === "" ||
        investor.fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        investor.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = filterTier === "All" || investor.warmthTier === filterTier;

      return matchesSearch && matchesTier;
    });
  }, [allInvestors, searchQuery, filterTier]);

  const tierCounts = useMemo(() => {
    return {
      All: allInvestors.length,
      Hot: allInvestors.filter((i) => i.warmthTier === "Hot").length,
      Warm: allInvestors.filter((i) => i.warmthTier === "Warm").length,
      Cold: allInvestors.filter((i) => i.warmthTier === "Cold").length,
      Stale: allInvestors.filter((i) => i.warmthTier === "Stale").length,
    };
  }, [allInvestors]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
                AlleyCorp
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
                Investor Intelligence
              </h1>
              <p className="text-sm text-muted mt-1">
                Co-investor relationship intelligence and warmth tracking
              </p>
            </div>
            <button
              onClick={() => router.push("/portfolio")}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-muted hover:text-ink text-sm font-medium transition-colors"
            >
              Portfolio
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search investors or funds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-paper border border-line rounded-xl text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-ink/15 focus:border-ink transition-colors"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["All", "Hot", "Warm", "Cold", "Stale"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterTier === tier
                    ? "bg-ink text-paper"
                    : "bg-paper text-muted border border-line hover:border-ink hover:text-ink"
                }`}
              >
                {tier} ({tierCounts[tier]})
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 mb-4 text-sm text-muted">
          Showing {filteredInvestors.length} of {allInvestors.length} investors
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInvestors.map((investor) => (
            <InvestorCard
              key={investor.id}
              investor={investor}
              onClick={() => setSelectedInvestor(investor)}
            />
          ))}
        </div>

        {filteredInvestors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-ink text-lg">No investors found</p>
            <p className="text-muted text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {selectedInvestor && (
        <InvestorProfile investor={selectedInvestor} onClose={() => setSelectedInvestor(null)} />
      )}
    </main>
  );
}
