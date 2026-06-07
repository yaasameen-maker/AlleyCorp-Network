"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppSidebar, type AppView } from "@/app/components/AppSidebar";
import { MobileNavTools } from "@/app/components/MobileNavTools";
import { PageScrim } from "@/app/components/PageScrim";
import { ScrollContainerContext } from "@/app/context/ScrollContainerContext";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import { InvestorProfileTransparency } from "@/stories/InvestorProfileTransparency";
import { StaleAlertsBanner } from "@/stories/StaleAlertsBanner";
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

  const [allInvestors, setAllInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvestors()
      .then(setAllInvestors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
    setSelectedInvestor(null);
    setActiveView(view);
    if (view !== "dashboard") {
      setDigestOpen(false);
      setPortfolioOpen(false);
    }
  };

  const openDigest = () => {
    if (isDesktop) {
      handleNavigate("digest");
    } else {
      setSelectedInvestor(null);
      setDigestOpen(true);
    }
  };

  const openPortfolio = () => {
    if (isDesktop) {
      handleNavigate("portfolio");
    } else {
      setSelectedInvestor(null);
      setPortfolioOpen(true);
    }
  };

  const navToolsProps = {
    investors: allInvestors,
    onSelectInvestor: (i: Investor) => openProfile(i),
    searchQuery,
    onSearchChange: setSearchQuery,
    filterTier,
    onFilterTierChange: setFilterTier,
    tierCounts,
    filteredInvestors,
    totalCount: allInvestors.length,
    selectedInvestorId: selectedInvestor?.id,
  };

  return (
    <ScrollContainerContext.Provider value={scrollRef}>
      <div className="app-shell bg-paper text-ink min-h-[100dvh] flex lg:flex-row">
        <AppSidebar activeView={activeView} onNavigate={handleNavigate} {...navToolsProps} />

        <div className="flex-1 flex flex-col min-w-0 min-h-0 max-md:h-full md:min-h-[100dvh]">
          <MobileNavTools
            {...navToolsProps}
            onOpenPortfolio={openPortfolio}
            onOpenDigest={openDigest}
          />

          <main
            ref={scrollRef}
            className="mobile-scroll flex-1 min-h-0 safe-x safe-bottom max-md:pb-[max(1rem,env(safe-area-inset-bottom))] lg:overflow-hidden lg:flex lg:flex-col"
          >
            <div className="flex-1 lg:relative lg:min-h-0 lg:overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 w-full h-full lg:overflow-hidden">
                {activeView === "dashboard" && (
                  <div className="flex-1 flex flex-col max-md:min-h-0 lg:min-h-full lg:overflow-y-auto">
                    {loading ? (
                      <div className="flex-1 flex items-center justify-center px-4 py-12">
                        <p className="text-sm text-muted">Loading investors…</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex max-md:items-center max-md:justify-center max-md:py-8 max-md:pb-12 lg:min-h-full items-start lg:items-center justify-center px-4 py-6 md:px-6 md:py-8 lg:px-10 lg:py-10">
                        <div className="w-full max-w-4xl mx-auto max-md:shrink-0">
                          <StaleAlertsBanner
                            variant="hero"
                            investors={allInvestors}
                            onSelectInvestor={(i) => openProfile(i)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
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
                <aside className="hidden lg:flex lg:absolute lg:top-0 lg:right-0 lg:bottom-0 lg:w-[min(28rem,32vw)] xl:w-[32rem] flex-col border-l border-line bg-mist z-[160] shadow-2xl">
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

        {isDesktop && selectedInvestor && activeView === "dashboard" && <PageScrim />}

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
