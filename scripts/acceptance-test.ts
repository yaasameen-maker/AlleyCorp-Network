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
import { pool } from "../lib/db.js";
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
    prompt:
      "Which co-investors should we reconnect with before they lead another round without us?",
    expectedTool: "list_stale_relationships()",
    // Validates behavior: Claude returns funds that need reconnecting with stale/risk language.
    // Does NOT check specific fund names — tiers change as data is updated.
    passCriteria: "Returns funds with stale/reconnect language and at least one named fund.",
    validate: (r) => {
      const lower = r.toLowerCase();
      const hasConcept =
        lower.includes("stale") || lower.includes("reconnect") || lower.includes("risk");
      // At least one fund name present — any word with "ventures", "capital", or "partners"
      const hasFund = /\b\w[\w\s]*(ventures|capital|partners|fund|vc)\b/i.test(r);
      return hasConcept && hasFund;
    },
  },
  {
    id: 2,
    prompt: "Who are our warmest relationships in deep tech right now?",
    expectedTool: "search_relationships()",
    // Lauren confirmed these 4 as always-Hot anchors — safe to check by name.
    passCriteria:
      "Returns Hot tier funds. At least one Lauren-confirmed anchor (Riot, Snowpoint, GC, Mach33).",
    validate: (r) =>
      r.toLowerCase().includes("hot") &&
      (r.toLowerCase().includes("riot") ||
        r.toLowerCase().includes("snowpoint") ||
        r.toLowerCase().includes("general catalyst") ||
        r.toLowerCase().includes("mach33")),
  },
  {
    id: 3,
    prompt: "What should I know before our meeting with General Catalyst next week?",
    expectedTool: "get_investor() + get_warmth_signals()",
    // GC is Lauren-confirmed Hot — safe to check by name and tier.
    passCriteria:
      "Returns General Catalyst info with Hot tier and co-investment or signal details.",
    validate: (r) =>
      r.toLowerCase().includes("general catalyst") && r.toLowerCase().includes("hot"),
  },
  {
    id: 4,
    prompt: "Are there any top deep tech funds we haven't co-invested with yet?",
    expectedTool: "search_relationships()",
    // Validates behavior: Claude surfaces funds with no co-investment history.
    // Does NOT check specific fund names — cold targets may change as data grows.
    passCriteria:
      "Returns funds with no co-investment yet, using cold/target/introduction language.",
    validate: (r) => {
      const lower = r.toLowerCase();
      return (
        lower.includes("cold") ||
        lower.includes("no co-investment") ||
        lower.includes("haven't co-invested") ||
        lower.includes("target") ||
        lower.includes("introduction")
      );
    },
  },
  {
    id: 5,
    prompt: "Show me the full picture on Trimble Ventures.",
    expectedTool: "get_investor() + get_warmth_signals()",
    // Trimble is named in the prompt so must appear in the response.
    // Does NOT check which tier — tier changes as signals age (currently Cold).
    passCriteria:
      "Returns Trimble Ventures with a warmth tier and co-investment or signal history.",
    validate: (r) => {
      const lower = r.toLowerCase();
      const hasTrimble = lower.includes("trimble");
      const hasTier =
        lower.includes("hot") ||
        lower.includes("warm") ||
        lower.includes("stale") ||
        lower.includes("cold");
      return hasTrimble && hasTier;
    },
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
  const textBlock = result.content.find((b) => b.type === "text") as
    | { type: "text"; text: string }
    | undefined;
  return textBlock?.text ?? "";
}

const SYSTEM =
  "You are Abe's AI advisor for AlleyCorp's co-investor relationship intelligence platform. " +
  "AlleyCorp is a deep tech venture firm. Today is June 2026.\n\n" +
  "FORMATTING RULES - follow exactly, no exceptions:\n" +
  "- No markdown. No asterisks, no bold (**), no underscores, no hyphens as dividers (---).\n" +
  "- No em dashes. Use a comma or period instead.\n" +
  "- Use plain section labels on their own line in ALL CAPS: RECOMMENDATIONS, RATIONALE, SUGGESTED ACTIONS.\n" +
  "- Bullet points: start each item with a hyphen and space (- ), one item per line.\n" +
  "- For network and relationship questions use this exact structure:\n" +
  "  RECOMMENDATIONS\n" +
  "  - Fund name: reason, evidence (last contact date, signal count, co-investment)\n" +
  "  RATIONALE\n" +
  "  One or two sentences on the overall pattern.\n" +
  "  SUGGESTED ACTIONS\n" +
  "  - Concrete next step\n\n" +
  "For non-network questions (greetings, general VC questions): respond conversationally, no sections.\n\n" +
  "Always be specific: names, dates, signal counts. No filler. Keep it tight.";

async function runQuery(prompt: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

  // Loop until Claude stops calling tools (max 5 rounds to avoid infinite loops)
  for (let round = 0; round < 5; round++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: ANTHROPIC_TOOLS,
      system: SYSTEM,
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

// Data health check — verifies contact enrichment is live in Railway.
// Not an MCP prompt test — checks the DB directly.
async function runDataHealthCheck(): Promise<boolean> {
  process.stdout.write(`[6/6] Data health: contacts with LinkedIn URLs in Railway...`);
  try {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM investor WHERE linkedin_url IS NOT NULL AND linkedin_url != ''`
    );
    const count = parseInt(rows[0]?.count ?? "0", 10);
    if (count >= 5) {
      console.log(` ✓ PASS (${count} contacts with LinkedIn URLs)`);
      return true;
    } else {
      console.log(` ✗ FAIL (only ${count} contacts — run: npm run enrich:funds -- --write)`);
      return false;
    }
  } catch (err) {
    console.log(` ✗ ERROR: ${err}`);
    return false;
  }
}

async function run() {
  console.log("\n=== AlleyCorp MCP Acceptance Test Suite ===");
  console.log("All 6 must pass before Demo Day (June 24)\n");

  let passed = 0;
  const start = Date.now();

  for (const test of TEST_CASES) {
    const t0 = Date.now();
    process.stdout.write(`[${test.id}/6] ${test.prompt.slice(0, 60)}...`);
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

  // Data health check (no Anthropic API needed)
  const healthOk = await runDataHealthCheck();
  if (healthOk) passed++;

  await pool.end();

  console.log(`\n=== ${passed}/6 passed in ${Date.now() - start}ms ===`);
  if (passed < 6) {
    console.log("\nDO NOT demo until all 6 pass.");
    process.exit(1);
  } else {
    console.log("\nAll acceptance tests passed. Cleared for Demo Day.");
  }
}

run();
