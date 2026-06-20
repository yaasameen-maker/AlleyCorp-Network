"use client";

import type { Investor, WarmthTier } from "@/lib/investors";
import { InvestorRow } from "./InvestorRow";
import { useDarkMode } from "@/app/hooks/useDarkMode";
import { useAnimationToggle } from "@/app/hooks/useAnimationToggle";

interface AppSidebarProps {
  investors: Investor[];
  selectedInvestorId?: string;
  onSelectInvestor: (investor: Investor) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterTier: WarmthTier | "All";
  onFilterTierChange: (tier: WarmthTier | "All") => void;
  tierCounts: Record<WarmthTier | "All", number>;
  activeView: "briefing" | "overview";
  onViewChange: (view: "briefing" | "overview") => void;
  onAskOpen: () => void;
}

const TIERS: (WarmthTier | "All")[] = ["All", "Hot", "Warm", "Stale", "Cold"];

const TIER_COLORS: Record<WarmthTier | "All", string> = {
  All: "bg-[#0D1320] text-white",
  Hot: "bg-[#D1FAE5] text-[#065F46]",
  Warm: "bg-[#FEF3C7] text-[#92400E]",
  Stale: "bg-[#FEE2E2] text-[#991B1B]",
  Cold: "bg-[#F3F4F6] text-[#4B5563]",
};

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <circle cx="5.5" cy="5.5" r="4.25" stroke="#9CA3AF" strokeWidth="1.25" />
      <path d="M8.5 8.5L11.5 11.5" stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

/** Skeuomorphic toggle — raised thumb, inset track, teal glow when on */
function SkeuToggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.08em", userSelect: "none" }}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Toggle ${label}`}
        onClick={onToggle}
        style={{
          position: "relative",
          width: 32,
          height: 18,
          borderRadius: 9,
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
          backgroundColor: on ? "#0EA5D6" : "#CBD5E1",
          boxShadow: on
            ? "0 0 8px rgba(14,165,214,0.5), inset 0 1px 1px rgba(255,255,255,0.2)"
            : "inset 0 2px 3px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.06)",
          transition: "background-color 0.2s, box-shadow 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            borderRadius: "50%",
            width: 14,
            height: 14,
            background: "linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.06)",
            transform: on ? "translateX(16px)" : "translateX(2px)",
            transition: "transform 0.2s",
          }}
        />
      </button>
    </div>
  );
}

export function AppSidebar({
  investors,
  selectedInvestorId,
  onSelectInvestor,
  searchQuery,
  onSearchChange,
  filterTier,
  onFilterTierChange,
  tierCounts,
  activeView,
  onViewChange,
  onAskOpen,
}: AppSidebarProps) {
  const { dark, toggle: toggleDark } = useDarkMode();
  const { enabled: animEnabled, toggle: toggleAnim } = useAnimationToggle();

  return (
    <aside className="w-[272px] shrink-0 h-[100dvh] flex flex-col bg-white border-r border-[#EAECEF] z-10">
      {/* ── Header — wordmark + toggles ── */}
      <div className="px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <img src="/logo.png" alt="AlleyCorp" className="h-8 w-8 object-contain rounded-md" />
          <div
            style={{
              background: dark ? "#1a2535" : "#F0F2F5",
              borderRadius: 12,
              padding: "8px 10px",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(0,0,0,0.06)",
            }}
          >
            <SkeuToggle on={animEnabled} onToggle={toggleAnim} label="FX" />
            <div style={{ height: 6 }} />
            <SkeuToggle on={dark} onToggle={toggleDark} label="Dark" />
          </div>
        </div>
        <p className="text-[11px] text-[#9CA3AF] leading-tight">
          Co-investor network
          <br />
          Deep Tech · 2026
        </p>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 border-t border-[#F3F4F6] mb-4 shrink-0" />

      {/* ── Search ── */}
      <div className="px-5 pb-3 shrink-0">
        <div className="relative flex items-center">
          <span className="absolute left-3 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search funds…"
            className="
              w-full pl-8 pr-3 py-2 text-[12px]
              bg-[#F7F8FA] border border-[#EAECEF] rounded-lg
              text-[#0D1320] placeholder:text-[#C4C9D4]
              focus:outline-none focus:border-[#0EA5D6] focus:bg-white
              transition-colors
            "
          />
        </div>
      </div>

      {/* ── Tier filter pills — no-wrap single row ── */}
      <div className="px-5 pb-4 shrink-0 flex gap-1 overflow-x-auto scrollbar-hide">
        {TIERS.map((tier) => {
          const active = filterTier === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => onFilterTierChange(tier)}
              className={`
                px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide transition-all
                ${
                  active
                    ? TIER_COLORS[tier] + " shadow-sm"
                    : "bg-transparent text-[#9CA3AF] hover:text-[#4B5563] hover:bg-[#F3F4F6]"
                }
              `}
            >
              {tier}{" "}
              <span className={active ? "opacity-60" : "opacity-70"}>{tierCounts[tier]}</span>
            </button>
          );
        })}
      </div>

      {/* ── Section label ── */}
      <div className="px-5 pb-2 shrink-0">
        <p className="text-[9px] uppercase tracking-[0.15em] text-[#C4C9D4] font-semibold">
          Investors · {tierCounts.All}
        </p>
      </div>

      {/* ── Investor list — scrollable ── */}
      <div className="flex-1 min-h-0 overflow-y-auto border-t border-[#F3F4F6]">
        {investors.length === 0 ? (
          <p className="px-5 py-10 text-xs text-[#9CA3AF] text-center">
            No funds match your search
          </p>
        ) : (
          investors.map((investor) => (
            <InvestorRow
              key={investor.id}
              investor={investor}
              isSelected={investor.id === selectedInvestorId}
              onClick={() => onSelectInvestor(investor)}
            />
          ))
        )}
      </div>

      {/* ── Footer nav ── */}
      <div className="shrink-0 border-t border-[#F3F4F6] px-4 py-3 space-y-1">
        {/* Ask button — primary action */}
        <button
          type="button"
          onClick={onAskOpen}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0D1320] text-white text-[11px] font-semibold hover:bg-[#1a2535] transition-colors"
        >
          <svg
            className="w-3 h-3 shrink-0"
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
          Ask the network
        </button>

        <button
          type="button"
          onClick={() => onViewChange(activeView === "overview" ? "briefing" : "overview")}
          className={`w-full text-left px-3 py-1.5 rounded text-[11px] transition-colors ${
            activeView === "overview"
              ? "text-[#0EA5D6] bg-[#F0F9FF]"
              : "text-[#9CA3AF] hover:text-[#0D1320] hover:bg-[#F7F8FA]"
          }`}
        >
          Today Overview
        </button>
        <a
          href="/portfolio"
          className="block px-3 py-1.5 rounded text-[11px] text-[#9CA3AF] hover:text-[#0D1320] hover:bg-[#F7F8FA] transition-colors"
        >
          Portfolio
        </a>
      </div>
    </aside>
  );
}
