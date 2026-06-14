# Sprint Plan: June 12–16 (Post-Thursday Feedback Sprint)

> **Superseded:** This plan was replaced after the June 11 AlleyCorp meeting direction change. Use [SPRINT-june14-17.md](./SPRINT-june14-17.md) as the current sprint plan. Keep this file as historical context only.

**Goal:** Incorporate Thursday partner feedback, harden the agent pipeline, and close the remaining UI/data gaps before Demo Day (June 24).  
**Starts:** Friday June 13 (day after Thursday meeting)  
**Ends:** Monday June 16 EOD

---

## Thursday Feedback — Add Here After Meeting

> Fill this in after the June 12 partner meeting. Capture every request,
> concern, or "what if it could also..." comment. Prioritize before sprint starts.

| Feedback | Priority | Owner |
| -------- | -------- | ----- |
| _TBD_    |          |       |
| _TBD_    |          |       |
| _TBD_    |          |       |

---

## 1. Signal Pipeline — Source URL Wiring

**Owner:** Luba  
**Why:** `ingest-signals.ts` writes `source_url` but the schema is missing 3 columns it expects. URL links in the drawer currently point to the Substack homepage as a placeholder. After this, every agent-discovered signal links directly to the article.

**Tasks:**

- [ ] Add 3 columns to `schema.sql`:
  ```sql
  ALTER TABLE signal ADD COLUMN IF NOT EXISTS source_title  TEXT;
  ALTER TABLE signal ADD COLUMN IF NOT EXISTS raw_snippet   TEXT;
  ALTER TABLE signal ADD COLUMN IF NOT EXISTS unique_hash   TEXT UNIQUE;
  ```
- [ ] Run migration on Railway
- [ ] Fix `writeSignal()` in `scripts/ingest-signals.ts` — `source` param is currently receiving `sourceUrl` instead of the source name (e.g. "TechCrunch")
- [ ] Dry run: `npm run ingest:signals` — verify output, no errors
- [ ] Live run: `npm run ingest:signals -- --write`
- [ ] Check DB: `SELECT source, source_url FROM signal WHERE source_url IS NOT NULL LIMIT 20`
- [ ] Research and add real article URLs for every signal in `seed.sql` — full list below. Replace the `https://alleycorp.substack.com` homepage placeholder with specific post links. For Crunchbase signals, use the company profile URL (e.g. `https://www.crunchbase.com/organization/valar-atomics`).

  | Fund                       | Company                                | Source             | URL status                 |
  | -------------------------- | -------------------------------------- | ------------------ | -------------------------- |
  | Snowpoint Ventures         | Valar Atomics Series A $130M Nov 2025  | AlleyCorp Substack | ❌ needs specific post URL |
  | Day One Ventures           | Valar Atomics Series A $130M Nov 2025  | AlleyCorp Substack | ❌ needs specific post URL |
  | ff Venture Capital         | Civ Robotics Series A Jul 2025         | AlleyCorp Substack | ❌ needs specific post URL |
  | Geodesic Capital           | Portal Space Systems Series A Apr 2026 | AlleyCorp Substack | ❌ needs specific post URL |
  | Mach33                     | Portal Space Systems Series A Apr 2026 | AlleyCorp Substack | ❌ needs specific post URL |
  | SOSV                       | Renovate Robotics Pre-Seed Feb 2023    | AlleyCorp Substack | ❌ needs specific post URL |
  | Riot Ventures              | Valar Atomics Seed Mar 2025            | Crunchbase         | ❌ needs company URL       |
  | Mach33                     | Portal Space Systems Seed Apr 2025     | Crunchbase         | ❌ needs company URL       |
  | Flybridge                  | Halo Braid Seed Jun 2024               | Crunchbase         | ❌ needs company URL       |
  | Cherubic Ventures          | Cargo Robotics Seed Oct 2024           | Crunchbase         | ❌ needs company URL       |
  | Trimble Ventures           | Civ Robotics Seed Sep 2022             | Converge VC        | ❌ needs article URL       |
  | General Catalyst           | Eyebot Seed Jun 2024                   | PRWeb              | ❌ needs press release URL |
  | General Catalyst           | Eyebot Series A $20M Aug 2025          | TechCrunch         | ❌ needs article URL       |
  | Ubiquity Ventures          | Eyebot Seed Jun 2024                   | PRWeb              | ❌ needs press release URL |
  | Ubiquity Ventures          | Eyebot Series A Aug 2025               | TechCrunch         | ❌ needs article URL       |
  | NEA                        | Glacier Seed $4.5M Apr 2022            | TechCrunch         | ❌ needs article URL       |
  | NEA                        | Glacier Seed Extension $7.7M Mar 2024  | Waste Dive         | ❌ needs article URL       |
  | NEA                        | Glacier Series A $16M Apr 2025         | TechCrunch         | ❌ needs article URL       |
  | Amazon Climate Pledge Fund | Glacier Seed Extension Mar 2024        | Waste Dive         | ❌ needs article URL       |
  | Amazon Climate Pledge Fund | Glacier Series A Apr 2025              | TechCrunch         | ❌ needs article URL       |
  | SOSV                       | Renovate Robotics Seed Aug 2025        | Tracxn / PitchBook | ❌ needs article URL       |
  | BOLD Capital Partners      | Earth Force Seed Nov 2022              | GlobeNewswire      | ❌ needs press release URL |
  | SineWave Ventures          | Aon 3D Series A Sep 2021               | TechCrunch         | ❌ needs article URL       |

  Once URLs are confirmed, update the `source_url` column in seed.sql and run `UPDATE signal SET source_url = '...' WHERE ...` directly on Railway for immediate effect.

---

## 2. Portfolio Co-Investor Discovery Agent (NEW — most important gap)

**Owner:** Luba (data layer) / Yaasameen (agent) / Kabir (data source)  
**Why:** The entire system currently depends on Luba manually researching co-investors for each portfolio company. Avatar Robotics had two real co-investors (Defy Partners, REFASHIOND Ventures — $6.01M seed, Jan 2026) that the existing agent never found because it only enriches _known_ relationships. It doesn't discover new ones.

Lauren's portfolio list also changes over time. New companies get added, companies exit. There's no automated way to pick that up today.

**The gap in plain terms:**

- Current flow: Luba manually seeds company → manually finds co-investors → agent adds more signals
- Needed flow: Portfolio list changes → agent finds co-investors → relationships appear automatically

**What this agent does differently:**

- Starts from a **portfolio company**, not a fund
- Asks "who co-invested in Company X?" instead of "tell me more about Fund X"
- Outputs new `fund` rows + `relationship` rows, not just signals

**Key question for Kabir (raise Thursday):**
What data source do we use? Options ranked by reliability:

1. Crunchbase API — most complete, has co-investor data per round, costs money
2. AlleyCorp cap table / internal records — most accurate for early/stealth rounds, requires Lauren to export
3. Web scraping — inconsistent, misses stealth rounds (Avatar almost wasn't findable)

**Tasks (design only this sprint — build after Thursday answer):**

- [ ] Confirm data source with Kabir/Lauren on Thursday
- [ ] Design `scripts/discover-portfolio-coinvestors.ts` — takes a company name, returns co-investors with round details
- [ ] Define how it handles companies with no public data (stealth rounds)
- [ ] Wire into the same Critic + upsert pipeline as the enrichment agent

---

## 3. Agent Architecture — Critic + Orchestrator

**Owner:** Yaasameen (lead) / Luba (data layer)  
**Why:** Right now the discovery agent writes signals directly. PRD calls for a Critic layer to validate candidates before they hit the DB, and an Orchestrator to schedule runs based on DB state.

### 2a. Critic Agent

Reviews `DiscoverySignalCandidate[]` output from the discovery agent before any DB write. Rejects duplicates, low-confidence signals without corroboration, and fund names that don't fuzzy-match known funds.

- [ ] `scripts/critic-agent.ts` — input: `DiscoverySignalCandidate[]`, output: same array with `rejected: boolean` + `rejectionReason?: string`
- [ ] Rejection rules:
  - Fund name doesn't match any fund in DB (fuzzy threshold < 80%)
  - `confidence === "pending"` with no corroborating signal
  - Signal date is in the future
  - Exact duplicate (same fund + company + type + date already in DB)
- [ ] Plug into `discovery-agent.ts` — run candidates through critic before `upsertSignal`
- [ ] Add critic summary to dry-run output

### 2b. Orchestrator

Decides what to run and when. Reads DB state to prioritize which relationships need new signals most urgently.

- [ ] `scripts/orchestrator.ts` — queries DB for relationships where `last_signal_date` is oldest or NULL
- [ ] Builds a prioritized target list (stale first, then cold, then warm approaching stale)
- [ ] Passes list to discovery agent instead of hardcoded TARGETS array in `ingest-signals.ts`
- [ ] Dry-run mode prints the plan without running anything

---

## 3. UI — Post-Thursday Improvements

**Owner:** Michael (lead) / Luba  
**Why:** Thursday will surface UX gaps. These are the ones we already know about.

- [ ] **Signal evidence grouping** — in ProfileDrawer, group signals by portfolio company instead of flat chronological list
- [ ] **Source URL links** — once pipeline fix lands (item 1), verify all signal rows in drawer show clickable links
- [ ] **Empty states** — Cold funds with `discoveryContext` show "Network Target" — verify the expansion path copy reads well with real data
- [ ] _Add Thursday feedback items here_

---

## 4. Data Quality

**Owner:** Luba  
**Why:** Lauren will fact-check live. Any wrong fund name, wrong date, or wrong round size is a credibility hit.

- [ ] Run `npm run recalibrate` and verify warmth tiers match what Lauren expects
- [ ] Audit Stale funds — confirm all 4 stale relationships have a plausible re-engagement path in `suggestedAction`
- [ ] Verify DTNY event signals are correct — cross-check `seed-dtny-signals.sql` against `data/DTNY Registration.xlsx`
- [ ] Fix DTNY-only funds with arbitrary portfolio company linkage — a16z American Dynamism, Eclipse, USV, BOLD, ff VC all have event signals attached to a randomly-picked portfolio company row (schema forces every relationship to have a portfolio_company_id). Options: (a) make portfolio_company_id nullable for event-only relationships, or (b) only seed a relationship once a real co-investment exists and track DTNY attendance separately
- [ ] _Add any data corrections surfaced Thursday_

---

## 5. Agent Run — Post-Thursday Signal Sweep

**Owner:** Luba  
**Why:** Run the full discovery agent against Railway after the pipeline fixes land. New signals go live before Demo Day.

- [ ] `npm run ingest:signals` dry run — review output with Yaasameen
- [ ] `npm run ingest:signals -- --write` if dry run looks clean
- [ ] `npm run recalibrate` after new signals land — warmth tiers update automatically
- [ ] Spot-check 3–4 fund profiles in the UI to confirm source URLs populate correctly

---

## 6. Demo Day Hardening (June 24 prep)

**Owner:** All  
**Due:** End of sprint

- [ ] Run all 5 Demo Day prompts 10× against live Railway DB — every answer must be correct and under 5 seconds
- [ ] `npm run test:acceptance` — all 5 pass
- [ ] Rehearse Abe's script with real data in the drawer open — check that co-investment dates, signal counts, and fund names match what he'd expect to say out loud
- [ ] _Add any Demo Day script changes from Thursday feedback_

---

## Non-Goals This Sprint

- Email inbox enrichment (Kabir dependency, post-June 24)
- Healthcare / General team views
- Public API
- CRM features

---

## 7. Post-Demo Day — Schema v2 Design (June 25+)

**Why this matters now:** The current schema models `fund ↔ AlleyCorp portfolio company`. This works for direct co-investments but hits two walls as the agent gets smarter:

### Wall 1 — Event-only signals (partially fixed June 10)

A fund attends DTNY but has no co-investment with us yet. Fixed by making `portfolio_company_id` nullable on `relationship`. But the underlying question remains: should a signal even require a relationship? An event is fund-level, not company-specific.

### Wall 2 — 6 degrees of separation

To discover Fund A via "Fund B co-invested in Company X alongside Fund A", Company X is **not** in our portfolio. The current schema has nowhere to put it. `discovery_context JSONB` holds this as unstructured text today — good enough to display, not good enough to query or traverse.

### What Schema v2 would need

```
external_company
  id, name, website, sector, crunchbase_url

network_connection
  source_fund_id     -- fund we already know
  target_fund_id     -- fund being discovered
  via_company_id     -- external_company that links them (nullable)
  via_event_id       -- event that links them (nullable)
  discovery_depth    -- 1 = direct co-investor, 2 = one hop, etc.
  confidence         -- confirmed / inferred
```

This replaces the JSONB blob with real foreign keys the agent can traverse and the DB can index.

### Decision needed before building

- Does AlleyCorp want to run 6-degree graph queries, or is "we found them at DTNY / via a Substack post" enough for Demo Day and the months after?
- If yes to 6 degrees: schema v2 is a 2–3 day migration (new tables, seed external companies, update agent output format)
- If no: keep `discovery_context JSONB` and document its shape clearly so agents write consistent JSON

**Action:** Bring this question to Abe/Lauren on Thursday. Do not build until there is a clear answer.

---

## Definition of Done

- All 5 acceptance tests pass on Railway
- No TypeScript errors (`npm run typecheck`)
- No test regressions (`npm run test:run` — 47/47)
- At least one real agent run has written signals with populated `source_url` to Railway
- Thursday feedback items reviewed and either scheduled or explicitly deferred

---

_SPRINT-june12-16.md · AlleyCorp Relationship Intelligence Platform_
