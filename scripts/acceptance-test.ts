// End-to-end acceptance test — required before Demo Day (June 24)
// Validates the full Claude → MCP tool selection → DB → response chain
// All 5 prompts must pass. Any failure is a Demo Day blocker.
//
// HOW TO RUN:
// 1. Wire DB query stubs in lib/db.ts to real SQL (Luba's schema)
// 2. Seed test data — Lux Capital must score as Stale
// 3. Set ANTHROPIC_API_KEY in your environment
// 4. Run: npm run test:acceptance

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
    passCriteria: "Returns Lux Capital with Inductive Bio reason and suggested action. Under 5 seconds.",
    validate: (r) => r.toLowerCase().includes("lux capital") && r.toLowerCase().includes("stale"),
  },
  {
    id: 2,
    prompt: "Who are our warmest relationships in deep tech right now?",
    expectedTool: "search_relationships()",
    passCriteria: "Returns all four Hot anchors with signal evidence. No hallucinated funds.",
    validate: (r) =>
      ["riot ventures", "snowpoint", "general catalyst", "mach33"].every((f) =>
        r.toLowerCase().includes(f)
      ),
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
    prompt: "Show me the full picture on Lux Capital.",
    expectedTool: "get_investor() + get_warmth_signals()",
    passCriteria:
      "Returns Stale tier, Inductive Bio history, reason, action. Matches digest entry — no inconsistency.",
    validate: (r) =>
      r.toLowerCase().includes("lux capital") && r.toLowerCase().includes("stale"),
  },
];

async function runQuery(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    // MCP Tool uses inputSchema (camelCase); Anthropic SDK expects input_schema (snake_case).
    // The shapes are compatible at runtime — cast through unknown to satisfy the type checker.
    tools: TOOLS as unknown as Anthropic.Tool[],
    messages: [{ role: "user", content: prompt }],
  });

  // Collect all tool calls Claude wants to make
  const toolUses = response.content.filter((b) => b.type === "tool_use");
  if (toolUses.length === 0) {
    return response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");
  }

  // Execute each tool and collect results
  const toolResults: Anthropic.ToolResultBlockParam[] = [];
  for (const block of toolUses) {
    const tb = block as Anthropic.ToolUseBlock;
    let result: CallToolResult;

    switch (tb.name) {
      case "get_investor":
        result = await getInvestor(tb.input as { name: string });
        break;
      case "search_relationships":
        result = await searchRelationships(tb.input as { query: string });
        break;
      case "list_stale_relationships":
        result = await listStaleRelationships();
        break;
      case "get_warmth_signals":
        result = await getWarmthSignals(tb.input as { investor_id: string });
        break;
      default:
        result = { content: [{ type: "text", text: `Unknown tool: ${tb.name}` }] };
    }

    // Extract the first text block from the MCP result content union
    const textBlock = result.content.find((b) => b.type === "text") as
      | { type: "text"; text: string }
      | undefined;

    toolResults.push({
      type: "tool_result",
      tool_use_id: tb.id,
      content: textBlock?.text ?? "",
    });
  }

  // Send results back to Claude for final formatting
  const final = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: TOOLS as unknown as Anthropic.Tool[],
    messages: [
      { role: "user", content: prompt },
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ],
  });

  return final.content
    .filter((b) => b.type === "text")
    .map((b) => (b as Anthropic.TextBlock).text)
    .join("");
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
      if (test.validate(response) && ms < 5000) {
        console.log(` ✓ PASS (${ms}ms)`);
        passed++;
      } else {
        console.log(` ✗ FAIL (${ms}ms)`);
        console.log(`   Expected: ${test.passCriteria}`);
        if (ms >= 5000) console.log(`   Exceeded 5s limit`);
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
