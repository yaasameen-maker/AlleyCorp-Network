"use client";

import { useMemo } from "react";
import type { Investor } from "@/lib/investors";
import {
  buildTodayOverview,
  formatTodayOverviewPlainText,
  type OverviewItem,
} from "@/lib/today-overview-client";

interface TodayOverviewViewProps {
  investors: Investor[];
  onSelectInvestor?: (investor: Investor) => void;
}

function SectionBlock({
  title,
  count,
  emptyLabel,
  pending,
  pendingMessage,
  items,
  investors,
  onSelectInvestor,
}: {
  title: string;
  count: number;
  emptyLabel: string;
  pending?: boolean;
  pendingMessage?: string;
  items: OverviewItem[];
  investors: Investor[];
  onSelectInvestor?: (investor: Investor) => void;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-2">
          {title}
          <span className="ml-1.5 text-[#C4C9D4]">({count})</span>
        </h2>
        <hr className="brand-line" />
      </div>

      {pending ? (
        <div className="rounded border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-1">
            Pending news feed
          </p>
          <p className="text-xs text-[#6B7280] leading-relaxed">{pendingMessage ?? emptyLabel}</p>
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-[#9CA3AF] py-3 px-1">{emptyLabel}</p>
      ) : (
        <div className="bg-white rounded border border-[#E5E7EB] divide-y divide-[#F3F4F6]">
          {items.map((item) => {
            const investor = investors.find((i) => i.id === item.investorId);
            const clickable = Boolean(investor && onSelectInvestor);
            const select = () => investor && onSelectInvestor?.(investor);
            // Row is a div (not a button) so the "Source" <a> can live inside it —
            // an <a> nested in a <button> is invalid HTML and warns in React.
            return (
              <div
                key={item.id}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? select : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          select();
                        }
                      }
                    : undefined
                }
                className={`px-4 py-3 transition-colors ${
                  clickable ? "cursor-pointer hover:bg-[#F8F7F4]" : ""
                }`}
              >
                <p className="text-sm font-semibold text-[#0D1320] leading-snug">{item.headline}</p>
                {item.detail ? (
                  <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{item.detail}</p>
                ) : null}
                <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                  {item.timestamp}
                  {item.source ? ` · ${item.source}` : ""}
                  {item.sourceUrl ? (
                    <>
                      {" · "}
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#0EA5D6]"
                      >
                        Source
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const EMPTY_LABELS: Record<string, string> = {
  "new-signals": "No new source-backed signals yet.",
  "relationship-changes": "No relationship tier changes to flag.",
  "deep-tech-headlines": "External news feed not connected yet.",
  "media-signals": "No event, podcast, or Substack signals yet.",
};

export function TodayOverviewView({ investors, onSelectInvestor }: TodayOverviewViewProps) {
  const overview = useMemo(() => buildTodayOverview(investors), [investors]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatTodayOverviewPlainText(overview));
    } catch {
      /* clipboard optional */
    }
  };

  const today = new Date(overview.generatedAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const totalItems = overview.sections.reduce((n, s) => n + (s.pending ? 0 : s.items.length), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#0EA5D6] font-semibold mb-1">
            Today Overview
          </p>
          <h1 className="text-lg font-bold text-[#0D1320] leading-tight">{overview.headline}</h1>
          <p className="text-[11px] text-[#9CA3AF] mt-1">{today}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold tabular-nums text-[#0D1320]">{totalItems}</p>
          <p className="text-[9px] uppercase tracking-widest text-[#9CA3AF]">Updates</p>
        </div>
      </div>

      {overview.sections.map((section) => (
        <SectionBlock
          key={section.id}
          title={section.title}
          count={section.pending ? 0 : section.items.length}
          emptyLabel={EMPTY_LABELS[section.id] ?? "No updates yet."}
          pending={section.pending}
          pendingMessage={section.pendingMessage}
          items={section.items}
          investors={investors}
          onSelectInvestor={onSelectInvestor}
        />
      ))}

      {totalItems > 0 ? (
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs font-medium text-[#9CA3AF] hover:text-[#0EA5D6] transition-colors"
        >
          Copy overview to clipboard
        </button>
      ) : null}
    </div>
  );
}
