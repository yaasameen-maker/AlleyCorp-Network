"use client";

import type { CoInvestment } from "@/app/data/mockData";
import { CoInvestmentCard } from "./CoInvestmentCard";

interface CoInvestmentsPanelProps {
  coInvestments: CoInvestment[];
  activeTimelineId: string | null;
}

export function CoInvestmentsPanel({ coInvestments, activeTimelineId }: CoInvestmentsPanelProps) {
  if (coInvestments.length === 0) {
    return (
      <p className="text-sm text-muted py-6 text-center border border-line rounded-xl bg-paper">
        No co-investment history yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {coInvestments.map((investment, index) => {
        const coId = `co-${investment.portfolioCompany.name}-${investment.round}-${investment.date}`;
        return (
          <CoInvestmentCard
            key={coId}
            id={coId}
            investment={investment}
            index={index}
            isHighlighted={activeTimelineId === coId}
          />
        );
      })}
    </div>
  );
}
