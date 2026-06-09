"use client";

import type { CoInvestment } from "@/app/data/mockData";
import { formatHumanDate } from "@/lib/dates";

interface CoInvestmentCardProps {
  investment: CoInvestment;
  id: string;
  index: number;
  isHighlighted: boolean;
}

export function CoInvestmentCard({ investment, id, index, isHighlighted }: CoInvestmentCardProps) {
  return (
    <article
      id={id}
      className={`border rounded-2xl p-4 transition-all duration-300 animate-fade-in-up touch-press ${
        isHighlighted ? "border-ink/50 bg-navy" : "border-line bg-paper"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-ink text-sm sm:text-base font-semibold">
            {investment.portfolioCompany.name}
          </h4>
          <a
            href={`https://${investment.portfolioCompany.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm text-muted underline underline-offset-2 hover:text-ink break-all"
          >
            {investment.portfolioCompany.url}
          </a>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs sm:text-sm border whitespace-nowrap shrink-0 ${
            investment.fundParticipated
              ? "bg-signal-green/10 text-signal-green border-signal-green/30"
              : "bg-paper text-muted border-line"
          }`}
        >
          {investment.fundParticipated ? "Participated" : "Did not participate"}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs sm:text-sm text-muted flex-wrap">
        <span>Round: {investment.round}</span>
        <span className="hidden sm:inline">·</span>
        <time>{formatHumanDate(investment.date)}</time>
      </div>
    </article>
  );
}
