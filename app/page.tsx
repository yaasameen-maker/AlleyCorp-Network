"use client";

import { useMemo, useRef, useState } from "react";
import { AppSidebar, type AppView } from "@/app/components/AppSidebar";
import { PageScrim } from "@/app/components/PageScrim";
import { InvestorListSection } from "@/app/components/InvestorListSection";
import { ScrollContainerContext } from "@/app/context/ScrollContainerContext";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import { InvestorProfileTransparency } from "@/stories/InvestorProfileTransparency";
import { StaleAlertsBanner } from "@/stories/StaleAlertsBanner";
import { MCPQueryInterface } from "@/stories/MCPQueryInterface";
import { EmailDigestView } from "@/stories/EmailDigestView";
import { PortfolioExplorer } from "@/stories/PortfolioExplorer";
import { getInvestors } from "@/app/data/investors";
import { type Investor, type WarmthTier } from "@/app/data/mockData";
import type { ProfileTab } from "@/stories/InvestorProfileTransparency";

export default function DashboardPage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const scrollRef = useRef<HTMLElement>(null);

  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab>("journey");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<WarmthTier | "All">("All");
  const [digestOpen, setDigestOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  const allInvestors = useMemo(() => getInvestors(), []);

  const filteredInvestors = useMemo(() => {
    return allInvestors.filter((investor) => {
      const matchesSearch =
        searchQuery === "" ||
        investor.fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        investor.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = filterTier === "All" || investor.warmthTier === filterTier;

      return matchesSearch && matchesTier;
    });
  }, [allInvestors, searchQuery, filterTier]);

  const tierCounts = useMemo(() => {
    return {
      All: allInvestors.length,
      Hot: allInvestors.filter((i) => i.warmthTier === "Hot").length,
      Warm: allInvestors.filter((i) => i.warmthTier === "Warm").length,
      Cold: allInvestors.filter((i) => i.warmthTier === "Cold").length,
      Stale: allInvestors.filter((i) => i.warmthTier === "Stale").length,
    };
  }, [allInvestors]);

  const openProfile = (investor: Investor, tab: ProfileTab = "journey") => {
    setProfileInitialTab(tab);
    setSelectedInvestor(investor);
  };

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    if (view !== "dashboard") {
      setDigestOpen(false);
      setPortfolioOpen(false);
    }
  };

  const openDigest = () => {
    if (isDesktop) {
      setActiveView("digest");
    } else {
      setDigestOpen(true);
    }
  };

  const openPortfolio = () => {
    if (isDesktop) {
      setActiveView("portfolio");
    } else {
      setPortfolioOpen(true);
    }
  };

  return (
    <ScrollContainerContext.Provider value={scrollRef}>
      <div className="app-shell bg-paper text-ink min-h-[100dvh] flex lg:flex-row">
        <AppSidebar activeView={activeView} onNavigate={handleNavigate} />

        <div className="flex-1 flex flex-col min-w-0 min-h-0 max-md:h-full md:min-h-[100dvh]">
          <header className="shrink-0 border-b border-line bg-paper/95 backdrop-blur z-10 safe-top safe-x lg:hidden max-md:sticky max-md:top-0 md:relative">
            <div className="px-4 py-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                  AlleyCorp
                </p>
                <h1 className="text-[17px] leading-tight font-semibold tracking-tight text-ink truncate">
                  Investor Intelligence
                </h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openPortfolio}
                  aria-label="Portfolio"
                  className="touch-target touch-press flex items-center justify-center w-11 h-11 rounded-2xl border border-line bg-mist text-ink md:w-auto md:h-auto md:px-3 md:py-2 md:gap-1.5 md:rounded-xl md:text-xs md:font-medium"
                >
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="hidden md:inline">Portfolio</span>
                </button>
                <button
                  type="button"
                  onClick={openDigest}
                  aria-label="Email digest"
                  className="touch-target touch-press flex items-center justify-center w-11 h-11 rounded-2xl border border-line bg-mist text-ink md:w-auto md:h-auto md:px-3 md:py-2 md:gap-1.5 md:rounded-xl md:text-xs md:font-medium"
                >
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden md:inline">Digest</span>
                </button>
              </div>
            </div>
          </header>

          <main
            ref={scrollRef}
            className="mobile-scroll flex-1 min-h-0 safe-x safe-bottom max-md:pb-[max(1rem,env(safe-area-inset-bottom))] lg:overflow-hidden lg:flex lg:flex-col"
          >
            <div className="flex-1 lg:flex lg:min-h-0 lg:overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden">
                {activeView === "dashboard" && (
                  <>
                    <div className="shrink-0 lg:px-6 lg:pt-6">
                      <StaleAlertsBanner
                        investors={allInvestors}
                        onSelectInvestor={(i) => openProfile(i)}
                      />
                    </div>

                    <div className="lg:grid lg:grid-cols-[minmax(0,22rem)_1fr] xl:grid-cols-[minmax(0,26rem)_1fr] lg:divide-x lg:divide-line lg:flex-1 lg:min-h-0 lg:overflow-hidden max-lg:contents">
                      <div className="lg:overflow-y-auto lg:py-6">
                        <MCPQueryInterface
                          investors={allInvestors}
                          onSelectInvestor={(i) => openProfile(i)}
                        />
                      </div>

                      <div className="lg:overflow-y-auto lg:pb-0 max-md:pb-4 md:pb-6">
                        <InvestorListSection
                          filteredInvestors={filteredInvestors}
                          totalCount={allInvestors.length}
                          searchQuery={searchQuery}
                          onSearchChange={setSearchQuery}
                          filterTier={filterTier}
                          onFilterTierChange={setFilterTier}
                          tierCounts={tierCounts}
                          selectedInvestorId={selectedInvestor?.id}
                          onSelectInvestor={(i) => openProfile(i)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {isDesktop && activeView === "digest" && (
                  <EmailDigestView
                    variant="inline"
                    investors={allInvestors}
                    onSelectInvestor={(i) => openProfile(i)}
                  />
                )}

                {isDesktop && activeView === "portfolio" && (
                  <PortfolioExplorer
                    variant="inline"
                    investors={allInvestors}
                    onSelectInvestor={(i) => openProfile(i)}
                  />
                )}
              </div>

              {isDesktop && selectedInvestor && (
                <aside className="hidden lg:flex lg:w-[min(28rem,32vw)] xl:w-[32rem] shrink-0 flex-col border-l border-line bg-mist min-h-0 relative z-[160]">
                  <InvestorProfileTransparency
                    investor={selectedInvestor}
                    initialTab={profileInitialTab}
                    layout="panel"
                    onClose={() => setSelectedInvestor(null)}
                  />
                </aside>
              )}
            </div>
          </main>
        </div>

        {!isDesktop && selectedInvestor && (
          <InvestorProfileTransparency
            investor={selectedInvestor}
            initialTab={profileInitialTab}
            onClose={() => setSelectedInvestor(null)}
          />
        )}

        {isDesktop && selectedInvestor && (
          <PageScrim onClose={() => setSelectedInvestor(null)} />
        )}

        {!isDesktop && (
          <>
            <EmailDigestView
              variant="sheet"
              investors={allInvestors}
              isOpen={digestOpen}
              onClose={() => setDigestOpen(false)}
              onSelectInvestor={(i) => openProfile(i)}
            />

            <PortfolioExplorer
              variant="sheet"
              investors={allInvestors}
              isOpen={portfolioOpen}
              onClose={() => setPortfolioOpen(false)}
              onSelectInvestor={(i) => openProfile(i)}
            />
          </>
        )}
      </div>
    </ScrollContainerContext.Provider>
  );
}
