import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { searchRelationships } from "../../lib/db.js";

export const tool: Tool = {
  name: "search_relationships",
  description:
    "Search the AlleyCorp deep tech investor universe by warmth tier, sector, fund name, portfolio company, or market-prospect status. Returns matching relationships with warmth tier and signal evidence. Use this for broad network questions (e.g. 'Who are our warmest relationships in deep tech right now?', 'Which funds have we co-invested with in robotics?', 'Are there top deep tech funds we haven't co-invested with yet?').",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Natural language search query — can include warmth tier (Hot, Warm, Stale, Cold), sector (robotics, biotech, space), fund name, portfolio company name, or prospect/no co-investment intent",
      },
    },
    required: ["query"],
  },
};

export async function handler(args: { query: string }): Promise<CallToolResult> {
  const relationships = await searchRelationships(args.query);

  if (relationships.length === 0) {
    return {
      content: [{ type: "text", text: `No relationships found matching "${args.query}".` }],
    };
  }

  const entries = relationships.map((r) => {
    const fund = r.fund?.name ?? "Unknown fund";
    const company = r.portfolioCompany?.name ?? "No co-investment on record";
    const signals = r.signals?.length ?? 0;
    const targetNote = r.portfolioCompany ? "" : " — target/prospect";
    return `• **${fund}** — ${r.warmthTier} — ${company}${targetNote} — ${signals} signal(s) on record`;
  });

  const text = [
    `**Results for "${args.query}" (${relationships.length} found)**`,
    "",
    ...entries,
  ].join("\n");

  return { content: [{ type: "text", text }] };
}
