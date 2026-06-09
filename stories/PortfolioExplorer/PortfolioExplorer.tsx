"use client";

import { useMemo, useState } from "react";
import type { Investor } from "@/app/data/mockData";
import { activePortfolioCompanies, alumniPortfolioCompanies } from "@/app/data/portfolioCompanies";
import { buildPortfolioIndex, getPortfolioSectors } from "@/lib/portfolio";
import { AlumniSection } from "./components/AlumniSection";
import { CompanyCard } from "./components/CompanyCard";
import { CompanyDetail } from "./components/CompanyDetail";
import { ExplorerSheet } from "./components/ExplorerSheet";
import { SectorFilter } from "./components/SectorFilter";

export interface PortfolioExplorerProps {
  investors: Investor[];
  isOpen?: boolean;
  onClose?: () => void;
  onSelectInvestor: (investor: Investor) => void;
  variant?: "sheet" | "inline";
}

export function PortfolioExplorer({
  investors,
  isOpen = true,
  onClose,
  onSelectInvestor,
  variant = "sheet",
}: PortfolioExplorerProps) {
  const [sector, setSector] = useState("All");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const activeIndex = useMemo(
    () => buildPortfolioIndex(activePortfolioCompanies, investors),
    [investors]
  );
  const alumniIndex = useMemo(
    () => buildPortfolioIndex(alumniPortfolioCompanies, investors),
    [investors]
  );
  const sectors = useMemo(() => getPortfolioSectors(activePortfolioCompanies), []);

  const filteredActive = useMemo(() => {
    if (sector === "All") return activeIndex;
    return activeIndex.filter((row) => row.company.sector === sector);
  }, [activeIndex, sector]);

  const selectedRow = useMemo(() => {
    if (!selectedCompanyId) return null;
    return [...activeIndex, ...alumniIndex].find((r) => r.company.id === selectedCompanyId) ?? null;
  }, [activeIndex, alumniIndex, selectedCompanyId]);

  if (variant === "sheet" && !isOpen) return null;

  const handleClose = () => {
    setSelectedCompanyId(null);
    setSector("All");
    onClose?.();
  };

  const handleSelectInvestor = (investorId: string) => {
    const investor = investors.find((i) => i.id === investorId);
    if (investor) {
      if (variant === "sheet") handleClose();
      onSelectInvestor(investor);
    }
  };

  const listContent = selectedRow ? (
    <CompanyDetail
      row={selectedRow}
      onBack={() => setSelectedCompanyId(null)}
      onSelectInvestor={handleSelectInvestor}
    />
  ) : (
    <>
      {variant === "sheet" ? (
        <div className="shrink-0 flex items-center justify-between px-4 pb-2 border-b border-line bg-mist/95">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close portfolio"
            className="touch-target touch-press flex items-center justify-center rounded-full text-ink -ml-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-xs text-muted">Portfolio</span>
          <div className="w-10" aria-hidden />
        </div>
      ) : null}

      <div
        className={`shrink-0 px-4 py-4 border-b border-line bg-paper/50 ${
          variant === "inline" ? "lg:px-8 lg:py-5" : ""
        }`}
      >
        <h2
          id="portfolio-title"
          className={`font-semibold text-ink ${variant === "inline" ? "text-xl" : "text-lg"}`}
        >
          Portfolio Companies
        </h2>
        <p className="text-xs text-muted mt-1">
          {activePortfolioCompanies.length} active · Deep Tech coverage
        </p>
      </div>

      <div
        className={`shrink-0 px-4 py-3 border-b border-line ${variant === "inline" ? "lg:px-8" : ""}`}
      >
        <SectorFilter sectors={sectors} selected={sector} onSelect={setSector} />
      </div>

      <div
        className={`p-4 ${
          variant === "inline" ? "lg:px-8 lg:py-6" : "flex-1 overflow-y-auto overscroll-contain"
        }`}
      >
        <p className="text-xs text-muted mb-3">
          {filteredActive.length} of {activePortfolioCompanies.length} companies
        </p>

        {variant === "inline" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredActive.map((row) => (
              <CompanyCard
                key={row.company.id}
                row={row}
                onSelect={() => setSelectedCompanyId(row.company.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredActive.map((row) => (
              <CompanyCard
                key={row.company.id}
                row={row}
                onSelect={() => setSelectedCompanyId(row.company.id)}
              />
            ))}
          </div>
        )}

        {filteredActive.length === 0 && (
          <p className="text-sm text-muted text-center py-12">No companies in this sector</p>
        )}

        <AlumniSection rows={alumniIndex} onSelectCompany={setSelectedCompanyId} />
      </div>
    </>
  );

  if (variant === "inline") {
    return <div className="flex flex-col min-w-0">{listContent}</div>;
  }

  return <ExplorerSheet onClose={handleClose}>{listContent}</ExplorerSheet>;
}
