"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Investor } from "@/app/data/mockData";
import { getRelationshipAlerts } from "@/lib/alerts";
import { AlertCard } from "./components/AlertCard";

export interface StaleAlertsBannerProps {
  investors: Investor[];
  onSelectInvestor: (investor: Investor) => void;
}

export function StaleAlertsBanner({ investors, onSelectInvestor }: StaleAlertsBannerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const alerts = useMemo(() => getRelationshipAlerts(investors), [investors]);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 1;
    const gap = 12;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(index, alerts.length - 1));
  }, [alerts.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => el.removeEventListener("scroll", updateActiveIndex);
  }, [updateActiveIndex]);

  if (alerts.length === 0) return null;

  const staleCount = alerts.filter((a) => a.type === "stale_relationship").length;
  const warmAtRiskCount = alerts.filter((a) => a.type === "warm_at_risk").length;

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setActiveIndex(index);
  };

  const alertCards = alerts.map((alert) => {
    const investor = investors.find((i) => i.id === alert.investorId);
    if (!investor) return null;
    return (
      <AlertCard
        key={alert.id}
        alert={alert}
        onSelect={() => onSelectInvestor(investor)}
      />
    );
  });

  return (
    <section
      className="mb-5 -mx-4 px-4 py-4 bg-navy/40 border-y border-line safe-x md:mx-0 md:rounded-2xl md:border lg:px-6 lg:mb-0 lg:mt-0"
      aria-label="Relationships needing attention"
    >
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-sm font-semibold text-ink">Needs attention</h2>
          <p className="text-xs text-muted mt-0.5">
            {staleCount > 0 && `${staleCount} stale`}
            {staleCount > 0 && warmAtRiskCount > 0 && " · "}
            {warmAtRiskCount > 0 && `${warmAtRiskCount} warm at risk`}
          </p>
        </div>
        <span className="text-xs font-medium text-muted bg-paper/80 px-2.5 py-1 rounded-full">
          {alerts.length}
        </span>
      </div>

      {alerts.length > 1 && (
        <p className="text-[11px] text-muted mb-2 flex items-center gap-1.5 max-md:flex md:hidden">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Swipe to see all {alerts.length} alerts
        </p>
      )}

      {/* Mobile: horizontal swipe carousel */}
      <div className="relative max-md:block md:hidden">
        {alerts.length > 1 && (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-navy/40 to-transparent z-[1]"
            aria-hidden
          />
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-scroll-x pb-2 -mx-1 px-1 pr-4"
        >
          {alertCards}
        </div>
        {alerts.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {alerts.map((alert, index) => (
              <button
                key={alert.id}
                type="button"
                aria-label={`Go to alert ${index + 1}`}
                onClick={() => scrollToIndex(index)}
                className={`h-1.5 rounded-full transition-all touch-press ${
                  index === activeIndex ? "w-5 bg-ink" : "w-1.5 bg-line"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tablet + desktop: grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {alertCards}
      </div>
    </section>
  );
}
