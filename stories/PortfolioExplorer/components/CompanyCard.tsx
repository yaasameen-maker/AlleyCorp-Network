"use client";

import type { PortfolioCompanyView } from "@/lib/portfolio";

interface CompanyCardProps {
  row: PortfolioCompanyView;
  onSelect: () => void;
}

export function CompanyCard({ row, onSelect }: CompanyCardProps) {
  const { company, coInvestorCount } = row;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="touch-press w-full text-left border border-line rounded-2xl p-4 bg-paper animate-fade-in-up"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink truncate">{company.name}</h3>
          <p className="text-xs text-muted mt-0.5">{company.sector}</p>
        </div>
        <svg
          className="w-5 h-5 text-muted shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs px-2.5 py-1 rounded-full bg-mist border border-line text-muted">
          {company.stage}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-mist border border-line text-muted">
          AlleyCorp · {company.alleyCorpRole}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-navy/40 border border-line text-ink">
          {coInvestorCount} co-investor{coInvestorCount === 1 ? "" : "s"}
        </span>
      </div>
    </button>
  );
}
