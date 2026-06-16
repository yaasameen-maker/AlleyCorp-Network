import type { InvestorSignal } from "@/lib/investors";

export interface EvidenceGroup {
  id: string;
  title: string;
  kind: "company" | "source-type";
  signals: InvestorSignal[];
}

function typeGroupTitle(type: InvestorSignal["type"]): string {
  switch (type) {
    case "co-investment":
      return "Co-investments";
    case "event":
      return "Events & attendance";
    case "email":
      return "Email & contact";
    case "meeting":
      return "Meetings";
    default:
      return "Other signals";
  }
}

/** Group profile signals by portfolio company, then by source type for the rest. */
export function groupProfileEvidence(signals: InvestorSignal[]): EvidenceGroup[] {
  const byCompany = new Map<string, InvestorSignal[]>();
  const byType = new Map<InvestorSignal["type"], InvestorSignal[]>();

  for (const signal of signals) {
    if (signal.portfolioCompanyName) {
      const list = byCompany.get(signal.portfolioCompanyName) ?? [];
      list.push(signal);
      byCompany.set(signal.portfolioCompanyName, list);
    } else {
      const list = byType.get(signal.type) ?? [];
      list.push(signal);
      byType.set(signal.type, list);
    }
  }

  const groups: EvidenceGroup[] = [];

  for (const [title, items] of byCompany) {
    groups.push({
      id: `company-${title}`,
      title,
      kind: "company",
      signals: items,
    });
  }

  for (const [type, items] of byType) {
    groups.push({
      id: `type-${type}`,
      title: typeGroupTitle(type),
      kind: "source-type",
      signals: items,
    });
  }

  return groups;
}

export function formatProfileFreshness(dateStr?: string): string | null {
  if (!dateStr) return null;
  const parsed = Date.parse(dateStr);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return dateStr;
}

export function sourceLinkLabel(signal: InvestorSignal): string {
  if (signal.sourceTitle) return signal.sourceTitle;
  if (signal.source) return signal.source;
  if (signal.sourceUrl) {
    try {
      return new URL(signal.sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      return "Source";
    }
  }
  return "Internal record — no public URL";
}
