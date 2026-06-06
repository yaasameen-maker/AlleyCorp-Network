"use client";

import type { PortfolioCompanyView } from "@/lib/portfolio";
import { CoInvestorRow } from "./CoInvestorRow";

interface CompanyDetailProps {
  row: PortfolioCompanyView;
  onBack: () => void;
  onSelectInvestor: (investorId: string) => void;
}

export function CompanyDetail({ row, onBack, onSelectInvestor }: CompanyDetailProps) {
  const { company, coInvestors } = row;

  return (
    <>
      <div className="shrink-0 flex items-center gap-2 px-4 pb-3 border-b border-line bg-mist/95">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to portfolio list"
          className="touch-target touch-press flex items-center justify-center rounded-full text-ink -ml-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h2 id="portfolio-title" className="font-semibold text-ink truncate">
            {company.name}
          </h2>
          <p className="text-xs text-muted truncate">{company.url}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
        <div className="border border-line rounded-2xl p-4 bg-paper space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-mist border border-line text-muted">
              {company.sector}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-mist border border-line text-muted">
              {company.stage}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-mist border border-line text-muted">
              AlleyCorp · {company.alleyCorpRole}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-3">
            Co-investing funds
          </h3>
          {coInvestors.length === 0 ? (
            <p className="text-sm text-muted border border-line rounded-2xl p-4 bg-paper italic">
              No co-investors recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {coInvestors.map((link) => (
                <CoInvestorRow
                  key={link.investorId}
                  link={link}
                  onSelect={() => onSelectInvestor(link.investorId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
