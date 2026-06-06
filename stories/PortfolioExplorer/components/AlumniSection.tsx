"use client";

import { useState } from "react";
import type { PortfolioCompanyView } from "@/lib/portfolio";
import { CompanyCard } from "./CompanyCard";

interface AlumniSectionProps {
  rows: PortfolioCompanyView[];
  onSelectCompany: (companyId: string) => void;
}

export function AlumniSection({ rows, onSelectCompany }: AlumniSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) return null;

  return (
    <section className="pt-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="touch-press w-full flex items-center justify-between gap-3 py-3 border-t border-line"
        aria-expanded={expanded}
      >
        <div className="text-left">
          <p className="text-sm font-medium text-ink">Alumni</p>
          <p className="text-xs text-muted mt-0.5">
            {rows.length} exited {rows.length === 1 ? "company" : "companies"}
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-2 pb-2 animate-fade-in-up">
          {rows.map((row) => (
            <CompanyCard
              key={row.company.id}
              row={row}
              onSelect={() => onSelectCompany(row.company.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
