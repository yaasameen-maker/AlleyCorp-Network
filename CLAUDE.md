# CLAUDE.md — AlleyCorp Relationship Intelligence Platform

## 1. What This Is

A relationship intelligence tool for AlleyCorp's Deep Tech team. It surfaces co-investor warmth tiers, stale relationship alerts, and network intelligence through a Next.js dashboard, a REST API, and a Claude-powered MCP server. Demo Day: **June 24, 2026**.

**This is a real product AlleyCorp will use.** Build accordingly — no hacks, no shortcuts that break under real data.

---

## 2. Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL on Railway |
| DB client | `pg` (node-postgres) |
| MCP server | `@modelcontextprotocol/sdk` via `tsx` |
| Email | Resend |
| Monitoring | Sentry |
| Tests | Vitest (unit + integration) |
| Deployment | Railway (DB + app) |

---

## 3. Team & Ownership

| Person | Owns |
|---|---|
| **Luba** | `schema.sql`, `seed.sql`, `seed-dtny-signals.sql`, `lib/db.ts`, `lib/scoring.ts`, `lib/alerts.ts`, `lib/alerts.server.ts`, `app/api/alerts/route.ts`, data research (co-investor seeding) |
| **Yaasameen** | `mcp/` (server + 4 tools + security), `lib/scoring.ts` (weighted scorer), `lib/digest.ts`, `scripts/acceptance-test.ts`, `app/api/events/route.ts` |
| **Michael** | `app/page.tsx`, `app/layout.tsx`, all frontend pages, warmth tier UI, investor profile card |

Do not edit another person's files without flagging it first. If you must touch a shared file, leave a comment explaining why.

---

## 4. Key Commands

```bash
# Development
npm run dev              # Next.js dev server (http://localhost:3000)
npm run mcp              # MCP server on stdio (test with Inspector)

# Testing
npm run test             # Vitest in watch mode
npm run test:run         # Single run — use this in CI
npm run test:acceptance  # 5 Demo Day prompts against live DB + Anthropic API

# Quality
npm run lint             # ESLint (Next.js rules)
npm run lint:fix         # Auto-fix lint errors
npm run format           # Prettier — auto-fix all files
npm run format:check     # Prettier — check only (use in CI)
npm run typecheck        # tsc --noEmit — catch type errors without building

# Database
psql $DATABASE_URL -f schema.sql   # Run/re-run schema (idempotent)
psql $DATABASE_URL -f seed.sql     # Re-seed data (truncates first, idempotent)
```

---

## 5. Environment Variables

Copy `.env.example` to `.env` and fill in all values. Never commit `.env`.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Railway in production, local for dev) |
| `ANTHROPIC_API_KEY` | Required for `npm run test:acceptance` |
| `MCP_TOKEN_SECRET` | 32-byte hex secret — generate: `openssl rand -hex 32` |
| `MCP_PORT` | MCP server port (default: 3001, binds to 127.0.0.1 only) |
| `MCP_SANDBOX_DIR` | Sandbox root for file reads (default: `./data`) |
| `SENTRY_DSN` | Sentry project DSN |
| `APP_SECRET_KEY` | App-level signing key |

**Before running the MCP server:** create the `data/` directory in the repo root (MCP Layer 4 sandbox requires it):
```bash
mkdir -p data
```

---

## 6. Architecture

### Data flow
```
PostgreSQL (Railway)
  └── lib/db.ts              — 4 SQL queries, typed mappers
  └── lib/scoring.ts         — deterministic warmth tier logic (no AI)
  └── lib/alerts.ts          — client-safe alert types + getRelationshipAlerts (no DB import)
  └── lib/alerts.server.ts   — server-only getAlerts() with DB query (never import in client components)
  └── lib/digest.ts          — daily digest item generation (Yaasameen)

Next.js App Router
  └── app/api/alerts     — GET /api/alerts
  └── app/api/events     — GET /api/events (Yaasameen)
  └── app/page.tsx       — investor list + warmth dashboard (Michael)

MCP Server (stdio)
  └── mcp/tools/         — 4 tool handlers → lib/db.ts
  └── mcp/security/      — 4-layer security (Yaasameen)
```

### Warmth tiers
Stored in DB as **lowercase** (`hot`, `warm`, `stale`, `cold`). Exposed in TypeScript as **Title Case** (`"Hot"`, `"Warm"`, `"Stale"`, `"Cold"`). The `toWarmthTier()` helper in `lib/db.ts` handles conversion. Do not change this — it's a deliberate boundary.

### Two scoring APIs (both in `lib/scoring.ts`)
- `calculateWarmthTier(signals: Signal[])` — time-window approach, used by `lib/alerts.ts` and tests
- `computeWarmthTier(rel: ScoringRelationship)` — weighted scoring with `RelationshipRepository`, used by `recalibrateAll`

Do not merge them. They serve different purposes.

---

## 7. Database

### Schema
5 tables: `fund`, `investor`, `portfolio_company`, `relationship`, `signal`

Full schema: `schema.sql` — idempotent, safe to re-run.

### Seeding
Run in this order:
```bash
psql $DATABASE_URL -f schema.sql          # idempotent schema
psql $DATABASE_URL -f seed.sql            # truncates + re-seeds all data
psql $DATABASE_URL -f seed-dtny-signals.sql  # DTNY event signals (Jan 28 2026)
```

`seed.sql` inserts:
- 20 portfolio companies (17 active + 3 alumni — Lauren Young confirmed list, May 2026)
- 9 funds (Riot, Snowpoint, GC, Mach33, SOSV + 3 cold targets + others)
- 19 relationships across all 4 warmth tiers
- Signals for hot/warm/stale relationships

`seed-dtny-signals.sql` adds:
- 7 event_attendance signals from DTNY Jan 28 2026 (Riot, BOLD, Eclipse, ff VC, USV, a16z, Mach33)

**Source data files** (PII — gitignored, stored in `data/`):
- `data/DTNY Registration.xlsx` — official attendee list from Lauren Young
- `data/Swoogo Contacts.xlsx - Pulled 5_15_26.csv` — broader contact DB (no dates/events, limited use)

### Railway deployment
Railway is already provisioned and live. To re-seed:
```bash
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f seed.sql
psql $DATABASE_URL -f seed-dtny-signals.sql
```

### Local development
```bash
createdb alleycorp
export DATABASE_URL=postgresql://$(whoami)@localhost:5432/alleycorp
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f seed.sql
```

---

## 8. MCP Security Layers

Yaasameen's implementation — do not modify without consulting him.

| Layer | File | What it does |
|---|---|---|
| 1 | `mcp/security/allowlist.ts` | Restricts which tools Claude can call |
| 2 | `mcp/security/tokens.ts` | JWT token signing/validation (requires `MCP_TOKEN_SECRET`) |
| 3 | `mcp/security/network.ts` | Binds to 127.0.0.1 only, validates bind address |
| 4 | `mcp/security/sandbox.ts` | All file reads constrained to `MCP_SANDBOX_DIR` |

**Known startup issue:** the `mcp/security/index.ts` barrel import causes a crash at startup if `MCP_TOKEN_SECRET` is missing (tokens.ts throws at module load). Fix: import directly from `./security/allowlist.js` instead of the barrel. Yaasameen owns this fix.

---

## 9. Acceptance Tests

5 Demo Day prompts in `scripts/acceptance-test.ts`. All 5 must pass before June 24.

```bash
npm run test:acceptance
```

Requires `ANTHROPIC_API_KEY` and a live `DATABASE_URL` with seed data. Run against Railway, not local DB, for final acceptance.

The test validates tool selection, response content, and response time (< 5 seconds). See SPRINT-v2.md for pass criteria per prompt.

---

## 10. Coding Rules

### Non-negotiable
- **Strict TypeScript.** No `any`. No ignoring type errors. Fix them or ask.
- **No hardcoded strings.** Connection strings, secrets, thresholds → env vars or constants.
- **No silent failures.** Every catch block logs something meaningful.
- **No field removal.** Adding fields to a DB row type is safe. Removing or renaming breaks other layers.
- **Type hints on every function.** Return types explicit.
- **Warmth tier case contract.** DB = lowercase. TypeScript = Title Case. Do not collapse this distinction.
- **Run and fix tests after every change.** After any code or data change, run `npm run test:run` before committing. If a test fails because the data changed (not a bug), update the test to match the new reality and explain why in a comment.

### Import conventions
| Context | Import style |
|---|---|
| `app/**` and `lib/**` (Next.js webpack) | No extension: `from "./db"` |
| `mcp/**` (Node.js ESM via tsx) | With extension: `from "../../lib/db.js"` |

### Error handling
- Every DB call wrapped in try/catch with a log
- Missing fields are `undefined`, never `null` substituted with a default
- API routes return structured JSON errors with appropriate status codes

---

## 11. Deployment (Railway)

Target platform: Railway (PostgreSQL + Next.js app).

1. ✅ PostgreSQL provisioned on Railway (live as of June 2026)
2. ✅ Env vars set in Railway dashboard
3. Re-seed anytime: `schema.sql` → `seed.sql` → `seed-dtny-signals.sql`
4. Deploy Next.js app — Railway auto-detects Next.js
5. Run `npm run test:acceptance` against the live Railway DB to confirm

The MCP server runs locally (stdio transport) — it is not deployed to Railway.

---

## 12. Demo Day Script (June 24)

Five prompts, Abe's POV:
1. "Which co-investors should we reconnect with before they lead another round without us?"
2. "Who are our warmest relationships in deep tech right now?"
3. "What should I know before our meeting with General Catalyst next week?"
4. "Are there any top deep tech funds we haven't co-invested with yet?"
5. "Show me the full picture on Trimble Ventures."

⚠️ Prompt 5 was "Lux Capital" in early docs but Lux Capital was removed from the DB (their co-investment was Inductive Bio, which is not on Lauren's confirmed list). Acceptance tests are written for Trimble Ventures. Demo script must match.

All 5 must return correct results from live Railway DB in under 5 seconds. Run `npm run test:acceptance` the morning of Demo Day.

---

## 13. What Is Not Being Built

- AI scoring (warmth is deterministic, no LLM in the scoring layer)
- CRM features
- Healthcare or General team views (data model supports it, not this sprint)
- Email inbox enrichment (assess June 1 when Kabir's layer is ready)
- Public API (all access is authenticated)

---

*CLAUDE.md · AlleyCorp Relationship Intelligence Platform · Demo Day June 24, 2026*
