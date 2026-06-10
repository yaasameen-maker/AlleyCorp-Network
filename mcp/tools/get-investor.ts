import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getInvestorByName } from "../../lib/db.js";

export const tool: Tool = {
  name: "get_investor",
  description:
    "Look up a specific investor or fund by name. Returns their warmth tier, active signals, co-investment history with AlleyCorp portfolio companies, and suggested next action. Use this when asked about a specific fund or investor (e.g. 'What should I know about General Catalyst?' or 'Show me the full picture on Lux Capital').",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description:
          "The fund or investor name to look up (e.g. 'Lux Capital', 'General Catalyst')",
      },
    },
    required: ["name"],
  },
};

export async function handler(args: { name: string }): Promise<CallToolResult> {
  const relationship = await getInvestorByName(args.name);

  if (!relationship) {
    return {
      content: [{ type: "text", text: `No investor or fund found matching "${args.name}".` }],
    };
  }

  const fund = relationship.fund;
  const company = relationship.portfolioCompany;
  const contact = relationship.investor;
  const signals = relationship.signals ?? [];

  const formatDate = (d: unknown): string => {
    if (!d) return "unknown date";
    const date = d instanceof Date ? d : new Date(String(d));
    return isNaN(date.getTime())
      ? String(d)
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const signalSummary = signals.length
    ? signals.map((s) => `• ${s.type} — ${s.source} (${formatDate(s.date)})`).join("\n")
    : "No signals on record.";

  const suggestedAction = {
    Hot: "Prioritize for next round invite or co-investment outreach.",
    Warm: "Schedule a touchpoint in the next 60–90 days to keep the relationship active.",
    Stale: "Reconnect before the next financing event. Reference shared portfolio history.",
    Cold: "No prior relationship. Identify a warm intro path or shared portfolio company.",
  }[relationship.warmthTier];

  const contactLine = contact
    ? `Key contact: ${contact.name} · ${contact.role}${contact.linkedinUrl ? ` · ${contact.linkedinUrl}` : ""}`
    : "";

  const text = [
    `**${fund?.name ?? args.name}**`,
    `Warmth tier: ${relationship.warmthTier}`,
    company ? `Co-investment: ${company.name} (${company.stage})` : "",
    `Last signal: ${formatDate(relationship.lastSignalDate)}`,
    contactLine,
    `Relationship ID: ${relationship.id}`,
    ``,
    `Signals:`,
    signalSummary,
    ``,
    `Suggested action: ${suggestedAction}`,
    relationship.overrideNote ? `Note: ${relationship.overrideNote}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { content: [{ type: "text", text }] };
}
