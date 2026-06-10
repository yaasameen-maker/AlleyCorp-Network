"use client";

import { useMemo, useState } from "react";
import type { Investor } from "@/lib/investors";
import { buildWeeklyDigest, formatDigestAsEmail } from "@/lib/digest-client";
import type { DigestItem } from "@/lib/digest-client";

interface DigestViewProps {
  investors: Investor[];
}

function composeTemplate(item: DigestItem, investors: Investor[]): string {
  const investor = investors.find((i) => i.id === item.investorId);
  const fund = investor?.fund.name ?? "the fund";
  const company = investor?.coInvestments[0]?.portfolioCompany.name;

  if (item.id.startsWith("stale")) {
    return `Hi [Name],

Hope you're well. It's been a while since we last connected. Wanted to reach out and see what you're focused on this year.${company ? `\n\nWe co-invested together in ${company} and I've been following your continued work in deep tech closely.` : ""}

Would love to find 30 minutes to reconnect and share what we're seeing across our portfolio.

Best,
[Your name]
AlleyCorp`;
  }

  return `Hi [Name],

Great connecting recently. Wanted to stay in touch and make sure we're keeping the momentum going.${company ? `\n\nOur shared investment in ${company} continues to be a strong data point for the relationship.` : ""}

Happy to sync soon. Would be great to compare notes on what you're tracking in deep tech.

Best,
[Your name]
AlleyCorp`;

  void fund; // used in template string above
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      aria-hidden
    >
      <path
        d="M4.5 2.5L7.5 6L4.5 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DigestItemRow({ item, investors }: { item: DigestItem; investors: Investor[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const template = useMemo(() => composeTemplate(item, investors), [item, investors]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard optional */
    }
  };

  return (
    <div className="border-b border-[#F3F4F6] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="card-lift w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#F8F7F4] rounded-lg transition-colors duration-150 group"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0D1320] group-hover:text-[#0EA5D6] transition-colors duration-150 truncate">
            {item.headline.split(" — ")[0]}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">
            {item.timestamp}
            {item.signalSource && item.signalSource !== "No signals logged"
              ? ` · ${item.signalSource}`
              : ""}
          </p>
        </div>
        <span className="text-[#9CA3AF] shrink-0">
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="bg-[#F8F7F4] rounded-lg p-4 border border-[#EAECEF]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] uppercase tracking-widest text-[#9CA3AF] font-semibold">
                Draft outreach
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] font-medium text-[#0EA5D6] hover:text-[#0a8fb8] transition-colors"
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </div>
            <pre className="text-xs text-[#374151] leading-relaxed whitespace-pre-wrap font-sans">
              {template}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function DigestView({ investors }: DigestViewProps) {
  const [copied, setCopied] = useState(false);
  const digest = useMemo(() => buildWeeklyDigest(investors), [investors]);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatDigestAsEmail(digest));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard optional */
    }
  };

  const generatedDate = new Date(digest.generatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // brand-line + card-lift applied — Luba, Jun 2026 (design system pass)
  return (
    <div className="max-w-2xl px-8 py-10 space-y-8">
      {/* Hero card — matches BriefingDashboard style */}
      <div className="relative overflow-hidden rounded hero-aurora px-7 py-6 shadow-md">
        <div className="hero-shimmer absolute -inset-12" aria-hidden />
        <div className="relative z-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#0EA5D6] font-semibold mb-1.5">
                AlleyCorp · Weekly Digest
              </p>
              <h1 className="text-xl font-bold text-white leading-tight tracking-tight">
                {digest.subject}
              </h1>
              <p className="text-[10px] text-white/35 mt-1">Generated {generatedDate}</p>
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <div className="text-center">
                <p className="text-xl font-bold text-white tabular-nums">{investors.length}</p>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mt-0.5">Total</p>
              </div>
              <div className="w-px h-6 bg-white/10" aria-hidden />
              <div className="text-center">
                <p className="text-xl font-bold text-white tabular-nums">
                  {digest.sections.reduce((n, s) => n + s.items.length, 0)}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mt-0.5">Actions</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white tabular-nums">
                  {digest.sections.length}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-white/40 mt-0.5">
                  Sections
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {digest.sections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-semibold text-[#0D1320] mb-1">All relationships on track</p>
          <p className="text-xs text-[#9CA3AF]">No reconnects needed this week.</p>
        </div>
      ) : (
        digest.sections.map((section) => (
          <section key={section.id}>
            <div className="mb-4">
              <h2 className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-2">
                {section.title}
                <span className="ml-1.5 text-[#C4C9D4]">({section.items.length})</span>
              </h2>
              <hr className="brand-line" />
            </div>
            <div className="bg-white rounded overflow-hidden border border-[#E5E7EB]">
              {section.items.map((item) => (
                <DigestItemRow key={item.id} item={item} investors={investors} />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Copy all */}
      {digest.sections.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCopyAll}
            className="text-xs font-medium text-[#9CA3AF] hover:text-[#0EA5D6] transition-colors duration-150"
          >
            {copied ? "Copied full digest!" : "Copy full digest to clipboard"}
          </button>
        </div>
      )}
    </div>
  );
}
