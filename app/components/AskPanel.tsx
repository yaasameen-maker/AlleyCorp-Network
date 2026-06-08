"use client";

import { useEffect, useRef, useState } from "react";
import { WarmthBadge } from "./InvestorRow";
import type { Investor } from "@/app/data/mockData";
import type { AskCard, AskResponse } from "@/app/api/ask/route";

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

interface HistoryItem {
  query: string;
  answer: string;
  cards: AskCard[];
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

export function AskPanel({ investors, onSelectInvestor, onClose }: AskPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingQuery, setPendingQuery] = useState(""); // question in-flight, shown as bubble while loading
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom after each new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  async function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setPendingQuery(trimmed);
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data: AskResponse = await res.json();
      setHistory((prev) => [...prev, {
        query: trimmed,
        answer: data.answer || "Something went wrong on our end — please try again.",
        cards: data.cards ?? [],
      }]);
    } catch {
      setHistory((prev) => [...prev, {
        query: trimmed,
        answer: "Couldn't connect — check your internet connection and try again.",
        cards: [],
      }]);
    } finally {
      setLoading(false);
      setPendingQuery("");
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

  function handleReset() {
    setHistory([]);
    setQuery("");
    setPendingQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const hasHistory = history.length > 0 || loading;

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
          <div className="flex items-center gap-2">
            {hasHistory && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] text-[#9CA3AF] hover:text-[#0EA5D6] transition-colors px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
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
        </div>

        {/* Scrollable conversation area */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* Quick prompts — only when no history */}
          {!hasHistory && (
            <div className="px-6 py-4">
              <p className="text-[9px] uppercase tracking-widest text-[#C4C9D4] font-semibold mb-3">
                Start here
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

          {/* Conversation history */}
          {history.map((item, i) => (
            <div key={i} className="px-6 py-4 space-y-3">

              {/* User bubble */}
              <div className="flex justify-end">
                <div className="bg-[#0D1320] text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-snug">
                  {item.query}
                </div>
              </div>

              {/* Claude's answer */}
              <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">
                {item.answer}
              </p>

              {/* Fund cards */}
              {item.cards.length > 0 && (
                <>
                  <p className="text-[9px] uppercase tracking-widest text-[#C4C9D4] font-semibold pt-1">
                    Funds referenced
                  </p>
                  <div className="space-y-2">
                    {item.cards.slice(0, 3).map((card) => {
                      const clickable = investors.some(
                        (inv) => inv.fund.name.toLowerCase() === card.fundName.toLowerCase()
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
                  {item.cards.length > 3 && (
                    <p className="text-xs text-[#9CA3AF] pl-1">
                      +{item.cards.length - 3} more in full list
                    </p>
                  )}
                </>
              )}

              {/* Divider between turns (not after last) */}
              {i < history.length - 1 && (
                <hr className="brand-line mt-2" />
              )}
            </div>
          ))}

          {/* In-flight bubble while loading */}
          {loading && pendingQuery && (
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-end">
                <div className="bg-[#0D1320] text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-snug">
                  {pendingQuery}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <SpinnerIcon />
                <p className="text-xs">Asking the network…</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input footer — always visible */}
        <div className="shrink-0 px-6 py-4 border-t border-[#F3F4F6]">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={hasHistory ? "Ask a follow-up…" : "Ask about any fund or relationship…"}
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
