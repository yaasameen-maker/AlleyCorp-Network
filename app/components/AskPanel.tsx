"use client";

import { useRef, useState } from "react";
import { WarmthBadge } from "./InvestorRow";
import type { Investor } from "@/app/data/mockData";
import type { AskCard, AskResponse } from "@/app/api/ask/route";

// The 5 Demo Day prompts as quick chips
const QUICK_PROMPTS = [
  "Who should we reconnect with before they lead a round without us?",
  "Who are our warmest relationships right now?",
  "What should I know before our meeting with General Catalyst?",
  "Are there top deep tech funds we haven't co-invested with yet?",
  "Show me the full picture on Trimble Ventures.",
];

interface AskPanelProps {
  investors: Investor[];
  onSelectInvestor: (investor: Investor) => void;
  onClose: () => void;
}

function SendIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin text-[#0EA5D6]" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

const TOOL_LABEL: Record<string, string> = {
  list_stale_relationships: "list_stale_relationships()",
  search_relationships: "search_relationships()",
  get_investor: "get_investor()",
};

export function AskPanel({ investors, onSelectInvestor, onClose }: AskPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data: AskResponse = await res.json();
      setResult(data);
    } catch {
      setResult({ tool: null, query: trimmed, answer: "Network error — check your connection.", cards: [] });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(query);
    setQuery("");
  }

  function handleQuickPrompt(p: string) {
    setQuery("");
    submit(p);
  }

  function handleCardClick(card: AskCard) {
    const investor = investors.find(
      (i) => i.fund.name.toLowerCase() === card.fundName.toLowerCase()
    );
    if (investor) {
      onSelectInvestor(investor);
      onClose();
    }
  }

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-30 bg-black/20 animate-scrim-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-40 w-[420px] flex flex-col bg-white border-l border-[#E5E7EB] shadow-2xl animate-drawer-in">

        {/* Header */}
        <div className="shrink-0 px-6 py-5 border-b border-[#F3F4F6] flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#0EA5D6] font-semibold mb-0.5">
              AlleyCorp Intelligence
            </p>
            <h2 className="text-base font-bold text-[#0D1320] tracking-tight">Ask the network</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#0D1320] hover:bg-[#F3F4F6] transition-colors"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick prompts */}
        {!result && !loading && (
          <div className="shrink-0 px-6 py-4 border-b border-[#F3F4F6]">
            <p className="text-[9px] uppercase tracking-widest text-[#C4C9D4] font-semibold mb-3">
              Demo Day prompts
            </p>
            <div className="flex flex-col gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleQuickPrompt(p)}
                  className="text-left px-3 py-2.5 rounded-lg border border-[#EAECEF] text-xs text-[#374151] hover:border-[#0EA5D6] hover:text-[#0D1320] hover:bg-[#F0F9FF] transition-all duration-150"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results area */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9CA3AF]">
              <SpinnerIcon />
              <p className="text-xs">Asking the network…</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="px-6 py-5 space-y-4">

              {/* User's question */}
              <div className="flex justify-end">
                <div className="bg-[#0D1320] text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-snug">
                  {result.query}
                </div>
              </div>

              {/* Claude's answer */}
              <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{result.answer}</p>

              {/* Top 3 cards only */}
              {result.cards.length > 0 && (
                <div className="border-t border-[#F3F4F6] pt-3">
                  <p className="text-[9px] uppercase tracking-widest text-[#C4C9D4] font-semibold mb-3">
                    Funds referenced
                  </p>
                </div>
              )}

              {/* Top 3 result cards */}
              {result.cards.length > 0 && (
                <div className="space-y-2">
                  {result.cards.slice(0, 3).map((card) => {
                    const clickable = investors.some(
                      (i) => i.fund.name.toLowerCase() === card.fundName.toLowerCase()
                    );
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleCardClick(card)}
                        disabled={!clickable}
                        className={[
                          "card-lift w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150",
                          clickable
                            ? "border-[#E5E7EB] hover:border-[#0EA5D6] hover:bg-[#F0F9FF] group cursor-pointer"
                            : "border-[#F3F4F6] cursor-default opacity-70",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <p className="text-sm font-semibold text-[#0D1320] group-hover:text-[#0EA5D6] transition-colors leading-snug">
                            {card.fundName}
                          </p>
                          <WarmthBadge tier={card.warmthTier} />
                        </div>
                        {card.company && (
                          <p className="text-xs text-[#9CA3AF]">
                            {card.company}
                            {card.lastSignal ? ` · ${card.lastSignal}` : ""}
                            {card.signalCount > 0 ? ` · ${card.signalCount} signal${card.signalCount !== 1 ? "s" : ""}` : ""}
                          </p>
                        )}
                        {card.suggestedAction && (
                          <p className="text-[11px] text-[#6B7280] mt-1.5 leading-snug">
                            {card.suggestedAction}
                          </p>
                        )}
                        {clickable && (
                          <p className="text-[10px] text-[#0EA5D6] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            Open full briefing →
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Overflow count */}
              {result.cards.length > 3 && (
                <p className="text-xs text-[#9CA3AF] pl-1">
                  +{result.cards.length - 3} more in full list
                </p>
              )}

              {/* Ask another */}
              <button
                type="button"
                onClick={() => { setResult(null); setQuery(""); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="text-xs text-[#9CA3AF] hover:text-[#0EA5D6] transition-colors"
              >
                ← Ask another question
              </button>
            </div>
          )}
        </div>

        {/* Input footer */}
        <div className="shrink-0 px-6 py-4 border-t border-[#F3F4F6]">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about any fund or relationship…"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm bg-[#F7F8FA] border border-[#EAECEF] rounded-xl text-[#0D1320] placeholder:text-[#C4C9D4] focus:outline-none focus:border-[#0EA5D6] focus:bg-white transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#0EA5D6] text-white hover:bg-[#0891B2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Send"
            >
              {loading ? <SpinnerIcon /> : <SendIcon />}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
