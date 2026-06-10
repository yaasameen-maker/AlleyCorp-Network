# AlleyCorp Relationship Intelligence — Handoff Doc

**Updated:** June 10, 2026 · **Demo Day:** June 24, 2026  
**Author:** Luba Kaper

---

## 1. What Changed — June 10 Update

### Scoring alignment — `calculateWarmthTier` now matches `computeWarmthTier`

Two scoring APIs existed in `lib/scoring.ts` and were giving different results for the same fund. Fixed:

- `calculateWarmthTier` (API 1, used by alerts + tests) now respects `HOT_ANCHORS` — a HOT_ANCHOR fund always returns Hot regardless of signal count
- 1 active `co_investment` within 18 months now returns Warm (previously Stale) — matches the weighted scorer where co_investment scores 10, above the Warm threshold of 6
- 48/48 tests pass

### HOT_ANCHORS audit — trimmed to Lauren-confirmed funds only

`HOT_ANCHORS` in `lib/scoring.ts` was expanded June 4 with 7 extra funds labeled "Lauren-confirmed" — but Lauren only explicitly confirmed 4 funds when asked about strong AlleyCorp relationships:

> "Riot Ventures, Snowpoint Ventures, General Catalyst and Mach33"

The 7 additions (SOSV, Day One Ventures, Amazon Climate Pledge Fund, NEA, Ubiquity Ventures, **Geodesic Capital**, ff Venture Capital) were removed. Those funds are now scored purely by their signals. Some may come out Hot naturally (NEA has 3 signals, ff VC has 3 signals + DTNY event). If Lauren confirms any of them on Thursday, add them back with her name and date in a comment.

### Signal count + source URL in InvestorRow and ProfileDrawer

- **InvestorRow** subtext now shows: `Portal Space Systems · 3 signals · Jan 2026`
- **ProfileDrawer** Engagement History now shows portfolio company per signal and a clickable source link when `source_url` is populated
- `signal` table has a new `source_url TEXT` column (idempotent migration in `schema.sql`)
- `lib/types.ts` Signal now has `sourceUrl?: string`; `lib/db.ts` SELECTs include `source_url`
- 6 AlleyCorp Substack signals on Railway have `source_url = 'https://alleycorp.substack.com'` (homepage placeholder — specific post URLs are a June 12–16 sprint task)

### Type source of truth moved — mockData no longer owns types

`app/data/mockData.ts` used to define all frontend types (`Investor`, `Signal`, `WarmthTier`, etc.). This caused components to import from mockData even when using real DB data. Fixed:

- **`lib/investors.ts`** is now the source of truth for all frontend types: `Investor`, `InvestorSignal`, `CoInvestment`, `Contact`, `WarmthTier`, `DiscoveryContext`
- All components (`InvestorRow`, `ProfileDrawer`, `page.tsx`, and 10+ others) import from `@/lib/investors`
- `mockData.ts` is now data-only — just the fallback array + re-exports from `lib/investors`
- 0 TypeScript errors, 47/47 tests pass

### Agent foundation — `luba/june10-sprint` branch

- `lib/discovery-types.ts` — shared contracts for the full agent pipeline (`SourceRecord`, `DiscoverySignalCandidate`, `SIGNAL_TYPE_TO_DB`)
- `scripts/adapters/substackAdapter.ts` — newsletter search + Claude extraction extracted from discovery agent
- `scripts/adapters/eventPageAdapter.ts` + `eventExportAdapter.ts` — stubs for Phase 2
- `scripts/discovery-agent.ts` — refactored to use adapter pattern; Phase 1 passes `'cold'` to `upsertRelationship`, recalibrate owns tier logic
- All agent npm scripts now use `node --env-file=.env --import tsx` to fix ESM pool initialization race condition

---

## 1b. What Was Fixed in the June 7 Session

### Critical data bug — was showing 6 investors instead of 30+

`lib/db.ts` had the wrong table and column names. Railway uses **singular** table names.

| Wrong (old)           | Correct             |
| --------------------- | ------------------- |
| `relationships`       | `relationship`      |
| `funds`               | `fund`              |
| `portfolio_companies` | `portfolio_company` |
| `signals`             | `signal`            |
| `s.type`              | `s.signal_type`     |
| `s.date`              | `s.signal_date`     |
| `pc.alleycorp_role`   | `pc.alley_role`     |

Also added `toWarmthTier()` in `app/api/investors/route.ts` — DB returns lowercase (`hot`), frontend needs Title Case (`"Hot"`). Without this, all tier counts showed 0.

### Portfolio page rewrite (`app/portfolio/page.tsx`)

- Was importing `mockInvestors` and `portfolioCompanies` from `mockData` — showed 5 fake companies
- Was using `bg-navy`, `bg-paper` CSS classes that no longer exist
- **Now:** server component, queries DB directly using `getAllRelationships()` + `pool`, shows all 20 portfolio companies with real co-investor data

### Dark mode

- Built `app/hooks/useDarkMode.ts` — reads/writes `localStorage`, toggles `html.dark` class
- Pill toggle (AlleyCorp teal `#0EA5D6`) in sidebar header next to wordmark
- `app/components/DarkModeInit.tsx` added to root layout — applies saved preference on every route including `/portfolio`
- All dark overrides in `globals.css` via `html.dark .classname` (not Tailwind `dark:` variants)

### Other UI work this session

- Full redesign: aurora gradient strip, warm off-white palette, ProfileDrawer with relationship prose
- `DigestView.tsx` — replaced broken `EmailDigestView`, inline email templates, copy to clipboard
- `BriefingDashboard.tsx` — hero card with live intelligence (most engaged, most urgent stale, network health)
- `InvestorRow.tsx` + `WarmthBadge` — white pill + colored dot, consistent across all views

---

## 2. Current State of the DB

**Railway is live.** 20 portfolio companies, 33 relationship rows.

```
Warmth breakdown (as of June 7):
  Hot:   12
  Warm:   0  ← Flybridge + Cherubic moved to Stale by recalibrateAll (dates now 20-24mo ago)
  Stale: 17
  Cold:   4
```

**Schema changes since June 7:**

- `signal` table has a new `source_url TEXT` column (added Jun 10, idempotent `ALTER TABLE IF NOT EXISTS` in `schema.sql`)

**Run in this order to re-seed:**

```bash
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f seed.sql
psql $DATABASE_URL -f seed-dtny-signals.sql
```

**6 companies with no co-investors seeded yet** (need Crunchbase research):

- Avatar
- Root Access
- dolaGon
- ARIX Technologies
- Aescape (alumni)
- Spaero Bio (alumni)

**DTNY signals confirmed present** (Jan 28, 2026):
a16z, Eclipse, Union Square, BOLD Capital, ff VC, SineWave, Mach33

---

## 3. What Each File Does (active render tree only)

### Pages

| File                     | What it does                                                       |
| ------------------------ | ------------------------------------------------------------------ |
| `app/page.tsx`           | Main dashboard — investor list + briefing/digest views             |
| `app/portfolio/page.tsx` | Portfolio companies page — all 20 companies with co-investor cards |
| `app/layout.tsx`         | Root layout — wraps all routes, includes `DarkModeInit`            |

### Active components (imported and rendered)

| File                    | What it does                                                            |
| ----------------------- | ----------------------------------------------------------------------- |
| `AppSidebar.tsx`        | Left sidebar — search, filter pills, investor list, dark toggle, nav    |
| `BriefingDashboard.tsx` | Main content — hero card, "Needs attention", "Strongest relationships"  |
| `ProfileDrawer.tsx`     | Slide-in drawer — relationship prose, signal history, suggested action  |
| `DigestView.tsx`        | Email digest view — outreach templates, copy to clipboard               |
| `InvestorRow.tsx`       | Single row in sidebar list + `WarmthBadge` component (used everywhere)  |
| `DarkModeInit.tsx`      | Null component in layout — applies saved dark/light preference on mount |

### Dead components (Michael's — not imported anywhere)

These exist in `app/components/` but are not part of the active render tree:

| File                       | Notes                                                                         |
| -------------------------- | ----------------------------------------------------------------------------- |
| `AskNetworkNavPanel.tsx`   | **Keep** — good UI shell for future chatbot feature                           |
| `useAskNetwork.ts`         | **Keep** — goes with the panel above                                          |
| `lib/mcpQuery.ts`          | **Keep but replace backend** — client-side regex mock, needs real MCP API     |
| `InvestorCard.tsx`         | Can delete — superseded by ProfileDrawer                                      |
| `InvestorListSection.tsx`  | Can delete                                                                    |
| `RelationshipsNavItem.tsx` | Can delete                                                                    |
| `DialogShell.tsx`          | Can delete                                                                    |
| `MobileNavTools.tsx`       | Can delete                                                                    |
| `AskNetworkPullDown.tsx`   | Can delete                                                                    |
| `AnimatedBar.tsx`          | Can delete                                                                    |
| `InvestorProfile.tsx`      | Can delete                                                                    |
| `WarmthBadge.tsx` (root)   | Can delete — uses old CSS classes, the real badge is inside `InvestorRow.tsx` |

> ⚠️ **Michael's files** — do not delete without checking with him first.

---

## 4. Type Source of Truth — `lib/investors.ts`

All frontend types live in **`lib/investors.ts`**:

| Type               | Description                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `Investor`         | Full investor card shape — what the API returns and components consume                     |
| `InvestorSignal`   | Per-signal shape: type, description, date, weight, source, sourceUrl, portfolioCompanyName |
| `CoInvestment`     | Co-investment entry for the drawer                                                         |
| `Contact`          | Point of contact (name, role, linkedinUrl)                                                 |
| `WarmthTier`       | Re-exported from `lib/types.ts` — `"Hot" \| "Warm" \| "Stale" \| "Cold"`                   |
| `DiscoveryContext` | Re-exported from `lib/types.ts` — network_expansion / portfolio_scan context               |

**`app/data/mockData.ts`** is now **data-only** — just the 6-investor fallback array typed against `lib/investors.Investor`. It re-exports all types from `lib/investors` so old imports don't break.

The fallback fires in local dev only when the API is unreachable (no `DATABASE_URL`). On Railway it throws.

---

## 5. Chatbot / Ask Panel — NOT BUILT YET

This is the "Ask Abe" natural language interface. It's on the roadmap for Demo Day.

**What Michael built (starting point):**

- `AskNetworkNavPanel.tsx` — UI: text input, 2 quick-query buttons, result list
- `lib/mcpQuery.ts` — **fake** backend: pattern-matching regex on in-memory investor list, no actual API call

**What needs to happen to make it real:**

1. Create `app/api/ask/route.ts` — POST endpoint that takes `{ query: string }` and calls Yaasameen's MCP tools
2. Replace `runMCPQuery()` call in `useAskNetwork.ts` with `fetch("/api/ask", ...)`
3. Update CSS classes in `AskNetworkNavPanel.tsx` to match current design system (currently uses old `bg-mist`, `bg-field-input`, etc.)
4. Wire it into `app/page.tsx` as a slide-in panel or bottom drawer

**Recommended placement:** slide-in panel from bottom-right, triggered by a button in the sidebar footer.

---

## 6. Demo Day Checklist (June 24)

### 5 prompts Abe will ask — all must work against Railway DB

| #   | Prompt                                                                                   | MCP tool                   | Status                                  |
| --- | ---------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------- |
| 1   | "Which co-investors should we reconnect with before they lead another round without us?" | `list_stale_relationships` | ✅ DB has 17 stale                      |
| 2   | "Who are our warmest relationships in deep tech right now?"                              | `search_relationships`     | ✅ DB has 12 hot                        |
| 3   | "What should I know before our meeting with General Catalyst next week?"                 | `get_investor`             | ✅ GC seeded as hot                     |
| 4   | "Are there any top deep tech funds we haven't co-invested with yet?"                     | `search_relationships`     | ✅ Cold targets seeded                  |
| 5   | "Show me the full picture on Trimble Ventures."                                          | `get_investor`             | ✅ Trimble seeded (stale, Civ Robotics) |

> ⚠️ Prompt 5 is **Trimble Ventures** not Lux Capital. Lux was removed (their only co-investment was Inductive Bio, not on Lauren's confirmed list).

**Morning of Demo Day:**

```bash
npm run test:acceptance   # must show 5/5 against Railway
```

---

## 7. Known Issues / Decisions to Revisit

| Issue                                         | Status             | Notes                                                                                                     |
| --------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| No Warm tier in DB                            | Expected           | Flybridge (Jun 2024) + Cherubic (Oct 2024) recalibrated to Stale — both dates now 20-24mo ago. Not a bug. |
| `sector`, `stage`, `alley_role` columns empty | Data gap           | Not seeded yet. Portfolio page doesn't show them.                                                         |
| `WarmthTier` types in `mockData.ts`           | ✅ Resolved Jun 10 | Types moved to `lib/investors.ts`. mockData is data-only.                                                 |
| HOT_ANCHORS had 7 unconfirmed funds           | ✅ Fixed Jun 10    | Removed SOSV, Day One, Amazon CPF, NEA, Ubiquity, Geodesic, ff VC. Only Lauren-confirmed 4 remain.        |
| MCP barrel import crash on startup            | Yaasameen's fix    | Import directly from `./security/allowlist.js` not the barrel                                             |
| Chatbot not wired to real MCP                 | Blocked            | Needs `app/api/ask/route.ts` to be built                                                                  |
| 6 companies missing co-investor data          | Luba's research    | Avatar, Root Access, dolaGon, ARIX, Aescape, Spaero Bio                                                   |
| `source_url` on seed signals is homepage only | Sprint Jun 12–16   | All 23 seed signals need real article URLs. See `SPRINT-june12-16.md` for full list.                      |
| `ingest-signals.ts` schema mismatch           | Sprint Jun 12–16   | INSERT references `source_title`, `raw_snippet`, `unique_hash` — not in schema yet. Breaks on `--write`.  |

---

## 8. Design System Reference

| Token      | Value                 | Used for                          |
| ---------- | --------------------- | --------------------------------- |
| Navy       | `#0D1320`             | Primary text, sidebar bg          |
| Teal       | `#0EA5D6`             | Accent, links, hot dot, toggle-on |
| Off-white  | `#F8F7F4`             | Page background                   |
| Surface    | `#FFFFFF`             | Cards, sidebar                    |
| Border     | `#E5E7EB` / `#EAECEF` | Card borders, dividers            |
| Muted      | `#9CA3AF`             | Labels, secondary text            |
| Very muted | `#C4C9D4`             | Placeholder, disabled             |

**Dark mode:** `html.dark` class on `<html>`. All overrides in `globals.css`. Do NOT use Tailwind `dark:` variants — they conflict with the class-based approach.

**Warmth tier case contract:** DB stores `hot`/`warm`/`stale`/`cold` (lowercase). TypeScript uses `"Hot"`/`"Warm"`/`"Stale"`/`"Cold"` (Title Case). `toWarmthTier()` in `app/api/investors/route.ts` handles conversion. Do not collapse this.

**Aurora gradient:** `.hero-aurora` class in `globals.css`. 22s ease infinite animation. Do not remove — Luba wants it kept.

---

## 9. Ownership Reminder (from CLAUDE.md)

| Person        | Owns                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| **Luba**      | `schema.sql`, `seed.sql`, `lib/db.ts`, `lib/scoring.ts`, `lib/alerts.ts`, data research |
| **Yaasameen** | `mcp/`, `lib/digest.ts`, `app/api/events/`, acceptance tests                            |
| **Michael**   | `app/page.tsx`, `app/layout.tsx`, all frontend pages, warmth tier UI                    |

Do not edit another person's files without flagging it first. Leave a comment if you must.

---

_Last updated: June 10, 2026 — Luba Kaper_
