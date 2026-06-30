# L3 Capstone Handoff Sheet

**AlleyCorp Relationship Intelligence Platform**
Yaasameen Perez, Luba Kaper, Michael Fehdrau — June 2026

---

## 1. Project Overview

**What was built:**

The AlleyCorp Relationship Intelligence Platform is a relationship tracking and network intelligence tool built for AlleyCorp's Deep Tech investment team. It ingests co-investment signals and relationship data from AlleyCorp's portfolio, scores each investor relationship as Hot, Warm, Stale, or Cold using a deterministic signal-based algorithm, and surfaces that intelligence through a live dashboard and a Claude-powered AI assistant (MCP server). The goal is to help the team prioritize relationship maintenance, flag stale connections before they go cold, and identify new deep tech investors worth engaging.

**Features delivered:**

- Warmth tier dashboard — all co-investor relationships scored and displayed as Hot / Warm / Stale / Cold, with visual badges and filter pills
- Investor profile drawer — slide-in panel with relationship summary, full signal history with source links, portfolio company context, and suggested next action
- Today Overview / Briefing Dashboard — hero card showing most engaged investor, most urgent stale alert, and overall network health
- Portfolio companies page — all 20 active portfolio companies with their co-investor cards
- Daily Intelligence Pipeline — three automated scripts running on GitHub Actions (7am + 8am UTC) that discover new co-investors from funding news, find new deep tech funds not yet in the DB, and ingest new signals for existing relationships
- Email digest view — outreach templates with one-click copy to clipboard
- Stale relationship alerts — API endpoint surfacing relationships that haven't had activity in 12+ months
- Claude-powered MCP server — 4 tools (list stale relationships, search relationships, get investor profile, get signals by type) with 4-layer security; powers natural language queries from Claude
- Dark mode — toggle in sidebar, preference persisted across sessions

**Out of scope (not built this sprint):**

AI-powered warmth scoring (scoring is deterministic by design), CRM workflows, General/Healthcare team views, email inbox enrichment, and a public API.

---

## 2. Demo

**Demo link:** https://www.loom.com/share/70827f07ac7040d4a86653d589e27770

---

## 3. Repository & Project Files

**Repository link:** https://github.com/yaasameen-maker/AlleyCorp-Network

**Live app URL:** https://alleycorp-network-production.up.railway.app/

**README covers:**

The `REBUILD.md` file at the root of the repository serves as the developer setup guide. It covers what the app does, how to run it locally, how to deploy to Railway, all required environment variables, and key commands for running tests, the discovery pipeline, and the MCP server.

**Transfer instructions:**

If you would like full ownership of the codebase, we can transfer the GitHub repository directly to your account or organization. To do so, please share your GitHub username or organization name and we will initiate the transfer from our end. Once complete, you will have full admin access to the repository and all of its files.

---

## 4. Documentation & User Guide

**Loom walkthrough:** https://www.loom.com/share/70827f07ac7040d4a86653d589e27770

**Flows documented:**

- Investor warmth dashboard — browsing, filtering by tier, searching by name
- Investor profile drawer — viewing relationship history, signal sources, suggested actions
- Portfolio companies view — seeing co-investor coverage per company
- Email digest / outreach templates — copying pre-drafted outreach for stale relationships
- Daily Intelligence Pipeline — how the automated discovery scripts run and how to trigger them manually
- MCP chatbot — how to use the five Demo Day prompts via the Claude interface (localhost only)

---

## 5. Final Presentation & Lookbook

**Slide deck:** `AlleyCorp_Demo_Day.html` — attached as a self-contained interactive HTML presentation. Open in any browser; no install required.

**Lookbook link:** https://lookbook.pursuit.org/projects/relationship-intelligence-platform

---

## 6. Credentials, Access & Cost Safety

**Services running:**

| Service | Purpose | Notes |
|---|---|---|
| Railway (PostgreSQL) | Live database — 33 relationships, 20 portfolio companies, signals | Port 55198 — do not use 13998 (dead instance) |
| Railway (Next.js app) | Hosts the live dashboard | Auto-deploys from GitHub main branch |
| GitHub Actions | Daily discovery pipeline — 7am + 8am UTC | Runs `discovery.yml` and `prospect-discovery.yml` |
| Anthropic API | Powers the Claude MCP chatbot | Currently local-only — key is NOT on Railway to prevent runaway spend |
| Exa API | Powers the investor discovery pipeline web searches | Used by `discover-investor-prospects.ts` |
| Resend | Email delivery (digest emails) | Configured but lightly used this sprint |
| Sentry | Error monitoring | DSN in Railway env vars |

**Credentials handed off:**

All API keys and secrets live in Railway's environment variables dashboard (Settings → Variables). The `.env.example` file in the repo lists every variable name needed. Specific keys were shared with AlleyCorp separately via secure channel — please confirm receipt of the `.env` values with Devika at Pursuit if you have not already.

**How to shut it down:**

- **Railway app + DB:** Log into railway.app → open the project → click each service → Settings → Delete Service. The PostgreSQL service and the Next.js service are separate and can be deleted independently.
- **GitHub Actions (stop the daily pipeline):** Go to the repo → Settings → Actions → disable workflows, or delete `.github/workflows/discovery.yml` and `.github/workflows/prospect-discovery.yml`.
- **Anthropic API:** Log into console.anthropic.com → API Keys → revoke the key labeled for this project.
- **Exa API:** Log into exa.ai → API Keys → revoke.
- **Resend:** Log into resend.com → API Keys → revoke.

---

## 7. Known Limitations & Recommended Next Steps

**Known limitations:**

- **No Warm-tier investors in the live DB** — this is expected, not a bug. The two funds that were Warm (Flybridge, Cherubic) had their last co-investment 20–24 months ago and were recalibrated to Stale by the scoring algorithm. As new co-investment signals are ingested, investors will move into Warm naturally.
- **6 portfolio companies have no co-investor data yet** — Avatar, Root Access, dolaGon, ARIX Technologies, Aescape, and Spaero Bio were not yet researched at the time of handoff. Their profile pages will show no co-investors until seeded.
- **Signal source URLs are homepage-level only** — the 23 seed signals link to alleycorp.substack.com (the homepage) rather than specific post URLs. The "view source" links in the profile drawer are less useful than intended. Specific URLs are a known next step.
- **Chatbot not connected to real MCP backend** — the "Ask Network" UI panel is built (`AskNetworkNavPanel.tsx`) but currently uses a pattern-matching mock. To make it functional, `app/api/ask/route.ts` needs to be created to route queries to the MCP tools.

**Bug:**

MCP server crashes on startup if `MCP_TOKEN_SECRET` is missing from the environment.

- **Impact:** The MCP server won't start; Claude cannot call the tools.
- **Workaround:** Ensure `MCP_TOKEN_SECRET` is set before running `npm run mcp`. Generate with `openssl rand -hex 32`.

**Recommended next steps:**

1. Wire the chatbot to the real MCP backend — create `app/api/ask/route.ts` that calls the existing MCP tools. This would make natural-language queries work directly from the dashboard without needing Claude Desktop.
2. Seed co-investor data for the 6 missing companies — Crunchbase research for Avatar, Root Access, dolaGon, ARIX, Aescape, Spaero Bio.
3. Add specific source URLs to seed signals — replace the Substack homepage URL with links to the actual newsletter posts for each signal.
4. Email inbox enrichment — connect Gmail or another inbox to auto-ingest relationship signals (emails, replies) as they happen. This was assessed for a future sprint pending Kabir's data layer.
5. Deploy the Anthropic API key to Railway with spend limits set — this would allow the chatbot to run on the deployed app, not just localhost.

**User data notes:**

All relationship and signal data lives in the Railway PostgreSQL database. It includes fund names, investor relationships, co-investment history, and event attendance records sourced from AlleyCorp internal data (DTNY attendee list, Swoogo contacts). No end-user accounts or personal data beyond the AlleyCorp team's own network contacts are collected. To export: `pg_dump $DATABASE_URL > backup.sql`. To delete: drop the Railway PostgreSQL service.
