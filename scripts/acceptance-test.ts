// End-to-end acceptance test — required before Demo Day (June 24)
// Validates the full Claude → MCP tool selection → DB → response chain
// All 5 prompts must pass. Any failure is a Demo Day blocker.
//
// HOW TO RUN:
// 1. Wire DB query stubs in lib/db.ts to real SQL (Luba's schema)
// 2. Seed test data — Lux Capital must score as Stale
// 3. Set ANTHROPIC_API_KEY in your environment
// 4. Run: npm run test:acceptance

import dotenv from "dotenv";
dotenv.config({ override: true });
import Anthropic from "@anthropic-ai/sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { tool as getInvestorTool } from "../mcp/tools/get-investor.js";
import { tool as searchRelationshipsTool } from "../mcp/tools/search-relationships.js";
import { tool as listStaleTool } from "../mcp/tools/list-stale-relationships.js";
import { tool as getWarmthSignalsTool } from "../mcp/tools/get-warmth-signals.js";
import { handler as getInvestor } from "../mcp/tools/get-investor.js";
import { handler as searchRelationships } from "../mcp/tools/search-relationships.js";
import { handler as listStaleRelationships } from "../mcp/tools/list-stale-relationships.js";
import { handler as getWarmthSignals } from "../mcp/tools/get-warmth-signals.js";

const client = new Anthropic();

const TOOLS = [getInvestorTool, searchRelationshipsTool, listStaleTool, getWarmthSignalsTool];

interface TestCase {
  id: number;
  prompt: string;
  expectedTool: string;
  passCriteria: string;
  validate: (response: string) => boolean;
}

const TEST_CASES: TestCase[] = [
  {
    id: 1,
    prompt: "Which co-investors should we reconnect with before they lead another round without us?",
    expectedTool: "list_stale_relationships()",
    passCriteria: "Returns stale funds (SineWave Ventures, Trimble Ventures, BOLD Capital Partners) with portfolio company and suggested action.",
    validate: (r) =>
      r.toLowerCase().includes("stale") &&
      (r.toLowerCase().includes("trimble") ||
        r.toLowerCase().includes("sinwave") ||
        r.toLowerCase().includes("bold capital")),
  },
  {
    id: 2,
    prompt: "Who are our warmest relationships in deep tech right now?",
    expectedTool: "search_relationships()",
    passCriteria: "Returns Hot anchors including Riot Ventures, General Catalyst, Mach33. No hallucinated funds.",
    validate: (r) =>
      r.toLowerCase().includes("hot") &&
      (r.toLowerCase().includes("riot ventures") ||
        r.toLowerCase().includes("general catalyst") ||
        r.toLowerCase().includes("mach33")),
  },
  {
    id: 3,
    prompt: "What should I know before our meeting with General Catalyst next week?",
    expectedTool: "get_investor() + get_warmth_signals()",
    passCriteria: "Returns co-investment history, Hot tier, recent signals. Readable, not a raw dump.",
    validate: (r) =>
      r.toLowerCase().includes("general catalyst") && r.toLowerCase().includes("hot"),
  },
  {
    id: 4,
    prompt: "Are there any top deep tech funds we haven't co-invested with yet?",
    expectedTool: "search_relationships()",
    passCriteria: "Returns Cold tier targets (a16z American Dynamism, Eclipse, Founders Fund).",
    validate: (r) =>
      r.toLowerCase().includes("cold") ||
      r.toLowerCase().includes("a16z") ||
      r.toLowerCase().includes("eclipse"),
  },
  {
    id: 5,
    prompt: "Show me the full picture on Trimble Ventures.",
    expectedTool: "get_investor() + get_warmth_signals()",
    passCriteria:
      "Returns Stale tier, Civ Robotics co-investment history, reason for going stale, suggested action.",
    validate: (r) =>
      r.toLowerCase().includes("trimble") && r.toLowerCase().includes("stale"),
  },
];

// Convert MCP Tool (inputSchema camelCase) → Anthropic SDK Tool (input_schema snake_case)
const ANTHROPIC_TOOLS: Anthropic.Tool[] = TOOLS.map((t) => ({
  name: t.name,
  description: t.description ?? "",
  input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
}));

async function callTool(name: string, input: unknown): Promise<string> {
  let result: CallToolResult;
  switch (name) {
    case "get_investor":
      result = await getInvestor(input as { name: string });
      break;
    case "search_relationships":
      result = await searchRelationships(input as { query: string });
      break;
    case "list_stale_relationships":
      result = await listStaleRelationships();
      break;
    case "get_warmth_signals":
      result = await getWarmthSignals(input as { investor_id: string });
      break;
    default:
      result = { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
  const textBlock = result.content.find((b) => b.type === "text") as { type: "text"; text: string } | undefined;
  return textBlock?.text ?? "";
}

async function runQuery(prompt: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

  // Loop until Claude stops calling tools (max 5 rounds to avoid infinite loops)
  for (let round = 0; round < 5; round++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: ANTHROPIC_TOOLS,
      messages,
    });

    const toolUses = response.content.filter((b) => b.type === "tool_use");

    // No more tool calls — return the text response
    if (toolUses.length === 0 || response.stop_reason === "end_turn") {
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("");
      if (text) return text;
      // If no text but stop_reason is end_turn, return whatever we have
      if (response.stop_reason === "end_turn") return text;
    }

    // Execute tool calls and add to conversation
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUses) {
      const tb = block as Anthropic.ToolUseBlock;
      const resultText = await callTool(tb.name, tb.input);
      toolResults.push({ type: "tool_result", tool_use_id: tb.id, content: resultText });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  return "";
}

async function run() {
  console.log("\n=== AlleyCorp MCP Acceptance Test Suite ===");
  console.log("All 5 must pass before Demo Day (June 24)\n");

  let passed = 0;
  const start = Date.now();

  for (const test of TEST_CASES) {
    const t0 = Date.now();
    process.stdout.write(`[${test.id}/5] ${test.prompt.slice(0, 60)}...`);
    try {
      const response = await runQuery(test.prompt);
      const ms = Date.now() - t0;
      if (test.validate(response) && ms < 60000) {
        console.log(` ✓ PASS (${ms}ms)`);
        passed++;
      } else {
        console.log(` ✗ FAIL (${ms}ms)`);
        console.log(`   Expected: ${test.passCriteria}`);
        if (ms >= 60000) console.log(`   Exceeded 60s limit`);
        console.log(`   Got: ${response.slice(0, 200)}`);
      }
    } catch (err) {
      console.log(` ✗ ERROR: ${err}`);
    }
  }

  console.log(`\n=== ${passed}/5 passed in ${Date.now() - start}ms ===`);
  if (passed < 5) {
    console.log("\nDO NOT demo until all 5 pass.");
    process.exit(1);
  } else {
    console.log("\nAll acceptance tests passed. Cleared for Demo Day.");
  }
}

run();
