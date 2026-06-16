# Sprint Plan: June 14-17, 2026

**Project:** AlleyCorp Relationship Intelligence Platform  
**Sprint goal:** Turn the MVP from a co-investor tracker into a trustworthy, dynamic deep tech investor intelligence platform, with Today Overview as the main "what changed / what matters today" experience.  
**Team:** Luba, Yaasameen, Michael  
**Build sprint:** Sunday June 14 - Wednesday June 17  
**Polish window:** Thursday June 18 - Demo Day

---

## 1. Direction Change From AlleyCorp

The June 11 meeting changed the product direction.

### Before

Track only co-investors in AlleyCorp portfolio companies.

### Now

Track the broader deep tech investor universe. Co-investors remain the highest-value nodes inside a larger market map. Confirmed anchor co-investors are VIP/starred; ordinary co-investors are known relationships but should not become VIP by code inference.

This means the product should answer:

- Who are all relevant deep tech investors?
- Which ones does AlleyCorp already know?
- Which ones are known co-investors, and which confirmed anchors are VIP relationships?
- Which new investors are entering deep tech?
- Who should Abe or Brannon invite, meet, monitor, or introduce to a portfolio company?

The north star is not an email digest or a static dashboard. It is a daily-updating investor map with traceable evidence behind every claim, surfaced through Today Overview.

---

## 2. Sprint Priorities

### P0 — Must Finish By June 17

| Priority | Workstream                                 | Owner               | Outcome                                                                                                                      |
| -------- | ------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| P0       | Today Overview centerpiece                 | Michael + Luba      | The main demo surface: what changed, what matters, and where Abe/Brannon should look today.                                  |
| P0       | Evidence-gated Daily Intelligence Pipeline | Yaasameen + Luba    | The system can discover investors, enrich profiles, monitor signals, and publish only high-confidence evidence.              |
| P0       | Source traceability                        | Luba                | Every published signal has source URL, title/snippet when available, date, signal type, and confidence.                      |
| P0       | Broader investor schema                    | Luba                | Investor/fund profiles support location, AUM/check-size proxy, stage, geography, deep tech signal, and VIP/co-investor flag. |
| P0       | Investor discovery/enrichment              | Luba + Yaasameen    | Discover and enrich deep tech investors beyond known co-investors; write only accepted source-backed market prospects.       |
| P0       | Obvious search + query readiness           | Michael + Yaasameen | Search is visible and chatbot can answer the three AlleyCorp query types from the meeting.                                   |
| P0       | Safety fixes from review                   | Yaasameen + Luba    | Warmth tier normalization, scheduled write guardrails, and minimum app auth before sharing externally.                       |

### P1 — Finish If P0 Is Stable

| Priority | Workstream                                 | Owner        | Outcome                                                                                      |
| -------- | ------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------- |
| P1       | Portal Space Systems co-investor expansion | Luba + Agent | Expand beyond Mach33 and Geodesic using public sources and mark verified evidence.           |
| P1       | Brannon podcast + Abe Substack sources     | Yaasameen    | Add these as monitored signal sources for the Daily Intelligence Pipeline.                   |
| P1       | Profile evidence grouping                  | Michael      | Group signals by portfolio company / source type so profiles are easier to verify.           |
| P1       | Latency tightening                         | Yaasameen    | Acceptance prompts trend closer to demo-safe timing; document any unavoidable target change. |

### P2 — Defer To Polish Or Post-Demo

- Full CRM-style outreach workflow
- Email digest sending as a primary experience
- Calendar/email integrations
- Healthcare and General team views
- Manual review queue for every discovery
- Full schema v2 graph migration for 6-degree traversal

---

## 3. Daily Intelligence Pipeline

Loop engineering is the right approach for this project, but only if the loop is designed as a product system, not as a prompt trick.

The platform needs autonomous intelligence gathering. Abe and Brannon should not manually approve every new signal. For this sprint, keep the verification gate simple and deterministic.

1. Discovery agents search every day.
2. A verification gate checks evidence quality.
3. A deterministic policy decides what is published.
4. Recalibration updates warmth tiers.
5. Today Overview shows what changed and why.
6. Logs/state make the loop auditable the next morning.

The key rule:

> Auto-publish high-confidence discoveries, quarantine weak ones, and make every published signal traceable.

This gives AlleyCorp the feeling of a live system without letting unverified agent output pollute the database.

### Daily Intelligence Pipeline

```text
portfolio companies + known funds + market watchlist
  -> investor discovery + profile enrichment + signal monitoring
  -> deterministic verification gate
  -> confidence policy
  -> write accepted profile facts + accepted relationship signals
  -> recalibrate warmth
  -> update Today Overview
  -> save run report
```

### Agent Architecture & Data Flow

The pipeline starts from the investor universe:

- known co-investors
- VIP relationships
- AlleyCorp portfolio companies
- broader deep tech market prospects

#### 1. Discovery Agent

Responsibility:

- find new investor signals
- discover new deep tech investors entering the market
- identify potential co-investors
- surface relevant podcast, publication, event, and newsletter signals

Write permission:

- produces candidate investors and candidate signals only
- writes to candidate storage, staging tables, or run reports
- does not write directly to live `fund`, `relationship`, `signal`, or scoring state

#### 2. Enrichment Agent

Responsibility:

- enrich investor profiles using public information
- propose team location, AUM/AUM tier, stage focus, geography focus, portfolio references, deep tech evidence, and check-size proxy
- attach source evidence and confidence to proposed profile updates

Write permission:

- may write proposed profile updates with evidence and confidence to candidate storage or run reports
- accepted profile facts are written only by the source-gated importer / verification path
- does not publish relationship signals
- does not alter warmth tier or relationship state

#### 3. Verification Layer

Responsibility:

- decide whether a candidate is trustworthy enough to enter the product
- classify each candidate as `Accepted`, `Needs Verification`, or `Rejected`

Only accepted profile facts can affect investor profiles. Only accepted relationship signals can affect relationships, warmth scoring, or Today Overview.

#### 4. Scoring And Relationship Engine

Responsibility:

- update warmth tiers
- update relationship freshness
- aggregate signals
- preserve VIP/co-investor status

Scoring stays deterministic and explainable. The system should provide trustworthy investor intelligence, not opaque AI-generated relationship scores.

#### 5. Today Overview And Query Layer

Responsibility:

- consume accepted signals only
- show newly discovered investors, relationship updates, podcast/publication mentions, deep tech news, and notable co-investor activity
- answer meeting-driven queries from accepted data and seeded investor metadata

Unverified signals must not appear in Today Overview.

Critical rule:

> Discovery and enrichment agents do not write directly to live product tables. Only verified and accepted profile facts may update investor profiles. Only verified and accepted relationship signals may update relationship records, warmth scoring, or content shown in Today Overview.

### Investor Prospect Discovery / Enrichment Loop

The broader investor universe should not be a hand-curated static list. The sprint should build toward an automatic prospect loop that feeds the source-gated importer.

Current safe path:

```text
public lead source or search result
  -> candidate investor JSON / run report
  -> official source enrichment with field-level evidence
  -> `npm run import:prospects`
  -> accepted `market_prospect` fund rows only
```

Next implementation step:

- add an automatic discovery adapter/script that searches for new deep tech investors beyond known AlleyCorp co-investors
- use OpenVC, DifferentFunds, public lists, newsletters, podcasts, and search as lead sources only
- find official fund websites and credible profile sources before accepting profile fields
- output the same candidate shape as `docs/investor-prospects-jun15.demo.json`
- attach field-level source evidence for team location, stage, geography, AUM/check-size proxy, portfolio/deep-tech relevance
- pass candidates through `npm run import:prospects`
- write only accepted `market_prospect` rows
- never create relationship rows, signal rows, VIP status, or warmth changes for investors with no verified AlleyCorp relationship signal

This is the work that makes investors with no AlleyCorp signals appear from daily search while keeping them clearly separated from verified relationships.

#### Phasing For Prospect Discovery

Phase 1 — report-only scraper:

- search public lead sources and the web for candidate deep tech investors
- cap scope by default (`--quick` / `--max-targets`) so Exa and Anthropic usage stays controlled
- enforce hard caps before CI: max 10 prospects/run and max 6 Exa results/query
- output candidate JSON/run reports only
- do not write to the DB
- manually pass promising output through `npm run import:prospects`

Phase 2 — scheduled dry run:

- run in CI/GitHub Actions only after API keys and cost caps are configured
- default to a small daily search scope, for example 10 targets or fewer
- write reports to `agent-runs/` in CI and upload that directory with `actions/upload-artifact`
- keep local runs in ignored `.agent-runs/`
- save the latest successful artifact for demo fallback
- still do not write to live DB by default

Phase 3 — accepted market-prospect auto-write:

- allow `--write` only after repeated clean dry runs
- write only through `import-investor-prospects.ts`
- write only accepted `market_prospect` fund rows, source-backed profile fields, notes/provenance, and `profile_last_checked_at`
- never write relationship rows, signal rows, VIP status, or warmth changes

Phase 4 — relationship-signal auto-write:

- reuse `critic-agent.ts` and `canPublishRelationshipSignal()`
- route candidate relationship signals through existing duplicate/date/source/entity checks
- do not build a second verifier system

Clean dry run means:

- zero hallucinated profile fields
- zero scraper `qualityWarnings` in the run report
- `summary.isCleanDryRun = true`
- every non-unknown profile field has matching field-level source evidence
- fund name appears in the cited source text or snippet
- official website is found, or the record remains candidate-only
- no duplicate fund entities are proposed without aliases
- no relationship, signal, VIP, or warmth writes occur
- run report clearly separates accepted, candidate-only, rejected, errors, and skipped targets

`scripts/discover-coinvestors.ts` is currently a manual research helper because it outputs raw SQL and predates the source-policy gate. It should either be refactored to emit candidate JSON and use `source-policy`, or remain clearly labeled manual-only. It should not be used for automated writes.

### Verification Gate

For this sprint, verification should stay practical:

- source URL exists
- source mentions the relevant fund/investor and company/person/event
- signal is not a duplicate
- date is reasonable
- confidence is high enough to publish

### Source Policy For Scrapers And Agents

Agents must not treat search results, inferred URLs, or model output as verified evidence by themselves.

> **Implemented helpers (use these, do not re-derive):** `lib/source-policy.ts` already
> encodes this policy. The verification gate should call:
>
> - `canPublishRelationshipSignal(url)` — true only for credible news / AlleyCorp
>   relationship sources at high confidence; **rejects candidate-only and profile-only
>   sources** (this is the gate for writing a live co-investment/relationship signal).
> - `isCandidateOnlySource(url)` — true for open directories (Crunchbase, PitchBook,
>   OpenVC, DifferentFunds, Notion/Coda, public Sheets). Treat as a lead, never publish.
> - `canEnrichProfile(url)` — true for sources allowed to back a profile field
>   (regulatory filings, fund-owned pages, credible press); excludes candidate-only.
> - `sourceUseFromUrl` / `confidenceFromUrl` / `sourceNameFromUrl` — classification + naming.
>
> Already wired: `ingest-signals.ts` (confidence + source name), `substackAdapter.ts`
> (drops candidate-only at discovery input), `discovery-agent.ts` (critic gate for Phase 1
> writes), and `import:prospects` (source-gated market prospect writes with field-level
> evidence). **Still needed:** the automatic prospect discovery adapter that generates
> candidate JSON from search/public lead sources, plus stronger source-text entity checks
> before any new relationship signal is published.

#### Verified Source Rules

A source can be published only when:

- the page is directly accessible or the source text is captured in the run report
- the source explicitly names the relevant investor/fund
- the source explicitly names the company/person/event/publication signal
- the source supports the date, round, role, or claim being written
- the run stores source URL, source title, snippet, retrieved date, and confidence

Do not publish:

- publication homepages
- inferred profile URLs
- search-result-only claims without saved source text
- paywalled/member-only data that the team cannot access later
- AI-extracted facts without the underlying source evidence

#### Crunchbase Rule

Crunchbase can be used only if the team has access to the specific page/data being cited and the run stores evidence from that page. Without membership/API access, Crunchbase should be treated as a lead for follow-up research, not as a verified source URL.

#### Investor Profile Sources

For broad deep tech investor profiles, agents should prioritize:

| Field              | Preferred Sources                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Website            | fund website, firm LinkedIn page, SEC/IAPD listing                                                              |
| Team location      | fund website team/contact page, SEC/IAPD, LinkedIn public pages                                                 |
| AUM / AUM tier     | SEC IAPD / Form ADV when available, fund website, credible press                                                |
| Portfolio          | fund website portfolio page, fund announcements, company press releases                                         |
| Stage focus        | fund website, fund thesis pages, credible interviews/press                                                      |
| Geography focus    | fund website, thesis pages, portfolio concentration, public filings                                             |
| Check-size proxy   | fund website, AUM tier, fund size, stage focus, credible interviews                                             |
| Deep tech evidence | fund portfolio, fund thesis, AlleyCorp Substack, Abe Substack, Brannon podcast, credible deep tech publications |

SEC IAPD / Form ADV and EDGAR should be used when applicable because they are public regulatory sources. Not every VC fund will have useful filings, so fund websites and source-backed press remain important.

#### Substack / Podcast Rule

AlleyCorp Substack, Abe Murray's Substack, and Brannon Jones's podcast are high-value relationship signal sources because they reflect AlleyCorp-specific context. They still need exact post/episode URLs and snippets before appearing as verified evidence.

### Confidence Policy

| Confidence | Product Behavior                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------- |
| High       | Auto-publish to dashboard, affects warmth/scoring, appears in Today Overview.                   |
| Medium     | Store as candidate or publish with "Needs verification" badge; does not strongly affect warmth. |
| Low        | Do not show in main UI and do not affect warmth. Keep in run report for debugging.              |

### Loop State File

Each run should write a report to `.agent-runs/` or equivalent ignored/local storage:

- Run start/end time
- Sources checked
- Companies/funds scanned
- Candidates found
- Accepted signals
- Quarantined signals
- Rejected signals with reasons
- Recalibration summary
- Changes made during the run
- Errors and skipped targets

---

## 4. Demo-Safe Fallbacks

No demo should depend on a live agent run working perfectly in real time.

| Area                        | Fallback                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Daily Intelligence Pipeline | Can run manually from the command line if GitHub Actions fails.                                                                    |
| Today Overview              | Can render from the latest successful saved run report or seeded relationship updates.                                             |
| Query layer                 | Can answer from seeded investor metadata if live discovery has not produced new data.                                              |
| Investor discovery          | New market prospects can be seeded from verified public sources if automated discovery misses them.                                |
| Source evidence             | If a source URL is not available, the signal must be clearly marked manual/internal and should not be presented as agent-verified. |

Demo Day safety rule:

> The demo should show trustworthy, source-backed investor intelligence, not real-time autonomous behavior. If a live run fails, use the most recent successful accepted data and keep Today Overview and the query layer working.

---

## 5. Code Cleanup Plan

Do cleanup only where it reduces demo risk or makes the Daily Intelligence Pipeline trustworthy. Do not spend this sprint on broad refactors.

### Cleanup Timing

| Timing    | Cleanup Type         | Why                                                                                          |
| --------- | -------------------- | -------------------------------------------------------------------------------------------- |
| Sunday    | Risk cleanup         | Fix the paths that can produce wrong or untrusted data before more pipeline work lands.      |
| Tuesday   | Query/API cleanup    | Align `/api/ask`, `/api/chat`, and MCP behavior while adding the new meeting-driven prompts. |
| Wednesday | Verification cleanup | Remove stale docs/product language and fix only issues found during build/test/demo QA.      |

### Required Cleanup

| Area                | Owner          | When             | Done Means                                                                         |
| ------------------- | -------------- | ---------------- | ---------------------------------------------------------------------------------- |
| Agent write path    | Yaasameen      | Sunday-Monday    | Discovery candidates pass through the verification gate before live DB writes.     |
| Scheduled workflows | Yaasameen      | Sunday           | GitHub Actions cannot write unverified raw discoveries directly to Railway.        |
| Schema/migrations   | Luba           | Sunday           | Source evidence fields are in the canonical schema/migration path.                 |
| Warmth tier shape   | Yaasameen      | Sunday           | DB/API/MCP callers use one normalized warmth tier format.                          |
| Source evidence     | Luba           | Sunday-Wednesday | Published signals have source URL/title/snippet where available.                   |
| API/MCP duplication | Yaasameen      | Tuesday          | Ask/chat/MCP responses are normalized through shared logic or matching formatters. |
| Digest naming       | Michael + Luba | Sunday-Wednesday | Product UI says Today Overview, not email digest, except in old archived docs.     |
| Docs cleanup        | Luba           | Wednesday        | Neon/Lux/digest-first conflicts are removed from current handoff/sprint docs.      |

### Explicit Non-Goals

- Large component rewrites
- Full schema v2 graph migration
- Replacing Exa before Demo Day
- Replacing Claude extraction before Demo Day
- Rebuilding auth beyond the minimum needed before external sharing
- Refactoring every old script just because it is messy

---

## 6. Daily Git Workflow

Everyone must start from the latest `main` before writing code each day.

### First Thing Today

Each teammate runs:

```bash
git checkout main
git pull origin main
npm install
npm run typecheck
```

If `main` does not typecheck, tell the team immediately before starting feature work.

### Branch Naming

Create one branch per person per day. Use this format:

```text
<name>/<date>-<short-task>
```

Examples:

```text
luba/jun14-source-evidence-schema
yaasameen/jun14-verification-gate
michael/jun14-today-overview
luba/jun15-investor-market-fields
yaasameen/jun15-discovery-orchestrator
michael/jun15-vip-profile-ui
```

Keep branch names lowercase. Use hyphens, not spaces.

### Start A New Branch

```bash
git checkout main
git pull origin main
git checkout -b your-name/jun14-short-task
```

### During The Day

Pull latest `main` at least twice:

1. Before starting work.
2. Before opening a PR or asking someone to review.

Recommended update flow:

```bash
git checkout main
git pull origin main
git checkout your-branch-name
git merge main
npm run typecheck
```

If there is a merge conflict, resolve only the files related to your work. Ask the owner before changing someone else's feature files.

### Before Opening A PR

Run the checks that match your change:

```bash
npm run typecheck
npm run lint
npm run test:run
```

If your change touches production build behavior, API routes, MCP, or scripts, also run:

```bash
npm run build
```

If your change touches the query layer or data assumptions, also run:

```bash
npm run test:acceptance
```

### PR Rules

- Open a PR the same day the branch is created.
- Keep PRs small enough to review quickly.
- Put the owner and date in the PR title.
- Include what changed, what was tested, and any known risk.
- Do not merge if `main` has moved and your branch has not been updated.
- Do not edit another teammate's files unless the task requires it; mention it clearly in the PR.

### End Of Day

Before stopping work:

```bash
git status
```

Then either:

- open a PR, or
- push the branch and post what is unfinished.

No one should keep important local-only code overnight.

---

## 7. Day-By-Day Plan

### Sunday June 14 — Stabilize Trust Foundations + Today Overview Shape

**Goal:** Stop credibility leaks before adding more discovery.

#### Luba

- Add source evidence fields to the canonical schema path:
  - `signal.source_title`
  - `signal.raw_snippet`
  - `signal.unique_hash`
  - index/unique constraint for dedupe
- Confirm Railway has the migration applied.
- Fix seeded signal source URLs where placeholders exist, starting with:
  - AlleyCorp Substack signals
  - Crunchbase company profile URLs
  - TechCrunch / PRWeb / GlobeNewswire / Waste Dive source URLs
- Add or confirm fund profile fields:
  - team location / HQ location
  - AUM tier
  - stage focus
  - geography focus
  - check-size proxy
  - deep tech signal
  - co-investor/VIP flag
- Start collecting the metadata needed for the Series A query immediately:
  - stage fit
  - estimated check size
  - deep tech portfolio proof
  - geography constraints
  - existing AlleyCorp relationship context

#### Yaasameen

- Normalize warmth tier at the DB/API/MCP boundary so server callers receive one consistent shape.
- Disable or guard scheduled discovery writes until the verification policy is in place:
  - dry-run allowed
  - accepted-only writes allowed after verification gate lands
  - no raw discovery writes directly to main tables
- Start the verification gate with deterministic rejection rules:
  - duplicate signal
  - future date
  - missing source URL
  - source does not mention both fund and company/person
  - fund name likely mismatched
  - grant agency or non-investor misclassified as fund

#### Michael

- Make the search bar obvious on the main dashboard.
- Rename visible digest navigation/copy toward Today Overview.
- Start Today Overview as the main demo surface, with sections:
  - New investor signals
  - Relationship changes
  - Deep tech headlines
  - Event/podcast/Substack signals

#### Acceptance Criteria

- `npm run typecheck` passes.
- Scheduled discovery cannot write unverified candidates to live tables.
- Search is visibly discoverable on first page load.
- At least one profile shows richer source evidence when available.

---

### Monday June 15 — Build The Daily Intelligence Pipeline

**Goal:** Make the intelligence pipeline autonomous but evidence-gated.

#### Luba

- Update data model and seed/update script for broad investor universe:
  - confirmed anchor co-investors are starred/VIP
  - ordinary co-investors remain known co-investors, not automatically VIP
  - cold/prospect investors can exist without a co-investment
  - profiles can show why the investor is relevant to deep tech
  - VIP/starred status should come from DB-backed `fund.is_vip`, not a broad code rule
- Add investor discovery/enrichment fields for market prospects:
  - deep tech relevance
  - portfolio proof
  - team location
  - stage focus
  - AUM/check-size proxy
  - geography focus
- Seed a small set of **verified example** market investor records as a demo-safe fallback —
  NOT a hand-curated master list. The discovery agent owns finding the universe; these are
  just a few real, source-backed seeds so the demo prompts have data if a live run hasn't run.
  Do not hardcode geography/stage lists or build "the LA list" by hand — geography is a
  queryable field the agent populates, not a fixed roster.
  - a few NY deep tech investors (verified)
  - a few LA deep tech investors (verified)
  - a few Series A relevant investors (verified)
  - Portal Space Systems co-investors where publicly verified
- Start the automatic investor prospect discovery loop after the source-gated importer exists:
  - discover new deep tech investors from search and public lead sources
  - enrich from official fund/profile sources
  - output candidate JSON/run reports
  - pass through `npm run import:prospects`
  - write only accepted `market_prospect` rows

#### Yaasameen

- Build orchestrator loop:
  - reads active portfolio companies
  - reads hot/warm/stale funds
  - prioritizes stale relationships, VIP co-investors, and market prospects
  - calls discovery adapters
  - passes candidates through deterministic verification
  - writes only accepted high-confidence signals
  - runs recalibration after writes
  - writes a run report
- Add confidence policy:
  - high confidence auto-publishes
  - medium/low confidence does not affect warmth

#### Michael

- Finish Today Overview UI using live data where available.
- "Deep tech headlines" section: once recency-bounded it overlaps with "New investor
  signals" (recent deals get claimed there first). Per the June 11 notes this section is
  meant to be "top deep tech news headlines this week" — i.e. the external news feed
  (P1: Brannon podcast + Abe Substack sources). Until that feed lands, hold it as a
  labeled placeholder ("pending news feed") or merge it into New investor signals so
  there is no empty/duplicate panel. (Review finding from luba/june14-fixes.)
- Add VIP/starred treatment for confirmed anchor co-investors only.
- Make profile cards distinguish:
  - Active relationship
  - Known co-investor
  - VIP anchor
  - Market prospect
  - Newly discovered

#### Acceptance Criteria

- `npm run discover:agent` dry run produces a readable report.
- `npm run discover:agent -- --write` only writes accepted high-confidence candidates.
- `npm run import:prospects` can dry-run verified market prospects and write accepted `market_prospect` rows without creating relationships, signals, warmth, or VIPs.
- `npm run recalibrate` runs after accepted writes.
- Today Overview can show at least one real relationship update or source-backed signal, with fallback data if the live run fails.

---

### Tuesday June 16 — Meeting-Driven Query Layer

**Goal:** Make the product answer the questions Kabir actually asked.

> **The three meeting prompts are representative, not exhaustive.** They illustrate the
> _class_ of question the chatbot must handle naturally — any geography (not just LA), any
> event/invite framing (not just "rooftop happy hour"), any stage + check-size + deep-tech +
> warmth combination, and any phrasing (e.g. "which seed funds in NY have we met at an
> event?"). Build genuine NL→field mapping over the investor data model; do not hardcode or
> overfit to the three example strings. Acceptance prompts should _sample_ the class —
> include variations beyond the three — the way the team moved tests off hardcoded fund names.

#### Luba

- Fill enough investor metadata for the three priority query types:
  - location/team hub
  - stage
  - AUM/check-size proxy
  - deep tech focus
  - relationship warmth / event attendance / podcast signal
- Prioritize the Series A query metadata because it is the hardest prompt:
  - stage fit
  - check-size proxy
  - deep tech fit
  - geography
  - existing connection strength
- Confirm Aug 2025 signal source issue and fix any incorrect repeated dates.
- Expand Portal Space Systems co-investors from public and/or provided sources.

#### Yaasameen

- Update `/api/ask`, `/api/chat`, and MCP tool descriptions/output formatting for:
  - "Who should we invite to our rooftop happy hour?"
  - "Who are the deep tech investors in LA?"
  - "Find investors for a Series A raise of $X in deep tech."
- Prefer a shared tool runner/formatter where feasible, or at minimum normalize output behavior across API and MCP.
- Add acceptance/stress prompts for the three meeting-driven query types.

#### Michael

- Improve profile evidence display:
  - group signals by company/person/source type
  - show source links consistently
  - show freshness/last checked
- Add clear UI language for market prospects without making them look like confirmed relationships.

#### Acceptance Criteria

- All three AlleyCorp query types return usable answers from live DB data.
- Profiles show evidence, source links, and freshness clearly.
- Portal Space Systems has expanded source-backed co-investor coverage or documented gaps.

---

### Wednesday June 17 — End-To-End Hardening

**Goal:** Freeze feature work and prove the product can be demoed.

#### Luba

- Data QA pass:
  - all visible signals have source URLs or are clearly marked internal/manual
  - fund names and dates are correct
  - co-investor/VIP flags are correct
  - stale/warm/hot tiers make sense after recalibration
- Tech-debt note (post-demo, do not change scoring pre-demo): `HOT_ANCHORS` in
  `lib/scoring.ts` is a hardcoded list of always-Hot funds. It is Lauren-confirmed so it is
  fine for the demo, but warmth calibration should not require a code edit. Post-demo, move
  the anchor flag into the DB (e.g. a `fund.is_anchor` column or warmth override field) so
  it is data, not code — and update the acceptance tests that key on those fund names.
- Update docs to remove stale conflicts:
  - Neon -> Railway
  - Lux -> Trimble where applicable
  - digest-first language -> Today Overview

#### Yaasameen

- Run and tune verification:
  - `npm run test:acceptance`
  - `npm run test:run`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Tighten latency if practical.
- Document actual latency target if it cannot be brought back under the original 5-second target.
- Confirm minimum auth posture before sharing externally.

#### Michael

- UI QA across dashboard, Today Overview, profile drawer, portfolio/co-investor views, and mobile.
- Fix visible layout issues, empty states, button labels, and search behavior.
- Make sure Today Overview is the default story, not the old email digest story.

#### Acceptance Criteria

- Build passes.
- Tests pass.
- Daily Intelligence Pipeline has a successful dry run and, if safe, a controlled accepted-write run.
- Today Overview is demo-ready.
- Search is obvious.
- Query layer handles the meeting prompts.
- Every published claim has traceable evidence or clear manual/internal provenance.

---

## 8. Owner Plans

### Luba

Primary focus: data trust, schema, source evidence, and product direction.

#### Must Finish

- Source evidence schema and Railway migration.
- Source URL coverage for seeded signals.
- Broad investor metadata fields.
- VIP/co-investor flag.
- Data QA and demo facts.
- Docs cleanup after the June 11 pivot.

#### Done Means

- Lauren can click a relationship and see why it exists.
- Abe can distinguish known co-investors from market prospects.
- The broader deep tech investor universe is represented in the data model, not only in UI copy.

### Yaasameen

Primary focus: Daily Intelligence Pipeline, deterministic verification, query layer, and acceptance testing.

#### Must Finish

- Deterministic verification rules.
- Orchestrator loop.
- Accepted-only write policy.
- Recalibration after writes.
- Run reports.
- Meeting-driven chatbot prompts.
- Warmth tier normalization.

#### Done Means

- The system can discover daily updates without human approval while blocking weak evidence from affecting the product.
- The three Kabir query examples return credible, structured answers.

### Michael

Primary focus: clear, well-defined product UI updates.

#### Must Finish

- Obvious search bar.
- Today Overview view.
- VIP/starred treatment for confirmed anchor co-investors.
- Profile evidence grouping.
- Freshness and source link display.
- Empty states for market prospects.

#### Done Means

- A user can open the app and immediately understand what changed today, who is known, who is new, and why each investor matters.

---

## 9. Demo Story After This Sprint

1. Open Today Overview.
2. Show what changed today: new investor signal, relationship update, deep tech news, or podcast/Substack mention.
3. Search for a confirmed anchor co-investor and show the VIP/starred relationship.
4. Open profile and point to source-backed evidence.
5. Ask: "Who should we invite to our rooftop happy hour?"
6. Ask: "Who are the deep tech investors in LA?"
7. Ask: "Find investors for a Series A raise of $X in deep tech."
8. Explain that the Daily Intelligence Pipeline auto-publishes high-confidence evidence, quarantines weak findings, and has a saved-data fallback for demos.

---

## 10. Polish Window: June 18-Demo Day

No major architecture changes unless something is broken.

### Polish Priorities

- UI spacing, responsive fixes, empty states
- Better copy for warmth tiers / prospects / market map
- Source URL cleanup
- Add a few more high-confidence investor records
- Rehearse demo script
- Run acceptance prompts repeatedly
- Record known limitations honestly

### Do Not Start During Polish

- Full schema v2 graph migration
- New email/calendar integrations
- Full manual review product
- New major UI sections
- Broad refactors not tied to demo risk

---

## 11. Final Definition Of Done

- `npm run typecheck` passes.
- `npm run lint` passes or only has documented non-blocking warnings.
- `npm run test:run` passes.
- `npm run build` passes.
- `npm run test:acceptance` passes.
- Daily Intelligence Pipeline has a saved run report.
- No unverified raw agent candidates write directly to main product tables.
- Today Overview replaces email digest as the main "what changed" experience.
- Search is visible.
- Confirmed anchor co-investors are starred/VIP inside the broader investor universe; ordinary co-investors remain known co-investors.
- Every published signal has source evidence, confidence, and freshness where available.
