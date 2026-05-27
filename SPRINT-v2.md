# Sprint Plan v2.0 — AlleyCorp Relationship Intelligence Platform

**Updated:** May 26, 2026 · **Demo Day:** June 24, 2026
**Team:** Luba · Michael · Yaasameen

**Change from v1.1:** Full replan based on current repo state. MCP server, 4-layer security, warmth scoring, and acceptance test suite are complete (Yaasameen, ahead of schedule). Database is now the critical path — everything else is blocked until Railway is provisioned and Luba's schema is live.

---

## What Is Already Done

| Component | Status | Owner |
|---|---|---|
| MCP server (`mcp/server.ts`) + 4 tool handlers | Complete | Yaasameen |
| 4-layer security (allowlist, tokens, network, sandbox) | Complete | Yaasameen |
| Acceptance test suite — 5 Demo Day prompts (`scripts/acceptance-test.ts`) | Complete | Yaasameen |
| `lib/types.ts` — all entity + view model types | Complete | Yaasameen |
| `lib/scoring.ts` — deterministic warmth engine | Complete | Yaasameen |
| `.env.example`, `middleware.ts`, `package.json` | Complete | Yaasameen |

## What Is Not Done (as of May 26)

| Component | Status | Blocked By |
|---|---|---|
| `lib/db.ts` — all 4 SQL functions | Stubs — throw on call | Railway not provisioned |
| PostgreSQL schema + migrations | Not started | Luba |
| Data seeding (Lux Capital, anchors, 20 companies) | Not started | Luba |
| Frontend — `app/page.tsx`, all API routes | Empty scaffolds / 501 stubs | Michael |
| Daily digest + Resend | Not started | Yaasameen |
| Acceptance tests passing | Blocked | DB stubs |

---

## Roles

- **Yaasameen** — Backend, MCP server, DB query wiring, digest, acceptance tests
- **Luba** — Database schema, migrations, data seeding, SQL query definitions
- **Michael** — Frontend (Next.js pages, API routes, investor list, profile card)

---

## Transition Period — May 26–27

**Goal:** Unblock the database dependency before Week 2 begins. No feature work until these are done.

### Yaasameen
- Generate `MCP_TOKEN_SECRET` and share with Luba + Michael via secure channel (1Password or encrypted DM — never Slack, never repo):
  ```
  openssl rand -hex 32
  ```
- Fix MCP server startup-crash: change import in `mcp/server.ts` from barrel `./security/index.js` to direct `./security/allowlist.js` — the barrel loads `tokens.ts` which throws at module load if `MCP_TOKEN_SECRET` is missing

### Luba
- Finalize schema design for 5 tables: `funds`, `investors`, `portfolio_companies`, `relationships`, `signals`
- Schema field names must match `lib/types.ts` exactly
- WarmthTier column uses title case values: `Hot`, `Warm`, `Stale`, `Cold`

### Kabir (external dependency)
- Provision Railway PostgreSQL
- Post `DATABASE_URL` to team via secure channel

### All
- Create local `.env` from `.env.example` once secrets are shared
- `mkdir data` in repo root (MCP Layer 4 sandbox directory — required for server startup)

---

## Week 2 — May 27–30 · Database + First Vertical Slice + Frontend Scaffold

**Goal:** Lux Capital end-to-end by May 30. All 4 warmth tiers in DB. Frontend scaffold live.

### May 27–28 · Schema + Seeding / SQL Wiring / Layout

**Luba**
- Write and run Postgres migrations for 5 tables on Railway
- Seed Hot anchors: Riot Ventures, Snowpoint Ventures, General Catalyst, Mach33
- Seed first vertical slice — Lux Capital (Stale) + Viam:
  - Co-investment: Inductive Bio Seed round, AlleyCorp did not return at Series A
  - `last_signal_date` must be >180 days ago so `lib/scoring.ts` classifies as Stale
- Seed Warm example: USV (Albert Wenger) + Viam
- Seed Cold targets: a16z American Dynamism, Eclipse, Founders Fund — no relationship row; search returns them as unfamiliar funds
- Seed all 20 active Deep Tech portfolio companies

**Yaasameen** (once DATABASE_URL is live)
- Wire all 4 SQL query stubs in `lib/db.ts`:
  - `getInvestorByName(name)` → `SELECT relationships JOIN funds WHERE funds.name ILIKE $1 LIMIT 1`
  - `searchRelationships(query)` → full-text search across `funds.name`, `portfolio_companies.name`, `warmth_tier`
  - `listStaleRelationships()` → `SELECT relationships WHERE warmth_tier = 'Stale' ORDER BY last_signal_date ASC`
  - `getWarmthSignals(investorId)` → `SELECT signals WHERE relationship_id = $1 ORDER BY date DESC`
- Confirm `npm run mcp` starts without errors

**Michael**
- Wire `app/layout.tsx` — Sentry, Inter font, global styles
- Scaffold `app/page.tsx` investor list view (placeholder data while DB comes online is fine)
- Investor list: fund name + warmth tier pill visible without clicking

### May 29–30 · Integration + Acceptance Tests / Frontend Tier Views

**Yaasameen**
- Run `npm run test:acceptance` — iterate until all 5 prompts pass under 5 seconds
- Verify inconsistency check: MCP response for Lux Capital must match what digest will output (same warmth tier, same reason text)
- If Claude picks wrong tools: update tool descriptions in `mcp/tools/*.ts` to fix routing

**Michael**
- Warmth tier filter pills (Hot / Warm / Stale / Cold toggle)
- Investor profile card: fund name, warmth tier, co-investment history, last signal date, suggested action
- All 4 warmth tiers visible with real data by end of May 30

---

## June 1 — Midpoint Gate

All of the following must be true before Week 3 begins:

- [ ] Lux Capital in DB → `listStaleRelationships()` returns it → profile card renders correctly
- [ ] All 4 warmth tiers present in DB with real data
- [ ] All 5 acceptance tests pass locally: `npm run test:acceptance` → 5/5
- [ ] MCP and digest return the same warmth tier and reason for Lux Capital

**Email enrichment** (Kabir): Available June 1. Team assesses integration fit at this point. Do not build toward it before then.

---

## Week 3 — June 2–6 · Digest + Full Network + API Routes

**Goal:** Daily digest live. Full 20-company network on dashboard. Search and filter working end-to-end.

### June 2–3 · Digest / Full Network

**Yaasameen**
- Create `lib/digest.ts` — generates `DigestItem[]` from stale relationships
- Wire Resend API: send digest email to configured recipient
- Digest item for Lux Capital must match acceptance test #5 output exactly (same tier, same reason)

**Michael**
- Expand dashboard to all 20 portfolio companies
- Search working across fund name, company name, warmth tier
- Filter by tier working end-to-end with real data

### June 4–6 · API Routes + Deep-Link Integration

**Yaasameen**
- Implement `GET /api/alerts` — returns stale relationships for frontend polling
- Implement `GET /api/events` — returns recent signals

**Michael**
- Wire frontend to real API routes (replace any placeholder data)
- Deep-link from digest email → investor profile card (authenticated)

**Luba**
- Complete co-investor research for all 20 companies (Crunchbase, press — fund name, round, date, role)
- Seed into DB
- Final data QA: confirm Stale and Cold data matches acceptance test expectations exactly

---

## Week 4 — June 9–13 · Hardening + Demo Rehearsal Prep

**Goal:** No crashes. 5/5 acceptance tests pass clean. Demo script rehearsed.

### June 9–10 · Bug Fix Sprint (All)
- Fix any acceptance test failures from Week 3 integration
- Fix any UI bugs found during full 20-company render
- Confirm `recalibrateAll()` in `lib/scoring.ts` runs against real DB without error

### June 11–13 · QA + Polish (All)
- Run `npm run test:acceptance` → 5/5 required before moving to Demo Prep week
- Walk through Demo Day script: Abe POV — network view → stale alert → Lux Capital profile → MCP query
- UI polish: tier pill colors, spacing, empty states
- Optional cleanup: implement `lib/env.ts` (`isDev()`) and `lib/trace.ts` (AsyncLocalStorage trace ID)

---

## Demo Day Prep — June 16–24

| Days | Task |
|---|---|
| June 16–17 | Final acceptance test run. Any failure is a blocker — fix before proceeding. |
| June 18–19 | Demo rehearsal with Kabir. Abe scenario end-to-end. Time the full run. |
| June 20 | Feature freeze. Emergency fixes only from this point forward. |
| June 21–23 | Final dry runs. Confirm all 5 MCP queries return correct results live. |
| June 24 | **Demo Day** |

---

## Acceptance Test Reference

Run: `npm run test:acceptance` — all 5 must pass before Demo Day.

| # | User Prompt | Expected Tool | Pass Criteria |
|---|---|---|---|
| 1 | Which co-investors should we reconnect with before they lead another round without us? | `list_stale_relationships()` | Returns Lux Capital with Inductive Bio reason and suggested action. Under 5 seconds. |
| 2 | Who are our warmest relationships in deep tech right now? | `search_relationships(query)` | All four Hot anchors with signal evidence. No hallucinated funds. |
| 3 | What should I know before our meeting with General Catalyst next week? | `get_investor(name)` + `get_warmth_signals(investor_id)` | Co-investment history, Hot tier, recent signals. Readable, not a raw dump. |
| 4 | Are there any top deep tech funds we haven't co-invested with yet? | `search_relationships(query)` | Cold tier targets: a16z American Dynamism, Eclipse, Founders Fund. |
| 5 | Show me the full picture on Lux Capital. | `get_investor(name)` + `get_warmth_signals(investor_id)` | Stale tier, Inductive Bio history, reason, action. Matches digest entry — no inconsistency. |

**Inconsistency rule:** MCP and digest must return the same warmth tier and reason for Lux Capital. Any divergence means a shared code path has split — fix `lib/scoring.ts`, not the outputs individually.

---

## Critical Files This Sprint

| File | Owner | Work |
|---|---|---|
| `lib/db.ts` | Yaasameen | Wire all 4 SQL queries to Luba's schema |
| `mcp/server.ts` | Yaasameen | Fix barrel import → direct import from `allowlist.js` |
| `lib/digest.ts` | Yaasameen | Create: generates `DigestItem[]` from stale relationships |
| `app/page.tsx` | Michael | Investor list view with warmth tier pills |
| `app/layout.tsx` | Michael | Sentry, fonts, global styles |
| `app/api/alerts/route.ts` | Yaasameen | Implement GET handler |
| `app/api/events/route.ts` | Yaasameen | Implement GET handler |
| DB migrations (new files) | Luba | 5 tables matching `lib/types.ts` |

---

## Scope Lock

**Building:** Co-investor relationship intelligence · Deterministic warmth scoring · Stale detection · Cold tier targets · Daily email digest with authenticated deep-links · MCP natural language query layer · Full 20-company Deep Tech network · 5-prompt end-to-end acceptance test suite

**Not building:** AI agents · General copilot · Custom NLP pipeline · CRM features · Healthcare/General team views (data model supports it, not built this sprint) · Email inbox enrichment (assess June 1)

---

*Sprint Plan v2.0 · May 26, 2026 · Luba, Michael, Yaasameen*
