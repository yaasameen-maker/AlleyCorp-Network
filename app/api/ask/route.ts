// POST /api/ask — natural language query routed to real MCP tools via Anthropic
// Claude picks the tool; we execute it against the Railway DB and return structured results.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getInvestorByName,
  listStaleRelationships,
  searchRelationships,
} from "../../../lib/db";
import type { Relationship } from "../../../lib/types";

const client = new Anthropic();

// Tool schemas — identical to mcp/tools/ definitions so Claude routes the same way
const TOOLS: Anthropic.Tool[] = [
  {
    name: "list_stale_relationships",
    description:
      "Returns all co-investors currently in the Stale warmth tier — funds that co-invested with AlleyCorp but whose signals have decayed. Use this when asked about relationships that need attention, reconnection, or risk being lost.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "search_relationships",
    description:
      "Search the co-investor network by warmth tier, fund name, or portfolio company. Use for broad network questions: 'Who are our warmest relationships?', 'Which funds co-invested in robotics?', 'Are there top deep tech funds we haven't co-invested with yet?'",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search term — warmth tier (Hot/Warm/Stale/Cold), fund name, or portfolio company",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_investor",
    description:
      "Look up a specific fund by name. Returns warmth tier, signal history, co-investment record, and suggested next action. Use when asked about a specific fund: 'What should I know about General Catalyst?' or 'Show me Trimble Ventures'.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Fund or investor name to look up" },
      },
      required: ["name"],
    },
  },
];

function toWarmthTier(s: string): "Hot" | "Warm" | "Stale" | "Cold" {
  const map: Record<string, "Hot" | "Warm" | "Stale" | "Cold"> = {
    hot: "Hot", warm: "Warm", stale: "Stale", cold: "Cold",
  };
  return map[s.toLowerCase()] ?? "Cold";
}

function formatDate(d: string | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function relToCard(r: Relationship) {
  return {
    id: r.id,
    fundName: r.fund?.name ?? "Unknown",
    warmthTier: toWarmthTier(r.warmthTier),
    company: r.portfolioCompany?.name ?? null,
    lastSignal: formatDate(r.lastSignalDate),
    signalCount: r.signals?.length ?? 0,
    suggestedAction: {
      Hot: "Active co-investor — prioritize for next round or event invite.",
      Warm: "Warming relationship — schedule a touchpoint in the next 30 days.",
      Stale: "Relationship has lapsed — reconnect before they lead a round without you.",
      Cold: "No prior co-investment — identify a warm intro path.",
    }[toWarmthTier(r.warmthTier)],
  };
}

export interface AskCard {
  id: string;
  fundName: string;
  warmthTier: "Hot" | "Warm" | "Stale" | "Cold";
  company: string | null;
  lastSignal: string;
  signalCount: number;
  suggestedAction: string;
}

export interface AskResponse {
  tool: string | null;
  query: string;
  answer: string;       // Claude's conversational response
  cards: AskCard[];
  error?: string;
}

const SYSTEM =
  "You are Abe's AI advisor for AlleyCorp's co-investor relationship intelligence platform. " +
  "AlleyCorp is a deep tech venture firm. Today is June 2026. " +
  "Use the provided tools to look up live data, then write a concise, direct answer as if briefing a partner before a meeting. " +
  "Be specific — name funds, companies, dates. No filler. 2–5 sentences max unless the user asks for more detail.";

export async function POST(req: Request): Promise<NextResponse<AskResponse>> {
  try {
    const { query } = await req.json() as { query: string };
    if (!query?.trim()) {
      return NextResponse.json({ tool: null, query: "", answer: "Query required", cards: [] }, { status: 400 });
    }

    // Turn 1 — Claude picks a tool
    const turn1 = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      tools: TOOLS,
      tool_choice: { type: "any" },
      system: SYSTEM,
      messages: [{ role: "user", content: query }],
    });

    const toolUse = turn1.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ tool: null, query, answer: "Couldn't route that question — try rephrasing.", cards: [] });
    }

    const toolName = toolUse.name;
    const toolInput = toolUse.input as Record<string, string>;

    // Execute the tool against the DB
    let relationships: Relationship[] = [];
    let toolResultText = "";

    if (toolName === "list_stale_relationships") {
      relationships = await listStaleRelationships();
      toolResultText = relationships.length === 0
        ? "No stale relationships found."
        : relationships.map((r) => {
            const fund = r.fund?.name ?? "Unknown";
            const company = r.portfolioCompany?.name ?? "Unknown";
            const date = r.lastSignalDate ? formatDate(r.lastSignalDate) : "unknown date";
            const signals = r.signals?.length ?? 0;
            return `${fund} | last signal: ${date} | co-invested in: ${company} | signals: ${signals}`;
          }).join("\n");
    } else if (toolName === "search_relationships") {
      relationships = await searchRelationships(toolInput.query ?? query);
      toolResultText = relationships.length === 0
        ? `No results for "${toolInput.query ?? query}".`
        : relationships.map((r) => {
            const fund = r.fund?.name ?? "Unknown";
            const company = r.portfolioCompany?.name ?? "Unknown";
            const signals = r.signals?.length ?? 0;
            return `${fund} | warmth: ${r.warmthTier} | co-invested in: ${company} | signals: ${signals}`;
          }).join("\n");
    } else if (toolName === "get_investor") {
      const rel = await getInvestorByName(toolInput.name ?? query);
      if (rel) {
        relationships = [rel];
        const signals = (rel.signals ?? []).map((s) => `${s.type} — ${s.source} (${s.date})`).join("; ");
        toolResultText = [
          `Fund: ${rel.fund?.name}`,
          `Warmth: ${rel.warmthTier}`,
          `Co-invested in: ${rel.portfolioCompany?.name ?? "N/A"}`,
          `Last signal: ${formatDate(rel.lastSignalDate)}`,
          `Signal history: ${signals || "none"}`,
        ].join("\n");
      } else {
        toolResultText = `No fund found matching "${toolInput.name ?? query}".`;
      }
    }

    // Turn 2 — Claude reads the tool result and writes the answer
    // tools must be included in every turn; tool_choice omitted so Claude responds with text
    const turn2 = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: TOOLS,
      system: SYSTEM,
      messages: [
        { role: "user", content: query },
        { role: "assistant", content: turn1.content },
        {
          role: "user",
          content: [{ type: "tool_result", tool_use_id: toolUse.id, content: toolResultText }],
        },
      ],
    });

    const answerBlock = turn2.content.find((b) => b.type === "text");
    const answer = answerBlock?.type === "text" ? answerBlock.text : "No answer generated.";

    return NextResponse.json({
      tool: toolName,
      query,
      answer,
      cards: relationships.map(relToCard),
    });
  } catch (err) {
    console.error("[POST /api/ask]", err);
    return NextResponse.json(
      { tool: null, query: "", answer: "Something went wrong — check API key and DB connection.", cards: [], error: String(err) },
      { status: 500 }
    );
  }
}
