"use client";

import type { Investor, WarmthTier } from "@/app/data/mockData";
import { AskNetworkNavPanel } from "./AskNetworkNavPanel";
import { RelationshipsNavItem } from "./RelationshipsNavItem";

export type AppView = "dashboard" | "digest" | "portfolio";

interface AppSidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
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
}

const NAV_ITEMS: { id: AppView; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    id: "digest",
    label: "Email Digest",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
];

export function AppSidebar({
  activeView,
  onNavigate,
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
}: AppSidebarProps) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-56 xl:w-64 shrink-0 border-r border-line bg-paper h-[100dvh] relative z-[170]">
      <div className="px-5 py-6 border-b border-line shrink-0">
        <p className="text-[11px] uppercase tracking-wider text-muted font-semibold">AlleyCorp</p>
        <h1 className="text-lg font-semibold tracking-tight text-ink mt-0.5">Investor Intelligence</h1>
      </div>

      <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-mist text-ink border border-line"
                    : "text-muted hover:text-ink hover:bg-mist/50"
                }`}
              >
                {item.icon}
                {item.label}
              </button>

              {item.id === "portfolio" && (
                <AskNetworkNavPanel
                  investors={investors}
                  onSelectInvestor={onSelectInvestor}
                />
              )}
            </div>
          );
        })}

        <div className="pt-1">
          <RelationshipsNavItem
            variant="sidebar"
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
      </nav>

      <div className="p-4 border-t border-line shrink-0">
        <p className="text-[11px] text-muted leading-relaxed">
          Open Relationships to browse the full investor list
        </p>
      </div>
    </aside>
  );
}
