# Sprint Plan v2.0 — AlleyCorp Relationship Intelligence Platform

**Updated:** June 3, 2026 · **Demo Day:** June 24, 2026
**Team:** Luba · Michael · Yaasameen

**Change from v1.1:** Full replan based on current repo state. MCP server, 4-layer security, warmth scoring, and acceptance test suite are complete (Yaasameen, ahead of schedule). Database is now the critical path — everything else is blocked until Neon is provisioned and Luba's schema is live.

**June 1 update:** Midpoint gate cleared. DB schema live locally, all 4 warmth tiers seeded, 5/5 acceptance tests passing. Critical path now moves to Neon provisioning + frontend wire-up.

**June 6 update:** Railway (not Neon) provisioned and live. Frontend fully wired to real DB. All API routes implemented. 5/5 acceptance tests passing on Railway. Remaining work: co-investor research for all 17 companies + data QA before June 11 office visit.

**⚠️ New constraint:** AlleyCorp office visit June 11. Need working product with real data by June 10. Weeks 3–4 replanned accordingly.

---

## What Is Already Done

| Component | Status | Owner |
|---|---|---|
| MCP server (`mcp/server.ts`) + 4 tool handlers | ✅ Complete | Yaasameen |
| 4-layer security (allowlist, tokens, network, sandbox) | ✅ Complete | Yaasameen |
| Acceptance test suite — 5 Demo Day prompts (`scripts/acceptance-test.ts`) | ✅ Complete | Yaasameen |
| `lib/types.ts` — all entity + view model types | ✅ Complete | Yaasameen |
| `lib/scoring.ts` — warmth engine, confidence mapping | ✅ Complete | Yaasameen |
| `lib/db.ts` — all SQL query functions, Railway pool config | ✅ Complete | Yaasameen + Luba |
| `lib/digest.ts` — generates `DigestItem[]` from stale relationships | ✅ Complete | Yaasameen |
| `lib/mailer.ts` — Resend send, HTML email template | ✅ Complete | Yaasameen |
| `GET /api/alerts` — stale relationships endpoint | ✅ Complete | Luba / Yaasameen |
| `GET /api/events` — recent signals endpoint | ✅ Complete | Yaasameen |
| `POST /api/digest` — bearer-gated cron trigger | ✅ Complete | Yaasameen |
| `next.config.ts` — `serverExternalPackages: ["pg"]` Railway build fix | ✅ Complete | Luba |
| `.env.example`, `middleware.ts`, `package.json` | ✅ Complete | Yaasameen |
| PostgreSQL schema (`seed.sql`) — 5 tables | ✅ Complete | Luba |
| Data seeding — all 4 warmth tiers, 17 active + 3 alumni companies | ✅ Complete | Luba |
| Hot anchors: Riot, Snowpoint, General Catalyst, Mach33, SOSV | ✅ Complete | Luba |
| Cold targets: a16z American Dynamism, Eclipse, Founders Fund | ✅ Complete | Luba |
| Frontend scaffold — investor list, warmth tier pills | ✅ Complete | Michael |
| Full frontend integration (all story components wired) | ✅ Complete | Michael + Luba |
| Desktop scroll, pg build error, profile panel fixes | ✅ Complete | Luba |

## Status as of June 6

| Component | Status | Owner |
|---|---|---|
| Railway PostgreSQL (replaced Neon) | ✅ Live | Luba |
| Frontend wired to real DB (`GET /api/investors`) | ✅ Done | Luba |
| 5/5 acceptance tests passing on Railway | ✅ Done | Luba + Yaasameen |
| Portfolio companies match Lauren's confirmed list | ✅ Verified June 6 | Luba |
| Full co-investor research (all 17 companies) | 🔄 In progress | Luba |
| Final data QA vs acceptance tests | 🔄 In progress | Luba |
| Resend email (digest send) | ⏳ Not started | Yaasameen |

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
- Provision Neon PostgreSQL
- Post `DATABASE_URL` to team via secure channel

### All
- Create local `.env` from `.env.example` once secrets are shared
- `mkdir data` in repo root (MCP Layer 4 sandbox directory — required for server startup)

---

## Week 2 — May 27–30 · Database + First Vertical Slice + Frontend Scaffold

**Goal:** All 4 warmth tiers in DB by May 30. Frontend scaffold live. ✅ Both done.

### May 27–28 · Schema + Seeding / SQL Wiring / Layout

**Luba**
- Write and run Postgres migrations for 5 tables on Neon
- Seed Hot anchors: Riot Ventures, Snowpoint Ventures, General Catalyst, Mach33
- Seed stale examples: SineWave+Aon3D, Trimble+CivRobotics, BOLD+EarthForce ✅
- Seed warm-at-risk: Flybridge+HaloBraid, Cherubic+CargoRobotics ✅
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
- Verify inconsistency check: MCP response for Trimble Ventures must match what digest will output (same warmth tier, same reason)
- If Claude picks wrong tools: update tool descriptions in `mcp/tools/*.ts` to fix routing

**Michael**
- Warmth tier filter pills (Hot / Warm / Stale / Cold toggle)
- Investor profile card: fund name, warmth tier, co-investment history, last signal date, suggested action
- All 4 warmth tiers visible with real data by end of May 30

---

## June 1 — Midpoint Gate ✅ CLEARED

- [x] Stale co-investors in DB → `listStaleRelationships()` returns SineWave, Trimble, BOLD
- [x] All 4 warmth tiers present in DB with real data (Lauren Young's confirmed portfolio)
- [x] All 5 acceptance tests pass: `npm run test:acceptance` → 5/5
- [ ] Digest consistency check — `lib/digest.ts` not built yet (Week 3, Yaasameen)

**Email enrichment** (Kabir): Assess integration fit now. Do not build before confirming data format.

---

## Week 3 — June 2–6 · Neon + Real Data + Core UI Features

**Goal:** Real data on the dashboard by June 6. Alerts, email drafts, and MCP chatbot UI built. Everything wired end-to-end before the office visit.

### June 2–3 · Neon + API Routes

**Luba**
- Provision Neon PostgreSQL (free tier)
- Run `seed.sql` against Neon — confirm all tiers present
- Import DTNY event signals (`luba/swoogo-signals` branch) — 6 co-investor attendees, Jan 28 2026
- Share `DATABASE_URL` with Michael and Yaasameen via secure channel
- Implement `GET /api/investors` — wire `app/data/investors.ts` seam to real DB

**Yaasameen**
- Implement `GET /api/alerts` — returns stale + warm-at-risk relationships
- Implement `GET /api/events` — returns recent signals

### June 4–6 · Frontend Features

**Yaasameen**
- Implement `POST /api/chat` — proxies natural language queries from the chatbot UI to the MCP server, returns readable text response
- This is the backend Michael's chatbot UI connects to — must be live before Michael can wire the frontend

**Michael**
- Wire dashboard to real data via `GET /api/investors` (3-line change in `investors.ts`)
- Stale alerts banner — top of dashboard, sorted by severity, links to profile
- Investor profile — email draft section (subject + body, tier-aware, editable, copy button)
- MCP chatbot interface — query input on dashboard, inline readable response (connects to `POST /api/chat`)

---

## June 9–10 · Integration + Office Visit Prep

**Goal:** Everything working together on Neon data. Good enough to show AlleyCorp on June 11.

### All
- End-to-end smoke test: dashboard loads real data → click stale alert → profile opens → MCP query works
- Fix any integration bugs from Week 3
- Run `npm run test:acceptance` → must be 5/5 on Neon DB

### Luba
- Co-investor research for highest-priority companies (focus on stale + hot relationships)
- Data QA: confirm what's shown on screen matches acceptance test expectations

### Demo script (casual — June 11)
1. Open dashboard → real investor list with warmth tiers
2. Point to alerts banner → "these are the relationships at risk"
3. Click Trimble Ventures → profile with signals + email draft
4. Type MCP query → "Who are our warmest deep tech relationships?" → live response

---

## June 11 · AlleyCorp Office Visit
Casual check-in. Show working product with real data. Not a formal demo — no polish required.

---

## June 12–13 · Post-Visit Fixes + Digest

**Goal:** Address any feedback from the office visit. Build digest.

**Yaasameen**
- Create `lib/digest.ts` — generates `DigestItem[]` from stale relationships
- Wire Resend API: send digest email to configured recipient
- Digest item for Trimble Ventures must match acceptance test #5 output exactly

**Michael**
- Address any UI feedback from June 11
- Portfolio Explorer page — companies, co-investor count, sector filter
- Digest view (`/digest`) — read-only, "Send Digest Email" button

---

## June 16–24 · QA + Demo Day Prep

| Days | Task |
|---|---|
| June 16–17 | Full QA pass. Fix any bugs from post-visit feedback. UI polish: tier pill colors, spacing, empty states. |
| June 16–17 | Final acceptance test run — 5/5 required before proceeding. |
| June 18–19 | Demo rehearsal with Kabir. Abe scenario end-to-end. Time the full run. |
| June 20 | Feature freeze. Emergency fixes only. |
| June 21–23 | Final dry runs. Confirm all 5 MCP queries return correct results live on Neon. |
| June 24 | **Demo Day** |

---

## Acceptance Test Reference

Run: `npm run test:acceptance` — all 5 must pass before Demo Day.

| # | User Prompt | Expected Tool | Pass Criteria | Status |
|---|---|---|---|---|
| 1 | Which co-investors should we reconnect with before they lead another round without us? | `list_stale_relationships()` | Returns stale funds (SineWave, Trimble, BOLD) with portfolio company and suggested action. | ✅ Pass |
| 2 | Who are our warmest relationships in deep tech right now? | `search_relationships(query)` | Hot anchors including Riot Ventures, General Catalyst, Mach33. No hallucinated funds. | ✅ Pass |
| 3 | What should I know before our meeting with General Catalyst next week? | `get_investor(name)` + `get_warmth_signals(investor_id)` | Co-investment history, Hot tier, recent signals. Readable, not a raw dump. | ✅ Pass |
| 4 | Are there any top deep tech funds we haven't co-invested with yet? | `search_relationships(query)` | Cold tier targets: a16z American Dynamism, Eclipse, Founders Fund. | ✅ Pass |
| 5 | Show me the full picture on Trimble Ventures. | `get_investor(name)` + `get_warmth_signals(investor_id)` | Stale tier, Civ Robotics co-investment history, reason for going stale, suggested action. | ✅ Pass |

**Inconsistency rule:** MCP and digest must return the same warmth tier and reason for Trimble Ventures. Any divergence means a shared code path has split — fix `lib/scoring.ts`, not the outputs individually.

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

**Not building (this sprint):** General copilot · Custom NLP pipeline · CRM features · Healthcare/General team views (data model supports it, not built this sprint) · Email inbox enrichment (assess June 1)

---

## Proposal — Multi-Agent Orchestration Layer

**Status: Awaiting team approval · Author: Yaasameen · June 3, 2026**

This is an additive layer on top of the current build. It does not change the warmth scoring model, existing MCP tools, DB schema, or Demo Day acceptance tests.

### Architecture

Three specialized agents sit behind a single orchestrator. The orchestrator receives any request and routes it to the right specialist. Agents can be chained.

```
User / Cron / API
       │
  ┌────▼──────────────────────────────────┐
  │          ORCHESTRATOR AGENT           │
  │  Determines intent, routes, chains    │
  └────┬──────────────┬──────────┬────────┘
       │              │          │
  ┌────▼─────┐  ┌─────▼────┐  ┌─▼──────────┐
  │ Agent 1  │  │ Agent 2  │  │  Agent 3   │
  │ Enrich   │  │  Brief   │  │  Chatbot   │
  └──────────┘  └──────────┘  └────────────┘
```

---

### Agent 1 — Data Aggregation + Enrichment (Bronze → Silver → Gold)

Agent 1 owns the full data pipeline. It is the only agent that writes to the database. Agents 2 and 3 consume the output — they never touch raw data directly.

**Three data layers:**

| Layer | What it contains | Who produces it |
|---|---|---|
| Bronze | Raw exports as-is — Swoogo CSVs, Luma CSVs, news feeds, LinkedIn exports, Crunchbase data | Source systems |
| Silver | Normalized, typed signals in the `signals` table — consistent `type`, `source`, `value`, `confidence`, `date` | Agent 1 (ingest + enrich) |
| Gold | Scored, business-ready relationships — `warmth_tier` updated on every `relationships` row | Agent 1 (triggers `recalibrateAll()`) |

**Pipeline steps:**

1. **Ingest (Bronze → Silver):** Accept raw exports — Swoogo/Luma CSVs, news feeds, LinkedIn exports, Crunchbase dumps. Parse and normalize each row into the `signals` table format.
2. **Enrich (Silver enrichment):** For sparse contacts (email only), fill in full name, company, job title, LinkedIn so signals can be linked to `funds` and `relationships` records.
   - Tier 1 — Email domain parsing (free, instant): `wmccreadie@generalcatalyst.com` → General Catalyst
   - Tier 2 — Notes extraction (Claude, no web search): parses existing contact notes into structured fields
   - Tier 3 — Claude + web search (Serper.dev, ~$0.001/call): for personal emails only. Returns blank if not found — never fabricates.
3. **Score (Silver → Gold):** After new signals land, call `recalibrateAll()` from `lib/scoring.ts`. This re-scores every relationship and writes updated `warmth_tier` to the `relationships` table. This is the moment raw data becomes actionable intelligence.

**Output consumed by:**
- Agent 2 reads gold layer (`relationships` + `signals`) to generate briefs
- Agent 3 reads gold layer to answer natural language questions
- Daily digest reads gold layer to surface stale alerts

**New files:** `lib/enrichment.ts`, `scripts/enrich-contacts.ts`, `app/api/ingest/route.ts`

**Reused:** `recalibrateAll()` — `lib/scoring.ts:95` (already written, just needs to be called at end of ingest)

**Can start Tier 1 + Tier 2 immediately — no new API keys or approvals needed.**

---

### Agent 2 — Company Brief Creator

Given any company or fund name, generates a structured intelligence brief combining AlleyCorp DB data and web research.

**Brief includes:** Relationship to AlleyCorp (warmth tier, co-investment history), key people, recent funding, sector context, suggested action.

**Data sources:** Existing MCP tools (`get_investor`, `get_warmth_signals`) + Serper.dev web search

**Exposed as an MCP tool** (`generate_brief`) so Agent 3 can call it mid-conversation.

**New files:** `lib/brief-agent.ts`, `app/api/brief/route.ts`, `mcp/tools/generate-brief.ts`

---

### Agent 3 — Chatbot (Extended)

The existing MCP server and 4 tools are unchanged. This agent gains one new capability: it can call `generate_brief` mid-conversation when a user asks for a full company profile.

**New files:** Update `mcp/tools/`, `mcp/server.ts`, `mcp/security/allowlist.ts` to register `generate_brief`

---

### Orchestrator

Single entry point for all agent requests. Detects intent and routes — or chains agents for multi-step workflows.

| Request | Route |
|---|---|
| "Who should we reconnect with?" | → Agent 3 (chatbot) |
| "Generate a brief on General Catalyst" | → Agent 2 (brief) |
| "Enrich this contact list" | → Agent 1 (enrichment) |
| "Enrich these contacts then brief their companies" | → Agent 1 → Agent 2 |

**New files:** `lib/orchestrator.ts`, `app/api/orchestrate/route.ts`

---

### Build Order

1. Agent 1 — no new dependencies, can start Tier 1 + 2 now
2. Agent 2 — needs DB live (Luba) + Serper.dev key approval
3. Agent 3 extension — after Agent 2 `generate_brief` tool is built
4. Orchestrator — after all three agents are individually tested

---

### Estimated Cost Per Run

| Step | Cost |
|---|---|
| Tier 1 domain parsing | Free |
| Tier 2 notes extraction (Claude) | ~$0.01 total |
| Tier 3 web search (~500 personal emails) | ~$0.60 total |
| Company briefs (on-demand) | ~$0.02 per brief |

---

### Open Questions — Team Must Approve Before Build

| # | Question | Owner |
|---|---|---|
| 1 | Is web searching personal email addresses within AlleyCorp's data use policy? | Kabir |
| 2 | Serper.dev API key — shared Railway variable or Yaasameen provisions independently? | Kabir |
| 3 | Who reviews enriched contacts before they enter the DB? | Lauren |
| 4 | Does Abe or Brannon have a fund brief template to mirror for Agent 2? | Abe / Brannon |
| 5 | Should generated briefs be stored in the DB or produced on-demand each time? | Team |
| 6 | Does the orchestrator become the new front door, or does the MCP server stay standalone? | Kabir |

---

*Sprint Plan v2.0 · May 26, 2026 · Luba, Michael, Yaasameen*
