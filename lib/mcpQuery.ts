import type { Investor, WarmthTier } from "@/app/data/mockData";
import { getRelationshipAlerts } from "./alerts";

export type MCPToolName =
  | "list_stale_relationships"
  | "search_relationships"
  | "get_investor";

export interface MCPQueryResultItem {
  investor: Investor;
  detail: string;
}

export interface MCPQueryResult {
  tool: MCPToolName;
  query: string;
  headline: string;
  items: MCPQueryResultItem[];
  isEmpty: boolean;
  isError: boolean;
  errorMessage?: string;
}

const WARMTH_RANK: Record<WarmthTier, number> = {
  Hot: 0,
  Warm: 1,
  Stale: 2,
  Cold: 3,
};

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function extractName(query: string): string | null {
  const patterns = [
    /show me (.+)/i,
    /tell me about (.+)/i,
    /what should i know about (.+)/i,
    /look up (.+)/i,
    /^(.+?) profile$/i,
  ];
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function extractPortfolioCompany(query: string, investors: Investor[]): string | null {
  const match = query.match(/co-invested in (.+?)\??$/i);
  if (match?.[1]) return match[1].trim();

  for (const investor of investors) {
    for (const ci of investor.coInvestments) {
      const name = ci.portfolioCompany.name;
      if (normalize(query).includes(normalize(name))) return name;
    }
  }
  return null;
}

function itemDetail(investor: Investor, extra?: string): string {
  const company =
    investor.coInvestments.find((c) => c.fundParticipated)?.portfolioCompany.name ??
    investor.coInvestments[0]?.portfolioCompany.name;
  const parts: string[] = [investor.warmthTier];
  if (company) parts.push(company);
  if (investor.lastSignalDate) parts.push(`last signal ${investor.lastSignalDate}`);
  if (extra) parts.push(extra);
  return parts.join(" · ");
}

function listStale(investors: Investor[], query: string): MCPQueryResult {
  const stale = investors.filter((i) => i.warmthTier === "Stale");
  return {
    tool: "list_stale_relationships",
    query,
    headline: `${stale.length} stale relationship${stale.length === 1 ? "" : "s"}`,
    items: stale.map((investor) => ({
      investor,
      detail: itemDetail(investor, investor.suggestedAction),
    })),
    isEmpty: stale.length === 0,
    isError: false,
  };
}

function searchWarmest(investors: Investor[], query: string): MCPQueryResult {
  const hot = investors
    .filter((i) => i.warmthTier === "Hot")
    .sort((a, b) => b.signals.length - a.signals.length);

  return {
    tool: "search_relationships",
    query,
    headline: `${hot.length} hot co-investor${hot.length === 1 ? "" : "s"}`,
    items: hot.map((investor) => ({
      investor,
      detail: itemDetail(investor, `${investor.signals.length} active signal(s)`),
    })),
    isEmpty: hot.length === 0,
    isError: false,
  };
}

function getInvestor(investors: Investor[], query: string, name: string): MCPQueryResult {
  const term = normalize(name);
  const matches = investors.filter(
    (i) =>
      normalize(i.fund.name).includes(term) ||
      normalize(i.name).includes(term) ||
      term.includes(normalize(i.fund.name))
  );

  if (matches.length === 0) {
    return {
      tool: "get_investor",
      query,
      headline: "No match",
      items: [],
      isEmpty: true,
      isError: false,
    };
  }

  return {
    tool: "get_investor",
    query,
    headline: matches.length === 1 ? "1 investor found" : `${matches.length} investors found`,
    items: matches.map((investor) => ({
      investor,
      detail: itemDetail(investor, investor.suggestedAction),
    })),
    isEmpty: false,
    isError: false,
  };
}

function searchByCompany(investors: Investor[], query: string, company: string): MCPQueryResult {
  const term = normalize(company);
  const matches = investors.filter((i) =>
    i.coInvestments.some((ci) => normalize(ci.portfolioCompany.name).includes(term))
  );

  return {
    tool: "search_relationships",
    query,
    headline: `${matches.length} co-investor${matches.length === 1 ? "" : "s"} for ${company}`,
    items: matches.map((investor) => {
      const rounds = investor.coInvestments
        .filter((ci) => normalize(ci.portfolioCompany.name).includes(term))
        .map((ci) => ci.round)
        .join(", ");
      return {
        investor,
        detail: itemDetail(investor, rounds ? `rounds: ${rounds}` : undefined),
      };
    }),
    isEmpty: matches.length === 0,
    isError: false,
  };
}

function generalSearch(investors: Investor[], query: string): MCPQueryResult {
  const term = normalize(query);
  const matches = investors.filter((i) => {
    if (normalize(i.fund.name).includes(term) || normalize(i.name).includes(term)) return true;
    if (term.includes("hot") && i.warmthTier === "Hot") return true;
    if (term.includes("warm") && i.warmthTier === "Warm") return true;
    if (term.includes("stale") && i.warmthTier === "Stale") return true;
    if (term.includes("cold") && i.warmthTier === "Cold") return true;
    return i.coInvestments.some((ci) => normalize(ci.portfolioCompany.name).includes(term));
  });

  const sorted = [...matches].sort(
    (a, b) => WARMTH_RANK[a.warmthTier] - WARMTH_RANK[b.warmthTier]
  );

  return {
    tool: "search_relationships",
    query,
    headline: `${sorted.length} result${sorted.length === 1 ? "" : "s"}`,
    items: sorted.map((investor) => ({
      investor,
      detail: itemDetail(investor),
    })),
    isEmpty: sorted.length === 0,
    isError: false,
  };
}

export const SUGGESTED_QUERIES = [
  "Show stale relationships",
  "Who are our warmest co-investors?",
  "Show me Trimble Ventures",
  "Which investors co-invested in Civ Robotics?",
] as const;

/** Client-side MCP router — mirrors tool names until live MCP is wired. */
export function runMCPQuery(query: string, investors: Investor[]): MCPQueryResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      tool: "search_relationships",
      query: trimmed,
      headline: "Enter a question",
      items: [],
      isEmpty: true,
      isError: true,
      errorMessage: "Type a question about your co-investor network.",
    };
  }

  const q = normalize(trimmed);

  if (/\bstale\b/.test(q) && /(show|list|which|who)/.test(q)) {
    return listStale(investors, trimmed);
  }

  if (/(warmest|hottest|hot co-investor|hot relationships)/.test(q)) {
    return searchWarmest(investors, trimmed);
  }

  const company = extractPortfolioCompany(trimmed, investors);
  if (company && /co-invest/.test(q)) {
    return searchByCompany(investors, trimmed, company);
  }

  const name = extractName(trimmed);
  if (name) {
    return getInvestor(investors, trimmed, name);
  }

  if (company) {
    return searchByCompany(investors, trimmed, company);
  }

  // Also route "Trimble Ventures" style direct lookups
  const direct = investors.find(
    (i) => q.includes(normalize(i.fund.name)) || q.includes(normalize(i.name))
  );
  if (direct && trimmed.split(/\s+/).length <= 5) {
    return getInvestor(investors, trimmed, direct.fund.name);
  }

  if (/\bstale\b/.test(q)) {
    const alerts = getRelationshipAlerts(investors);
    const staleIds = new Set(
      alerts.filter((a) => a.type === "stale_relationship").map((a) => a.investorId)
    );
    if (staleIds.size > 0) {
      return listStale(investors.filter((i) => staleIds.has(i.id)), trimmed);
    }
    return listStale(investors, trimmed);
  }

  return generalSearch(investors, trimmed);
}

export function formatToolLabel(tool: MCPToolName): string {
  return `via ${tool}`;
}
