# Integration Tests — AlleyCorp Relationship Intelligence Platform

**Version:** 1.0 · **Created:** May 26, 2026 · **Demo Day:** June 24, 2026
**Team:** Luba · Michael · Yaasameen

---

## Purpose

Integration tests verify that two or more components work correctly when connected. They sit between unit tests (single function in isolation) and acceptance tests (full user journey end-to-end).

Run an integration test any time a new feature is merged that crosses a boundary:

| Boundary | Example |
|---|---|
| DB ↔ Scoring | Luba seeds new data → does `scoring.ts` classify it correctly? |
| DB ↔ MCP tool | Yaasameen wires a SQL query → does the tool handler format the result? |
| Scoring ↔ MCP | Does the tier computed by `scoring.ts` match what the MCP tool returns? |
| MCP ↔ Digest | Does `lib/digest.ts` agree with MCP on Lux Capital's tier and reason? |
| Digest ↔ Resend | Does the email send with the right content? |
| API Route ↔ DB | Does `GET /api/alerts` return real stale relationships? |

**This is not the acceptance test.** The acceptance test (`npm run test:acceptance`) proves Claude picks the right tool and the full chain returns a useful answer. These tests prove the components themselves connect correctly before Claude is involved.

---

## Prerequisites

Before running any test below:

1. `.env` is populated — `DATABASE_URL`, `MCP_TOKEN_SECRET`, `ANTHROPIC_API_KEY` all set
2. Railway PostgreSQL is live and reachable
3. `npm install` has been run
4. Luba's schema migrations have been applied
5. Seed data is in the database (Lux Capital, Hot anchors, Warm and Cold examples)

---

## Test Suite

---

### IT-01 — Schema ↔ Types Alignment

**What it tests:** The PostgreSQL schema Luba defines matches the TypeScript types in `lib/types.ts`. If columns are renamed or types diverge, every query will silently return wrong shapes.

**Boundary:** DB schema ↔ `lib/types.ts`

**When to run:** Any time Luba changes the schema or `lib/types.ts` is updated.

**How to run:**

Open a `psql` session against the Railway database and verify each table:

```sql
-- funds
\d funds
-- Expected columns: id (uuid), name (text), focus (text), aum_tier (text nullable),
--   emerging_manager (boolean), website (text nullable)

-- investors
\d investors
-- Expected columns: id (uuid), name (text), fund_id (uuid FK), role (text),
--   linkedin (text nullable), stage_focus (text nullable)

-- portfolio_companies
\d portfolio_companies
-- Expected columns: id (uuid), name (text), sector (text), stage (text),
--   alleycorp_role (text), website (text nullable)

-- relationships
\d relationships
-- Expected columns: id (uuid), fund_id (uuid FK), portfolio_company_id (uuid FK),
--   alley_partner (text), warmth_tier (text), last_signal_date (timestamptz nullable),
--   override_note (text nullable)

-- signals
\d signals
-- Expected columns: id (uuid), relationship_id (uuid FK), type (text),
--   date (timestamptz), source (text), value (text), confidence (text)
```

**Pass criteria:**
- All columns present with correct types
- `warmth_tier` values are title case: `Hot`, `Warm`, `Stale`, `Cold` — not uppercase
- `confidence` values are: `high`, `medium`, `low`
- Foreign keys are enforced (no orphaned signal rows)

**Fail → fix:** Update the schema migration to match `lib/types.ts`. Do not change `lib/types.ts` to match the schema — types are the source of truth.

---

### IT-02 — DB Query → MCP Tool Handler

**What it tests:** Each of the 4 SQL queries in `lib/db.ts` returns data that the MCP tool handler can format without throwing. Proves the DB integration layer works independently of Claude.

**Boundary:** `lib/db.ts` ↔ `mcp/tools/*.ts`

**When to run:** Any time Yaasameen wires or changes a SQL query in `lib/db.ts`, or Luba changes the schema.

**How to run:**

Create a temporary script at `scripts/it-02-db-tools.ts` and run `npx tsx scripts/it-02-db-tools.ts`:

```typescript
import { getInvestorByName, searchRelationships, listStaleRelationships, getWarmthSignals } from "../lib/db.js";
import { handler as getInvestor } from "../mcp/tools/get-investor.js";
import { handler as searchRels } from "../mcp/tools/search-relationships.js";
import { handler as listStale } from "../mcp/tools/list-stale-relationships.js";
import { handler as getSignals } from "../mcp/tools/get-warmth-signals.js";

async function run() {
  let pass = 0;

  // IT-02-A: get_investor — Lux Capital
  try {
    const result = await getInvestor({ name: "Lux Capital" });
    const text = result.content[0].text;
    if (text.toLowerCase().includes("lux capital") && text.toLowerCase().includes("stale")) {
      console.log("IT-02-A PASS: get_investor(Lux Capital)");
      pass++;
    } else {
      console.log("IT-02-A FAIL: missing Lux Capital or Stale tier");
      console.log("  Got:", text.slice(0, 300));
    }
  } catch (e) {
    console.log("IT-02-A ERROR:", e);
  }

  // IT-02-B: search_relationships — Hot tier
  try {
    const result = await searchRels({ query: "Hot" });
    const text = result.content[0].text;
    const anchors = ["riot ventures", "snowpoint", "general catalyst", "mach33"];
    const allFound = anchors.every(a => text.toLowerCase().includes(a));
    if (allFound) {
      console.log("IT-02-B PASS: search_relationships(Hot) — all 4 anchors returned");
      pass++;
    } else {
      console.log("IT-02-B FAIL: not all Hot anchors returned");
      console.log("  Got:", text.slice(0, 300));
    }
  } catch (e) {
    console.log("IT-02-B ERROR:", e);
  }

  // IT-02-C: list_stale_relationships
  try {
    const result = await listStale();
    const text = result.content[0].text;
    if (text.toLowerCase().includes("lux capital")) {
      console.log("IT-02-C PASS: list_stale_relationships — Lux Capital present");
      pass++;
    } else {
      console.log("IT-02-C FAIL: Lux Capital not in stale list");
      console.log("  Got:", text.slice(0, 300));
    }
  } catch (e) {
    console.log("IT-02-C ERROR:", e);
  }

  // IT-02-D: get_warmth_signals — requires a valid relationship ID from your DB
  // Replace RELATIONSHIP_ID_HERE with the UUID for Lux Capital from your DB
  const luxRelationshipId = "RELATIONSHIP_ID_HERE";
  try {
    const result = await getSignals({ investor_id: luxRelationshipId });
    const text = result.content[0].text;
    if (text.toLowerCase().includes("co_investment") || text.toLowerCase().includes("signal")) {
      console.log("IT-02-D PASS: get_warmth_signals — signals returned");
      pass++;
    } else {
      console.log("IT-02-D FAIL: no signals returned for Lux Capital");
      console.log("  Got:", text.slice(0, 300));
    }
  } catch (e) {
    console.log("IT-02-D ERROR:", e);
  }

  console.log(`\n${pass}/4 passed`);
  if (pass < 4) process.exit(1);
}

run();
```

**Pass criteria:** 4/4 pass. Each handler returns formatted text without throwing.

**Fail → fix:** Check the SQL query in `lib/db.ts` for the failing tool. Confirm the column names match the schema. Do not change the tool handler output format.

---

### IT-03 — Scoring Engine ↔ Stored Warmth Tier

**What it tests:** The tier computed by `lib/scoring.ts` (`computeWarmthTier()`) matches the `warmth_tier` value stored in the database. If these diverge, the MCP layer and the dashboard will disagree.

**Boundary:** `lib/scoring.ts` ↔ DB `relationships.warmth_tier`

**When to run:** Any time Luba seeds or updates relationship data, or scoring logic in `lib/scoring.ts` is changed.

**How to run:**

```typescript
import { pool } from "../lib/db.js";
import { computeWarmthTier } from "../lib/scoring.js";

async function run() {
  const { rows } = await pool.query(`
    SELECT r.id, r.warmth_tier, r.last_signal_date, r.override_note,
           f.name AS fund_name,
           json_agg(json_build_object('type', s.type, 'confidence', s.confidence)) AS signals
    FROM relationships r
    JOIN funds f ON f.id = r.fund_id
    LEFT JOIN signals s ON s.relationship_id = r.id
    GROUP BY r.id, r.warmth_tier, r.last_signal_date, r.override_note, f.name
  `);

  let pass = 0;
  let fail = 0;

  for (const row of rows) {
    const computed = computeWarmthTier({
      fundName: row.fund_name,
      warmthTier: row.warmth_tier,
      lastSignalDate: row.last_signal_date ? new Date(row.last_signal_date) : null,
      overrideNote: row.override_note,
      signals: row.signals.filter((s: any) => s.type !== null),
    });

    if (computed === row.warmth_tier) {
      console.log(`PASS: ${row.fund_name} → ${computed}`);
      pass++;
    } else {
      console.log(`FAIL: ${row.fund_name} — DB says ${row.warmth_tier}, scoring says ${computed}`);
      fail++;
    }
  }

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

run();
```

**Pass criteria:** Every relationship row: `computeWarmthTier()` result equals `relationships.warmth_tier`.

**Key assertions to verify manually:**
- Lux Capital → `Stale` (co-investment present, `last_signal_date` > 180 days ago)
- Riot Ventures → `Hot` (HOT_ANCHOR in `scoring.ts`)
- General Catalyst → `Hot` (HOT_ANCHOR)
- a16z American Dynamism → no relationship row (Cold by absence, not by stored tier)

**Fail → fix:** If the stored tier is wrong, update the seed data. If the computed tier is wrong, check `STALE_DAYS` (180) and `COLD_DAYS` (365) constants in `lib/scoring.ts` and confirm `last_signal_date` was seeded correctly.

---

### IT-04 — MCP ↔ Digest Consistency

**What it tests:** The MCP tool and the digest generator return the same warmth tier and reason for the same relationship. This is the inconsistency check defined in the acceptance criteria.

**Boundary:** `mcp/tools/get-investor.ts` ↔ `lib/digest.ts`

**When to run:** Any time `lib/digest.ts` is created or changed, or MCP tool output format changes.

**How to run:**

```typescript
import { handler as getInvestor } from "../mcp/tools/get-investor.js";
import { generateDigest } from "../lib/digest.js";

async function run() {
  const mcpResult = await getInvestor({ name: "Lux Capital" });
  const mcpText = mcpResult.content[0].text.toLowerCase();

  const digest = await generateDigest();
  const luxItem = digest.find(d => d.fundName.toLowerCase() === "lux capital");

  if (!luxItem) {
    console.log("FAIL: Lux Capital not found in digest output");
    process.exit(1);
  }

  const mcpIsStale = mcpText.includes("stale");
  const digestIsStale = luxItem.type === "STALE_ALERT";

  if (mcpIsStale && digestIsStale) {
    console.log("PASS: MCP and digest both classify Lux Capital as Stale");
  } else {
    console.log(`FAIL: MCP stale=${mcpIsStale}, digest stale=${digestIsStale}`);
    console.log("  MCP output:", mcpText.slice(0, 200));
    console.log("  Digest item:", JSON.stringify(luxItem));
    process.exit(1);
  }
}

run();
```

**Pass criteria:** Both the MCP tool and the digest item classify Lux Capital as Stale. If they disagree, the root cause is a divergent code path — fix `lib/scoring.ts`, not the outputs individually.

---

### IT-05 — API Route ↔ DB

**What it tests:** The Next.js API routes (`GET /api/alerts`, `GET /api/events`) return real data from the database — not 501 stubs.

**Boundary:** `app/api/alerts/route.ts` + `app/api/events/route.ts` ↔ `lib/db.ts`

**When to run:** When Yaasameen implements these routes. Re-run if DB schema changes.

**How to run:**

Start the dev server (`npm run dev`) and hit the routes:

```bash
# Alerts — should return stale relationships
curl http://localhost:3000/api/alerts

# Expected shape:
# { "relationships": [{ "fundName": "Lux Capital", "warmthTier": "Stale", ... }] }

# Events — should return recent signals
curl http://localhost:3000/api/events

# Expected shape:
# { "signals": [{ "type": "co_investment", "date": "...", "source": "..." }] }
```

**Pass criteria:**
- `GET /api/alerts` returns HTTP 200 with at least one Stale relationship (Lux Capital)
- `GET /api/events` returns HTTP 200 with signal data
- Neither returns `{ "error": "Not implemented" }` (501)
- Response time under 2 seconds

**Fail → fix:** The route is still a 501 stub, or the SQL query in `lib/db.ts` is incorrect. Check the `pool.query()` call and verify column names against the schema.

---

### IT-06 — Digest ↔ Resend Email Delivery

**What it tests:** `lib/digest.ts` generates valid `DigestItem[]` and Resend actually delivers the email. Does not test Claude or MCP — purely the digest generation and delivery pipeline.

**Boundary:** `lib/digest.ts` ↔ Resend API

**When to run:** When Yaasameen wires the Resend integration. Re-run after any digest content change.

**How to run:**

```typescript
import { generateDigest } from "../lib/digest.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function run() {
  const digest = await generateDigest();

  if (digest.length === 0) {
    console.log("FAIL: digest returned 0 items — check stale relationship seeding");
    process.exit(1);
  }

  console.log(`Generated ${digest.length} digest item(s):`);
  for (const item of digest) {
    console.log(`  [${item.type}] ${item.fundName} — ${item.summary}`);
  }

  // Send to a test address — do not use real recipient in integration testing
  const { data, error } = await resend.emails.send({
    from: "AlleyCorp Network <digest@yourdomain.com>",
    to: ["test@yourdomain.com"],
    subject: `[IT-06 TEST] AlleyCorp Daily Digest`,
    html: digest.map(d => `<p><b>${d.fundName}</b>: ${d.summary}</p>`).join(""),
  });

  if (error) {
    console.log("FAIL: Resend error:", error);
    process.exit(1);
  }

  console.log("PASS: email sent, Resend ID:", data?.id);
}

run();
```

**Pass criteria:**
- `generateDigest()` returns at least 1 item
- Lux Capital appears as a `STALE_ALERT` item
- Resend API returns a message ID (no error)
- Email is received at the test address

**Note:** Use a test email address. Do not send to Abe or Brannon during integration testing.

---

### IT-07 — MCP Security Layer ↔ Tool Dispatch

**What it tests:** The 4-layer security in `mcp/server.ts` correctly allows valid tool calls and blocks invalid ones. Confirms that Layer 1 (allowlist) sanitizes input without breaking valid requests.

**Boundary:** `mcp/security/allowlist.ts` ↔ tool handlers

**When to run:** Any time a new tool is added to the MCP server, or `mcp/security/allowlist.ts` is modified.

**How to run:**

```typescript
import { checkAllowlist } from "../mcp/security/allowlist.js";

const cases = [
  // Valid calls
  { name: "get_investor", args: { name: "Lux Capital" }, expectAllowed: true },
  { name: "search_relationships", args: { query: "Hot" }, expectAllowed: true },
  { name: "list_stale_relationships", args: {}, expectAllowed: true },
  { name: "get_warmth_signals", args: { investor_id: "abc-123" }, expectAllowed: true },

  // Invalid tool name
  { name: "delete_investor", args: { name: "Lux Capital" }, expectAllowed: false },

  // Injection attempt — extra keys should be stripped, not blocked
  { name: "get_investor", args: { name: "Lux Capital", __proto__: "injected" }, expectAllowed: true },

  // Unknown tool entirely
  { name: "run_sql", args: { query: "DROP TABLE funds" }, expectAllowed: false },
];

let pass = 0;
for (const c of cases) {
  const result = checkAllowlist(c.name, c.args as Record<string, unknown>);
  if (result.allowed === c.expectAllowed) {
    console.log(`PASS: ${c.name} → allowed=${result.allowed}`);
    pass++;
  } else {
    console.log(`FAIL: ${c.name} — expected allowed=${c.expectAllowed}, got ${result.allowed} (${result.reason})`);
  }
}

console.log(`\n${pass}/${cases.length} passed`);
if (pass < cases.length) process.exit(1);
```

**Pass criteria:** 7/7 pass. Valid tool names allowed, invalid ones blocked, extra input keys stripped silently.

---

## Running All Tests

There is no single command yet — tests are run individually per boundary. Add each as a script in `package.json` once the scripts are finalized:

```json
"test:it:db-tools":   "tsx scripts/it-02-db-tools.ts",
"test:it:scoring":    "tsx scripts/it-03-scoring.ts",
"test:it:consistency":"tsx scripts/it-04-consistency.ts",
"test:it:api":        "tsx scripts/it-05-api.ts",
"test:it:digest":     "tsx scripts/it-06-digest.ts",
"test:it:security":   "tsx scripts/it-07-security.ts"
```

---

## Test Ownership

| Test | Owner | Depends On |
|---|---|---|
| IT-01 Schema Alignment | Luba | Schema migrations complete |
| IT-02 DB → MCP Tools | Yaasameen | IT-01 passing, `lib/db.ts` wired |
| IT-03 Scoring ↔ DB | Luba + Yaasameen | IT-01 passing, seed data in DB |
| IT-04 MCP ↔ Digest | Yaasameen | IT-02 passing, `lib/digest.ts` created |
| IT-05 API Routes ↔ DB | Yaasameen + Michael | IT-02 passing, routes implemented |
| IT-06 Digest ↔ Resend | Yaasameen | IT-04 passing, Resend API key set |
| IT-07 Security Layer | Yaasameen | No DB dependency — can run now |

---

## Integration Test vs Acceptance Test

| | Integration Test | Acceptance Test |
|---|---|---|
| **Run with** | `tsx scripts/it-XX.ts` | `npm run test:acceptance` |
| **Tests** | Component boundary | Full user journey |
| **Involves Claude** | No | Yes |
| **Requires DB** | Yes (most) | Yes |
| **When to run** | When merging a new feature | Before Demo Day |
| **Failure means** | A wiring bug between two components | A Demo Day blocker |

Integration tests must pass before acceptance tests are meaningful. A passing acceptance test that sits on top of broken integration boundaries is luck, not correctness.

---

*Integration Tests v1.0 · May 26, 2026 · AlleyCorp Network · Luba, Michael, Yaasameen*
