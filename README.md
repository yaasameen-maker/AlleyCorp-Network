# AlleyCorp — Relationship Intelligence Platform

**Version 2.0 · May 2026 · Deep Tech MVP**
Luba · Michael · Yaasameen

---

## What We Are Building

A relationship intelligence platform that maps AlleyCorp's co-investor network across the Deep Tech portfolio, scores relationship warmth using public and internal signals, and surfaces actionable insights automatically.

The primary user is the Deep Tech team. The data model is architected to extend to Healthcare and General team workflows after Demo Day without a rewrite.

Deep Tech investors who co-invest with AlleyCorp use this platform to stay visible and stay relevant — replacing a manual, fragmented process with a single system that tells you who to reach out to, why, and when.

---

## The Problem

AlleyCorp's relationship intelligence lives across spreadsheets, inboxes, and institutional memory. Important co-investor relationships go stale without anyone noticing.

**Why This Matters**

Relationship decay is invisible by default. There is no moment when a relationship officially goes cold — it just drifts. By the time someone notices, the window to re-engage has often already closed.

The cost is not hypothetical. When a co-investor returns at a later round without AlleyCorp, it signals a breakdown that happened earlier — in a relationship that should have been maintained but wasn't.

**The Inductive Bio Example**

AlleyCorp co-invested at Seed alongside a16z Bio and Lux Capital. Both firms returned at Series A. AlleyCorp did not. The company has since won the world's largest ADMET prediction competition and received a $21M government contract. The relationship went quiet while the company accelerated. No current system surfaced this pattern automatically.

This is the problem the platform solves. Not after the fact — before the window closes.

---

## Users

| Name | Role | How They Use the Platform |
|---|---|---|
| Abe Murray | Primary — Deep Tech GP | Identifies and prioritizes co-investor relationships. Reviews warmth changes. Acts on digest alerts. |
| Brannon Jones | Primary — Deep Tech Principal | Researches investor profiles. Tracks signal changes. Builds context before meetings. |
| Lauren Young | Head of Platform | Provides internal data. Reviews outputs. Confirms accuracy of surfaced insights. |
| Kabir Samtani | Technical Stakeholder | Technical review and integration guidance. MCP and cloud environment owner. |

---

## Why We Are Building It This Way

| Decision | Why |
|---|---|
| Deterministic warmth scoring, no AI in Phase 1 | Trust requires explainability. A GP needs to see exactly why a relationship is classified Stale. A black-box score cannot be interrogated or overridden with confidence. |
| Structured query layer, not a broad AI assistant | The query feature answers specific questions about the network. Making it a general AI assistant expands scope, increases hallucination risk, and dilutes the core value. |
| Daily digest via email, not a push notification or dashboard | Partners are not going to open a new dashboard every morning. Email lands where attention already is, with direct links to act. Friction is the enemy of adoption. |
| Public data first, internal data second | This lets the team prove the model before AlleyCorp provides sensitive internal data. It also tests whether public signals alone are sufficient — a real product question. |
| Data model extends to Healthcare and General without a rewrite | AlleyCorp has three teams. Building a one-team silo creates technical debt immediately. The right time to build for extensibility is before the first data goes in. |
| No real-time refresh in Phase 1 | Real-time refresh is expensive and operationally complex. Weekly and daily cadences are accurate enough for relationship intelligence at this stage. |

---

## Scope

P0 = must ship for Demo Day. P1 = important for a complete experience. P2 = build if time allows.

### Journey 1: GP Reviewing the Relationship Network

| Pri | Feature | Why It Matters |
|---|---|---|
| P0 | Ranked investor list by warmth tier with fund name and co-investment overlap visible at a glance | The first screen has to answer the first question: who should I be talking to right now? |
| P0 | Investor profile card — fund name, key contacts, warmth tier, active signals, co-investment history, suggested next action | One profile replaces what currently requires four browser tabs, a spreadsheet, and institutional memory. |
| P0 | Stale relationship detection — co-investors who appeared at an earlier round but not a subsequent one | This is the Inductive Bio problem. The platform exists to surface this pattern before the next Series A closes without AlleyCorp. |
| P0 | Visible, traceable signal evidence behind every warmth classification | A classification no one can interrogate is a classification no one will trust. |
| P0 | Filter the investor list by warmth tier: Hot, Warm, Stale, Cold | Filtering by tier converts a long list into a prioritized queue. |
| P1 | Daily email digest — warmth changes, new co-investors, and stale alerts via authenticated deep-link | The digest brings the intelligence to where attention already is. |
| P1 | Suggested next action on each investor profile based on warmth tier and signal pattern | Knowing a relationship is Stale is not enough. The platform should tell you what to do about it. |
| P2 | Manual warmth override with a note explaining the correction | Users know things the data does not. |

### Journey 2: Principal Researching a Specific Investor or Fund

| Pri | Feature | Why It Matters |
|---|---|---|
| P0 | Search by investor name, fund name, or portfolio company | Context-building starts with a search. If search doesn't work instantly, no other feature gets used. |
| P0 | Fund co-investment view — every AlleyCorp deal a fund has participated in, in one place | Before a meeting, Brannon needs to know the full history without assembling it from three sources. |
| P0 | Natural language query over structured data — not a broad AI assistant | Plain English questions over structured data answer specific network questions without hallucination risk. |
| P1 | Data freshness timestamp on every investor profile | Stale data is as dangerous as a stale relationship. |
| P2 | Export a profile or relationship summary for memo or meeting prep | Useful for taking intelligence out of the platform. Not blocking for Demo Day. |

---

## Warmth Scoring Model

Every classification must be traceable to specific evidence.

### Signals

| Signal | Weight | Source | Update Cadence |
|---|---|---|---|
| Co-investment history | High | Crunchbase, press releases, PitchBook if available | Weekly — automated API pull |
| Event attendance | High | AlleyCorp internal event data | Per event — manual export Phase 1 |
| LinkedIn connections | Medium | AlleyCorp partner exports | Monthly — manual export |
| Public press co-mentions | Medium | Google News, TechCrunch, AlleyCorp Substack | Daily — scheduled search |
| Recency of last co-investment | Medium | Derived from funding round dates | Weekly — derived automatically |

### Warmth Tiers

| Tier | Definition | What It Means in Practice |
|---|---|---|
| Hot | 3+ signals active, co-investment within 18 months | Relationship is current and strong. Prioritize for the next round or event invite. |
| Warm | 2 signals active, relationship confirmed | Relationship exists but not being actively reinforced. Touchpoint needed in 60–90 days. |
| Stale | Signal dropped or co-investor not returning at subsequent rounds | The relationship has weakened. Act before Cold. |
| Cold | No confirmed relationship | No evidence of a prior connection. A gap to address intentionally. |

---

## The Daily Digest

The digest removes the need to check a dashboard. Every morning, the most important relationship changes arrive in your inbox, with direct links to act on them. Each digest link is authenticated and routes directly to the relevant investor profile.

**Example — 7am Monday**

| Type | Content |
|---|---|
| WARMTH CHANGE | Riot Ventures (Valar Atomics) moved from Warm to Stale. Last co-investment signal: 14 months ago. |
| NEW CO-INVESTOR | Booz Allen Ventures appeared in Portal Space Systems Series A. No prior AlleyCorp relationship on record. |
| STALE ALERT | a16z Bio + Health has not co-invested with AlleyCorp since Inductive Bio Seed (Dec 2023). They returned at Series A without AlleyCorp. |

**Digest Design Rules**

| Rule | Detail |
|---|---|
| Format | Plain text. AlleyCorp black and white visual style. No images, no marketing layout. |
| Length | Under 60 seconds to read. Three sections maximum per digest. |
| Links | Each item links to the relevant investor profile via an authenticated deep-link. |
| Cadence | Daily. Sent at a configured time. Configurable recipients. |

---

## Data Model

| Entity | Key Fields | Notes |
|---|---|---|
| Investor | Name, fund_id, role, LinkedIn, stage focus | Individual partner or angel. Tracks role changes over time. |
| Fund | Name, focus, AUM tier, emerging_manager flag, website | Institutional or solo GP. Parent entity for investors. |
| Portfolio Company | Name, sector, stage, AlleyCorp role, website | 20 confirmed active Deep Tech companies. |
| Relationship | fund_id, portfolio_company_id, alley_partner, warmth_tier, last_signal_date, override_note | Links fund to portfolio company. Warmth tier stored separately from signals. |
| Signal | relationship_id, type, date, source, value, confidence | One row per signal. Stored independently so warmth tier is recalibratable. |

Key principle: signals are stored independently from the warmth tier. The tier can be recalibrated, overridden, or audited without touching the underlying signal data.

---

## Out of Scope

| Area | Reason |
|---|---|
| Email inbox enrichment | Requires inbox access and privacy alignment. Kabir's email MCP available approximately June 1. Phase 2. |
| CRM integration and two-way data sync | Scope and integration complexity better suited to Phase 2. |
| Healthcare and General team views | Data model supports them. Nothing built for this release. Post Demo Day. |
| AI-generated warmth scoring | Deterministic logic only in Phase 1. |
| Automated data enrichment from paid APIs | API access pending. Public data first. |
| Automated outreach or email sending | Out of scope permanently for Phase 1. Not a CRM. |
| Real-time data refresh | Weekly and daily cadences are sufficient at this stage. |

---

## Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Public data is sufficient to score relationships | Investors scored using only public signals before any internal data arrives | At least 5 investors scored across 3 signal types |
| Platform surfaces insights AlleyCorp does not have | Lauren Young confirms at least 1 insight not currently tracked anywhere | Confirmed before Demo Day |
| Interface is immediately usable | Time for a GP to find an investor and read their warmth tier and signals | Under 60 seconds, without explanation |
| Daily digest drives action | Digest open and click-through resulting in a confirmed follow-up action | At least 1 digest item acted on by Abe or Brannon within 48 hours of Demo Day |

---

## Phase 2 — Post Demo Day

- Email-based signals using communication history as an additional warmth indicator
- CRM integration for two-way data sync
- Healthcare and General team views built on the shared data model
- Broader AI-assisted analysis layer beyond structured query filtering
- Automated enrichment from paid data APIs including PitchBook and LinkedIn

---

---

# Sprint Plan · May 21 – June 4, 2026

**Demo Day: June 24, 2026**
Luba · Michael · Yaasameen

---

## Confirmed Decisions

From Kabir. These are not open questions. Build from these.

| Decision | What It Means |
|---|---|
| PRD direction and deterministic scoring confirmed | No pivoting. Build what is in the PRD. |
| Team owns stack, tooling, and deployment | No waiting on Kabir for infrastructure. We decide, we set it up. |
| MCP server is a core deliverable | Build using Anthropic TypeScript SDK. Not optional. |
| NL query layer powered by MCP server | Claude queries our database through MCP tools. No separate NLP pipeline. |
| Email enrichment available June 1 | Not in scope for this sprint. Do not build around it yet. |
| TypeScript throughout | One language across frontend, backend, and MCP server. |

---

## What Is Unblocked

Lauren responded May 19. All data blockers resolved.

- Portfolio list: 20 active companies confirmed. List in hand.
- Warmth calibration anchors: Riot Ventures, Snowpoint Ventures, General Catalyst, Mach33 confirmed as Hot tier.
- Event data: Swoogo and Luma exports available. Files not yet sent — request from Lauren before May 21.

Public data (Crunchbase, press releases) is sufficient to start seeding. Event files enrich the model when they arrive.

---

## Sprint Goal

> By June 4: a working relationship intelligence platform with all four warmth tiers populated, the first vertical slice fully end-to-end, and the MCP query layer returning real results.

---

## First Vertical Slice — Lux Capital + Viam

- Relationship stored in database
- Warmth score calculated deterministically
- Stale relationship detected and classified
- Investor profile card generated with signal evidence
- Daily digest generates a stale alert
- MCP query `list_stale_relationships()` returns Lux Capital

## Four Warmth Tiers — Real Examples

| Tier | Fund | Connection | Story |
|---|---|---|---|
| Hot | Riot Ventures, Snowpoint, General Catalyst, Mach33 | Lauren confirmed as strong existing relationships | Calibration anchors for the warmth model |
| Warm | USV (Albert Wenger) | Co-invested in Viam. Active but not recently reinforced. | Needs a touchpoint in next 60–90 days |
| Stale | Lux Capital | Co-invested Inductive Bio Seed. Lux returned at Series A. AlleyCorp did not. | Reconnect before Inductive Bio Series B |
| Cold | a16z American Dynamism, Eclipse, Founders Fund | Top deep tech funds. No existing AlleyCorp relationship. | Target co-investors to build toward |

---

## Proposed Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js (TypeScript) | React-based, easy deployment, one language across the stack. |
| Backend API | Next.js API routes (TypeScript) | Keeps frontend and backend in one repo. No context switching. |
| Database | PostgreSQL via Railway | Structured relational data. Right fit for the warmth model. |
| Deployment | Vercel (frontend) + Railway (DB) | Free tiers, fast setup, no DevOps overhead. |
| Email digest | Resend | Simple API, good deliverability, free to start. |
| MCP server | Anthropic TypeScript SDK | Kabir's recommendation. Powers the NL query layer. |

---

## Sprint Tasks

### Week 1 — May 21–23 · Foundation

**May 21–22 · Setup**
- Finalize stack decision as a team
- Set up shared repo and branch structure (Yaasameen started)
- Set up Vercel + Railway deployment pipelines
- Set up PostgreSQL database and test connection
- Email Lauren to request Swoogo + Luma export files

*Owner: Luba (data model) + team (setup)*

**May 23 · Data Model + Co-investor Research**
- LUBA: Define schema for 5 entities: Investor, Fund, Portfolio Company, Relationship, Signal
- LUBA: Schema must support Healthcare and General team extension
- LUBA: Seed first relationships: Lux Capital + Viam, USV + Viam
- LUBA: Seed warmth anchors: Riot Ventures, Snowpoint, General Catalyst, Mach33
- LUBA: Confirm all 20 active portfolio companies are in the database
- PERSON 2: Research and document co-investors for Viam, Glacier, Portal Space Systems, Valar Atomics from public sources (Crunchbase, press releases)
- PERSON 2: Output: a clean list of fund name, round, date, role for each — ready to seed

*Owner: Luba (schema) · Person 2 (co-investor data)*

**Memorial Day Weekend · May 24–26 · No build days**

---

### Week 2 — May 27–30 · Warmth Scoring + Frontend

**May 27–28 · Warmth Scoring**
- Build deterministic warmth scoring logic — no AI in this layer
- Build stale relationship detection: flag co-investors at Seed who did not return at Series A
- Store signals independently from warmth tier
- Calibrate against Lauren's four Hot anchors
- Lux Capital should score as Stale after this is running

*Owner: Person 1 · Person 2*

**May 29–30 · Frontend**
- Investor list view with warmth tier pills visible without clicking
- Filter by warmth tier: Hot / Warm / Stale / Cold
- Investor profile card: fund name, warmth tier, active signals, co-investment history, suggested action
- All four warmth tiers visible in the dashboard with real data
- Lux Capital profile card complete and correct

*Owner: Person 3*

---

### Week 3 — June 2–4 · MCP + Digest + Integration

**June 2 · MCP Server**

Build four MCP tools using Anthropic TypeScript SDK:
- `get_investor(name)`
- `search_relationships(query)`
- `list_stale_relationships()`
- `get_warmth_signals(investor_id)`

Each tool maps to a real user question. Keep narrow and deterministic.
Test: `list_stale_relationships()` should return Lux Capital.

*Owner: Person 1 (Luba)*

**June 3–4 · Daily Digest + Integration**
- Generate first digest item from Lux Capital stale relationship
- Email delivery via Resend with authenticated deep-link
- Full vertical slice test: seed → score → profile → digest → MCP query all working
- Expand dashboard to show full 20-company network
- Search and filter working across all tiers

*Owner: Person 2 · Person 3*

**June 1 Midpoint · Kabir's email enrichment layer becomes available. Assess integration at this point.**

---

## Scope Reminder

| We ARE building | We are NOT building |
|---|---|
| Structured co-investor relationship intelligence | Autonomous AI agents |
| Deterministic warmth scoring across all four tiers | Broad AI copilot or general assistant |
| Stale relationship detection | Custom NLP pipeline |
| Cold tier: target co-investors to build toward | CRM replacement |
| Daily email digest with authenticated deep-links | Advanced analytics platform |
| MCP-powered natural language query layer | Email inbox enrichment (Phase 2, assess June 1) |
| Full 20-company Deep Tech network | Healthcare or General team views (data model supports, nothing built yet) |

---

*Sprint Plan v1.0 · May 21, 2026 · Luba, Michael, Yaasameen*
*PRD v2.0 · May 2026 · Next review: upon Lauren and Kabir sign-off*
