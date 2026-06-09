"use client";

import { useEffect, useState } from "react";
import type { Investor } from "@/app/data/mockData";
import { buildEmailDraft, formatEmailForCopy, type EmailDraftContent } from "@/lib/emailDraft";

interface EmailDraftEditorProps {
  draft: EmailDraftContent;
  investor: Investor;
  subject: string;
  body: string;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
}

export function EmailDraftEditor({
  draft,
  investor,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: EmailDraftEditorProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        formatEmailForCopy(subject, body, (investor as { contactEmail?: string }).contactEmail)
      );
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div className="space-y-3">
      {(!draft.hasContactName || !draft.hasContactEmail) && (
        <p className="text-xs text-muted bg-paper border border-line rounded-xl px-3 py-2 leading-relaxed">
          {!draft.hasContactName && !draft.hasContactEmail
            ? "No contact name or email on file — draft uses a generic greeting. Add contact details when available."
            : !draft.hasContactEmail
              ? "No email address on file — copy the draft and paste into your mail client."
              : "No first name on file — using a generic greeting."}
        </p>
      )}

      <label className="block">
        <span className="text-xs text-muted mb-1 block">Subject</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-paper border border-line rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
        />
      </label>

      <div className="block">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs text-muted">Body</span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            className="touch-press inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
          >
            {copied ? (
              <>
                <svg
                  className="w-3.5 h-3.5 text-signal-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-signal-green">Copied</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>{copyError ? "Copy failed" : "Copy"}</span>
              </>
            )}
          </button>
        </div>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={10}
          className="w-full px-3 py-2.5 bg-paper border border-line rounded-xl text-sm text-ink leading-relaxed resize-y min-h-[12rem] focus:outline-none focus:ring-2 focus:ring-ink/20"
        />
      </div>
    </div>
  );
}

interface UseEmailDraftStateResult {
  subject: string;
  body: string;
  draft: EmailDraftContent;
  setSubject: (value: string) => void;
  setBody: (value: string) => void;
}

export function useEmailDraftState(investor: Investor): UseEmailDraftStateResult {
  const draft = buildEmailDraft(investor);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);

  useEffect(() => {
    const next = buildEmailDraft(investor);
    setSubject(next.subject);
    setBody(next.body);
  }, [investor.id, investor.warmthTier]);

  return { subject, body, draft, setSubject, setBody };
}
