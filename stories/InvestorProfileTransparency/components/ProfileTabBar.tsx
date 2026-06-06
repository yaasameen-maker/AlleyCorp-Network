import type { ReactNode } from "react";
import type { ProfileTab } from "../types";

interface ProfileTabBarProps {
  activeTab: ProfileTab;
  signalCount: number;
  coInvestmentCount: number;
  onTabChange: (tab: ProfileTab) => void;
  variant: "top" | "bottom";
}

const TABS: {
  id: ProfileTab;
  shortLabel: string;
  label: (counts: { signals: number; coInvestments: number }) => string;
  icon: (active: boolean) => ReactNode;
}[] = [
  {
    id: "journey",
    shortLabel: "Journey",
    label: () => "Journey",
    icon: (active) => (
      <svg
        className={`w-5 h-5 ${active ? "text-ink" : "text-muted"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
  },
  {
    id: "signals",
    shortLabel: "Signals",
    label: ({ signals }) => `Signals (${signals})`,
    icon: (active) => (
      <svg
        className={`w-5 h-5 ${active ? "text-ink" : "text-muted"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    id: "co-investments",
    shortLabel: "Co-invest",
    label: ({ coInvestments }) => `Co-investments (${coInvestments})`,
    icon: (active) => (
      <svg
        className={`w-5 h-5 ${active ? "text-ink" : "text-muted"}`}
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
    ),
  },
];

export function ProfileTabBar({
  activeTab,
  signalCount,
  coInvestmentCount,
  onTabChange,
  variant,
}: ProfileTabBarProps) {
  const counts = { signals: signalCount, coInvestments: coInvestmentCount };

  if (variant === "bottom") {
    return (
      <nav
        className="shrink-0 border-t border-line bg-mist/95 backdrop-blur safe-bottom"
        aria-label="Profile sections"
      >
        <div className="grid grid-cols-3">
          {TABS.map(({ id, shortLabel, icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`touch-target touch-press flex flex-col items-center justify-center gap-0.5 py-2 ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                {icon(active)}
                <span className={`text-[10px] font-medium ${active ? "text-ink" : "text-muted"}`}>
                  {shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <div className="hidden lg:flex gap-1 border-b border-line">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={`touch-target touch-press px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === id
              ? "border-ink text-ink"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {label(counts)}
        </button>
      ))}
    </div>
  );
}
