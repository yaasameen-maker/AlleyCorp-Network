# HANDOFF.md — AlleyCorp Relationship Intelligence Platform

# Use this file to get up to speed when starting a new chat session.

# Keep it updated as work completes or plans change.

**Last updated:** June 6, 2026
**Demo Day:** June 24, 2026
**Office visit:** June 11, 2026 (5 days away — needs working product with real data)

---

## Current Branch

`luba/data-qa-office-prep` (off main)

---

## What Is Done (as of June 6)

### Infrastructure

- Railway PostgreSQL live, `DATABASE_URL` in `.env`
- Next.js app running at `http://localhost:3000` (`npm run dev`)
- All env vars set

### Database

- Schema: 5 tables (`fund`, `investor`, `portfolio_company`, `relationship`, `signal`)
- `seed.sql`: 20 portfolio companies (17 active + 3 alumni), 9 funds, 19 relationships
- `seed-dtny-signals.sql`: 7 event_attendance signals from DTNY Jan 28 2026
- All 4 warmth tiers present: Hot, Warm, Stale, Cold
- 5/5 acceptance tests passing on Railway

### Frontend (merged June 6 — `luba/frontend-integration`)

- All story components wired and rendering with live DB data
- Desktop scroll fixed (main overflow-y-auto, sticky profile panel)
- `lib/alerts.ts` split: client-safe code stays, DB code moved to `lib/alerts.server.ts`
- `serverExternalPackages: ['pg']` added to next.config.ts

### Data verification (June 6)

- Portfolio companies confirmed against Lauren Young's list — all 17 active + 3 alumni ✅
- DTNY signals verified against `DTNY Registration.xlsx` — fixed missing Mach33 signal + Riot Ventures date bug
- Source files stored in `data/` (gitignored — PII)

---

## What Is In Progress

### Co-investor research (Luba — due before June 11)

Discovery script ran June 7. Status per company:

| Company                 | Status       | Notes                                                                          |
| ----------------------- | ------------ | ------------------------------------------------------------------------------ |
| Appetronix              | ✅ SQL ready | Grote Family (hot, 2025-11-06) — AlleyCorp excluded (host firm)                |
| Koop Technologies       | ✅ SQL ready | Ubiquity, Bee, Sure, WestWave (stale), ARV (stale) — Fusion Fund commented out |
| Mapless AI              | ✅ SQL ready | ARV only — NSF + MTC excluded (grant agencies)                                 |
| Dexai Robotics (alumni) | ✅ SQL ready | Hyperplane, Rho, Harlem, Contour, NextView, ARV — all stale                    |
| Avatar                  | ❌ No data   | Web search returned wrong companies — manual Crunchbase needed                 |
| Root Access             | ❌ No data   | Same — manual Crunchbase needed                                                |
| dolaGon                 | ❌ No data   | Same — manual Crunchbase needed                                                |
| ARIX Technologies       | ❌ No data   | Same — manual Crunchbase needed                                                |
| Spaero Bio (alumni)     | ❌ No data   | Same — manual Crunchbase needed                                                |

**Apply reviewed SQL to Railway:**

```bash
psql $DATABASE_URL -f seed-coinvestors-2026-06-07.sql
npm run test:acceptance
```

**Still needed:** Manual Crunchbase research for Avatar, Root Access, dolaGon, ARIX Technologies, Spaero Bio. Also verify Fusion Fund (Koop 2023) and uncomment if confirmed.

### Data QA (Luba — due before June 11)

- Run `npm run test:acceptance` after any seed.sql changes
- Confirm dashboard shows correct tiers for all 5 demo prompts
- Check: stale list matches acceptance test expectations (SineWave, Trimble, BOLD, Flybridge, Cherubic)

---

## What Is Not Done

| Item                               | Owner     | Notes                     |
| ---------------------------------- | --------- | ------------------------- |
| Resend email (digest send button)  | Yaasameen | Not blocking office visit |
| Co-investor research (9 companies) | Luba      | Blocking demo richness    |
| Final data QA                      | Luba      | Before June 11            |

---

## Known Issues / Flags

1. **Portal Space Systems name** — Lauren wrote "Portal System" in her message but we have "Portal Space Systems". Same URL. Confirm with Lauren before changing.

2. **Demo Day script prompt 5** — was "Lux Capital" in early docs. Lux Capital was removed from DB (their co-investment Inductive Bio is not on Lauren's confirmed list). Acceptance tests use "Trimble Ventures". Demo must use Trimble Ventures.

3. **Swoogo Contacts CSV** — has no dates or event names, limited use for signals. Only actionable if Lauren exports per-event registration lists (like she did for DTNY).

4. **`mcp/security/index.ts` barrel import** — causes crash if `MCP_TOKEN_SECRET` missing. Yaasameen owns this fix.

---

## Key Files to Know

| File                              | What it does                                                |
| --------------------------------- | ----------------------------------------------------------- |
| `seed.sql`                        | Full DB seed — re-run to reset all data                     |
| `seed-dtny-signals.sql`           | DTNY event signals — run after seed.sql                     |
| `lib/alerts.ts`                   | Client-safe: types + getRelationshipAlerts() — no DB import |
| `lib/alerts.server.ts`            | Server-only: getAlerts() with DB query                      |
| `lib/scoring.ts`                  | Deterministic warmth scoring — do not add AI here           |
| `scripts/ingest-signals.ts`       | Scraper for co-investor research                            |
| `scripts/discover-coinvestors.ts` | Discovery script — run: `npm run discover`                  |
| `scripts/acceptance-test.ts`      | 5 Demo Day prompts — must all pass                          |
| `seed-coinvestors-2026-06-07.sql` | Reviewed co-investor SQL — apply to Railway                 |
| `QUESTIONS-FOR-ALLEYCORP.md`      | Open questions for June 11 office visit                     |
| `data/`                           | Source files from Lauren (gitignored, PII)                  |

---

## DB Seeding Order (always run in this order)

```bash
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f seed.sql
psql $DATABASE_URL -f seed-dtny-signals.sql
```

## Acceptance Tests

```bash
npm run test:acceptance
```

Requires `ANTHROPIC_API_KEY` and live `DATABASE_URL`. All 5 must pass.

---

## Demo Day Prompts (Abe's POV)

1. "Which co-investors should we reconnect with before they lead another round without us?"
2. "Who are our warmest relationships in deep tech right now?"
3. "What should I know before our meeting with General Catalyst next week?"
4. "Are there any top deep tech funds we haven't co-invested with yet?"
5. "Show me the full picture on Trimble Ventures." ← NOT Lux Capital

---

## Team

- **Luba** — DB schema, seeding, data research, alerts API, frontend integration
- **Yaasameen** — MCP server, scoring, digest, events API
- **Michael** — Frontend (page.tsx, all UI components, story components)

Do not edit another person's files without flagging. If you must, leave a comment explaining why.
