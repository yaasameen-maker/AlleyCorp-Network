"use client";

import type { Investor } from "@/app/data/mockData";
import { WarmthBadge } from "@/app/components/WarmthBadge";
import { EmailDraftEditor, useEmailDraftState } from "./components/EmailDraftEditor";

export interface InvestorProfileEmailDraftProps {
  investor: Investor;
}

const TIER_HINT: Record<Investor["warmthTier"], string> = {
  Stale: "Reconnect — it's been a while",
  Warm: "Relationship maintenance",
  Hot: "Deal flow or event invite",
  Cold: "Introduction outreach",
};

export function InvestorProfileEmailDraft({ investor }: InvestorProfileEmailDraftProps) {
  const { subject, body, draft, setSubject, setBody } = useEmailDraftState(investor);

  return (
    <section className="border border-line rounded-2xl overflow-hidden bg-mist">
      <div className="px-4 py-3 border-b border-line bg-navy flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Suggested outreach</h3>
          <p className="text-xs text-muted mt-0.5">{TIER_HINT[investor.warmthTier]}</p>
        </div>
        <WarmthBadge tier={investor.warmthTier} size="sm" />
      </div>

      <div className="p-4">
        <EmailDraftEditor
          draft={draft}
          investor={investor}
          subject={subject}
          body={body}
          onSubjectChange={setSubject}
          onBodyChange={setBody}
        />
      </div>
    </section>
  );
}
