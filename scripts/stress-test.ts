/**
 * Stress test — runs all 5 Demo Day prompts 10 times each.
 * Reports pass rate, min/max/avg response time, and any failure details.
 */
import dotenv from "dotenv";
dotenv.config({ override: true });

import Anthropic from "@anthropic-ai/sdk";
import { pool } from "../lib/db.js";
import { tool as getInvestorTool } from "../mcp/tools/get-investor.js";
import { tool as searchRelationshipsTool } from "../mcp/tools/search-relationships.js";
import { tool as listStaleTool } from "../mcp/tools/list-stale-relationships.js";
import { tool as getWarmthSignalsTool } from "../mcp/tools/get-warmth-signals.js";
import { handler as getInvestor } from "../mcp/tools/get-investor.js";
import { handler as searchRelationships } from "../mcp/tools/search-relationships.js";
import { handler as listStaleRelationships } from "../mcp/tools/list-stale-relationships.js";
import { handler as getWarmthSignals } from "../mcp/tools/get-warmth-signals.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const RUNS = 10;
const WARN_MS = 10000; // warn if over 10s
const FAIL_MS = 60000; // fail if over 60s

const client = new Anthropic();

const TOOLS = [getInvestorTool, searchRelationshipsTool, listStaleTool, getWarmthSignalsTool];
const ANTHROPIC_TOOLS: Anthropic.Tool[] = TOOLS.map((t) => ({
  name: t.name,
  description: t.description ?? "",
  input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
}));

const PROMPTS = [
  {
    id: 1,
    prompt:
      "Which co-investors should we reconnect with before they lead another round without us?",
    validate: (r: string) =>
      (r.toLowerCase().includes("stale") ||
        r.toLowerCase().includes("reconnect") ||
        r.toLowerCase().includes("risk")) &&
      (r.toLowerCase().includes("trimble") ||
        r.toLowerCase().includes("sinewave") ||
        r.toLowerCase().includes("bold capital")),
    checks: ["mentions stale/reconnect/risk", "names Trimble, SineWave, or BOLD Capital"],
  },
  {
    id: 2,
    prompt: "Who are our warmest relationships in deep tech right now?",
    validate: (r: string) =>
      r.toLowerCase().includes("hot") &&
      (r.toLowerCase().includes("riot ventures") ||
        r.toLowerCase().includes("general catalyst") ||
        r.toLowerCase().includes("mach33")),
    checks: ["mentions Hot tier", "names Riot, GC, or Mach33"],
  },
  {
    id: 3,
    prompt: "What should I know before our meeting with General Catalyst next week?",
    validate: (r: string) =>
      r.toLowerCase().includes("general catalyst") && r.toLowerCase().includes("hot"),
    checks: ["mentions General Catalyst", "mentions Hot tier"],
  },
  {
    id: 4,
    prompt: "Are there any top deep tech funds we haven't co-invested with yet?",
    validate: (r: string) =>
      r.toLowerCase().includes("cold") ||
      r.toLowerCase().includes("a16z") ||
      r.toLowerCase().includes("eclipse"),
    checks: ["mentions Cold tier or a16z or Eclipse"],
  },
  {
    id: 5,
    prompt: "Show me the full picture on Trimble Ventures.",
    validate: (r: string) =>
      r.toLowerCase().includes("trimble") && r.toLowerCase().includes("stale"),
    checks: ["mentions Trimble", "mentions Stale tier"],
  },
];

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
  for (let round = 0; round < 5; round++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: ANTHROPIC_TOOLS,
      system: SYSTEM,
      messages,
    });
    const toolUses = response.content.filter((b) => b.type === "tool_use");
    if (toolUses.length === 0 || response.stop_reason === "end_turn") {
      return response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("");
    }
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUses) {
      const tb = block as Anthropic.ToolUseBlock;
      toolResults.push({
        type: "tool_result",
        tool_use_id: tb.id,
        content: await callTool(tb.name, tb.input),
      });
    }
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }
  return "";
}

async function run() {
  console.log(`\n=== AlleyCorp Stress Test — ${RUNS} runs per prompt ===\n`);
  const grandStart = Date.now();

  for (const p of PROMPTS) {
    console.log(`\nPrompt ${p.id}: "${p.prompt.slice(0, 70)}..."`);
    console.log(`${"─".repeat(72)}`);

    const times: number[] = [];
    let passed = 0;
    const failures: string[] = [];
    let emDash = 0,
      rawMarkdown = 0;

    for (let i = 1; i <= RUNS; i++) {
      const t0 = Date.now();
      process.stdout.write(`  Run ${String(i).padStart(2)}/${RUNS}: `);
      try {
        const response = await runQuery(p.prompt);
        const ms = Date.now() - t0;
        times.push(ms);

        const ok = p.validate(response) && ms < FAIL_MS;
        const slow = ms > WARN_MS;

        // Quality checks
        if (response.includes("—") || response.includes("–")) emDash++;
        if (response.includes("**") || response.includes("---") || response.match(/^#{1,3} /m))
          rawMarkdown++;

        if (ok) {
          passed++;
          console.log(`✓ ${ms}ms${slow ? " ⚠ SLOW" : ""}`);
        } else {
          const reason = ms >= FAIL_MS ? "timeout" : "content";
          failures.push(`Run ${i}: ${reason} — ${response.slice(0, 120)}`);
          console.log(`✗ ${ms}ms (${reason})`);
        }
      } catch (err) {
        const ms = Date.now() - t0;
        times.push(ms);
        failures.push(`Run ${i}: ERROR — ${err}`);
        console.log(`✗ ERROR: ${err}`);
      }
    }

    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`\n  Result: ${passed}/${RUNS} passed`);
    console.log(`  Time:   avg ${avg}ms  |  min ${min}ms  |  max ${max}ms`);
    if (emDash > 0) console.log(`  ⚠ Em-dash detected in ${emDash}/${RUNS} responses`);
    if (rawMarkdown > 0)
      console.log(`  ⚠ Raw markdown detected in ${rawMarkdown}/${RUNS} responses`);
    if (failures.length > 0) {
      console.log(`  Failures:`);
      failures.forEach((f) => console.log(`    ${f}`));
    }
  }

  await pool.end();
  console.log(`\n${"═".repeat(72)}`);
  console.log(`Total time: ${Math.round((Date.now() - grandStart) / 1000)}s`);
}

run();
