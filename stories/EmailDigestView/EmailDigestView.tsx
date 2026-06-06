"use client";

import { useMemo, useState } from "react";
import type { Investor } from "@/app/data/mockData";
import { buildWeeklyDigest, formatDigestAsEmail } from "@/lib/digest";
import { DigestSheet } from "./components/DigestSheet";
import { DigestEmailHeader } from "./components/DigestEmailHeader";
import { DigestSection } from "./components/DigestSection";
import { SendDigestButton } from "./components/SendDigestButton";

export interface EmailDigestViewProps {
  investors: Investor[];
  isOpen?: boolean;
  onClose?: () => void;
  onSelectInvestor: (investor: Investor) => void;
  variant?: "sheet" | "inline";
}

export function EmailDigestView({
  investors,
  isOpen = true,
  onClose,
  onSelectInvestor,
  variant = "sheet",
}: EmailDigestViewProps) {
  const [sendNotice, setSendNotice] = useState(false);

  const digest = useMemo(() => buildWeeklyDigest(investors), [investors]);

  if (variant === "sheet" && !isOpen) return null;

  const handleSelectItem = (investorId: string) => {
    const investor = investors.find((i) => i.id === investorId);
    if (investor) {
      onClose?.();
      onSelectInvestor(investor);
    }
  };

  const handleSend = async () => {
    try {
      await navigator.clipboard.writeText(formatDigestAsEmail(digest));
    } catch {
      /* clipboard optional */
    }
    setSendNotice(true);
    window.setTimeout(() => setSendNotice(false), 2500);
  };

  const content = (
    <>
      {variant === "sheet" && (
        <div className="shrink-0 flex items-center justify-between px-4 pb-2 border-b border-line bg-mist/95">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close digest"
            className="touch-target touch-press flex items-center justify-center rounded-full text-ink -ml-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs text-muted">Email Digest</span>
          <div className="w-10" aria-hidden />
        </div>
      )}

      {variant === "inline" && (
        <div className="shrink-0 px-6 py-5 border-b border-line bg-paper/50">
          <h2 className="text-xl font-semibold text-ink">Weekly Email Digest</h2>
          <p className="text-sm text-muted mt-1">Read-only preview · copy to send via email client</p>
        </div>
      )}

      <DigestEmailHeader digest={digest} />

      <div
        className={`flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 ${
          variant === "inline" ? "lg:px-8 lg:py-6 max-w-4xl" : ""
        }`}
      >
        {digest.sections.length === 0 ? (
          <p className="text-sm text-muted text-center py-12 border border-line rounded-2xl bg-paper">
            No digest items this week — all relationships are on track.
          </p>
        ) : (
          digest.sections.map((section) => (
            <DigestSection
              key={section.id}
              section={section}
              onSelectItem={handleSelectItem}
            />
          ))
        )}

        {sendNotice && (
          <p className="text-xs text-signal-green text-center animate-fade-in-up">
            Digest copied — ready to send via email client
          </p>
        )}
      </div>

      <SendDigestButton onSend={handleSend} />
    </>
  );

  if (variant === "inline") {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{content}</div>
    );
  }

  return <DigestSheet onClose={onClose!}>{content}</DigestSheet>;
}
