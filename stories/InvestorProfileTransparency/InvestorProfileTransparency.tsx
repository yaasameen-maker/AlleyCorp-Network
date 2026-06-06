"use client";

import { useEffect, useMemo, useState } from "react";
import type { Investor } from "@/app/data/mockData";
import { analyzeWarmth, DATA_REFRESHED_AT } from "@/lib/warmthAnalysis";
import { buildTimelineEvents, formatDataFreshness, sortByDateDesc } from "@/lib/dates";
import type { ProfileTab } from "./types";
import { ProfileModal } from "./components/ProfileModal";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileJourneySteps } from "./components/ProfileJourneySteps";
import { ProfileSummaryStats } from "./components/ProfileSummaryStats";
import { SuggestedActionCard } from "./components/SuggestedActionCard";
import { WarmthExplainer } from "./components/WarmthExplainer";
import { ProfileTabBar } from "./components/ProfileTabBar";
import { RelationshipTimeline } from "./components/RelationshipTimeline";
import { SignalsPanel } from "./components/SignalsPanel";
import { CoInvestmentsPanel } from "./components/CoInvestmentsPanel";
import { InvestorProfileEmailDraft } from "@/stories/InvestorProfileEmailDraft";

export interface InvestorProfileTransparencyProps {
  investor: Investor;
  onClose: () => void;
  initialTab?: ProfileTab;
  layout?: "modal" | "panel";
}

export function InvestorProfileTransparency({
  investor,
  onClose,
  initialTab = "journey",
  layout = "modal",
}: InvestorProfileTransparencyProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [highlightedFactor, setHighlightedFactor] = useState<string | null>(null);
  const [activeTimelineId, setActiveTimelineId] = useState<string | null>(null);

  const analysis = useMemo(() => analyzeWarmth(investor), [investor]);
  const sortedCoInvestments = useMemo(
    () => sortByDateDesc(investor.coInvestments),
    [investor.coInvestments]
  );
  const timelineEvents = useMemo(
    () => buildTimelineEvents(investor.signals, investor.coInvestments),
    [investor.signals, investor.coInvestments]
  );

  const journeyStep: "score" | "why" | "history" = highlightedFactor
    ? "why"
    : activeTab === "journey" && !activeTimelineId
      ? "score"
      : "history";

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, investor.id]);

  useEffect(() => {
    if (!activeTimelineId) return;
    document.getElementById(activeTimelineId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activeTimelineId]);

  const handleTimelineSelect = (id: string | null) => {
    setActiveTimelineId(id);
    if (id?.startsWith("signal-")) setActiveTab("signals");
    if (id?.startsWith("co-")) setActiveTab("co-investments");
  };

  return (
    <ProfileModal onClose={onClose} layout={layout}>
      <ProfileHeader
        fundName={investor.fund.name}
        warmthTier={investor.warmthTier}
        onClose={onClose}
        layout={layout}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 sm:p-5 space-y-5 pb-6">
          <ProfileJourneySteps
            activeStep={
              highlightedFactor ? "why" : activeTab === "journey" ? "score" : journeyStep
            }
          />

          <ProfileSummaryStats
            warmthTier={investor.warmthTier}
            lastSignalDate={investor.lastSignalDate}
            activeSignalCount={analysis.activeSignalCount}
            totalSignalCount={analysis.totalSignalCount}
          />

          <WarmthExplainer
            analysis={analysis}
            highlightedFactor={highlightedFactor}
            onFactorHover={setHighlightedFactor}
          />

          {investor.suggestedAction && (
            <SuggestedActionCard action={investor.suggestedAction} />
          )}

          <InvestorProfileEmailDraft investor={investor} />

          <ProfileTabBar
            variant="top"
            activeTab={activeTab}
            signalCount={investor.signals.length}
            coInvestmentCount={investor.coInvestments.length}
            onTabChange={setActiveTab}
          />

          {activeTab === "journey" && (
            <RelationshipTimeline
              events={timelineEvents}
              activeEventId={activeTimelineId}
              onEventSelect={handleTimelineSelect}
            />
          )}

          {activeTab === "signals" && (
            <SignalsPanel signals={investor.signals} activeTimelineId={activeTimelineId} />
          )}

          {activeTab === "co-investments" && (
            <CoInvestmentsPanel
              coInvestments={sortedCoInvestments}
              activeTimelineId={activeTimelineId}
            />
          )}

          <p className="flex items-center gap-2 text-[11px] text-muted pt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse-dot" aria-hidden />
            Data refreshed {formatDataFreshness(DATA_REFRESHED_AT)}
          </p>
        </div>
      </div>

      <ProfileTabBar
        variant="bottom"
        activeTab={activeTab}
        signalCount={investor.signals.length}
        coInvestmentCount={investor.coInvestments.length}
        onTabChange={setActiveTab}
      />
    </ProfileModal>
  );
}
