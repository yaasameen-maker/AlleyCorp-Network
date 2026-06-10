# AlleyCorp Relationship Intelligence — Handoff Doc

**Updated:** June 7, 2026 · **Demo Day:** June 24, 2026  
**Author:** Luba Kaper

---

## 1. What Was Fixed in This Session (June 7)

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

## 4. mockData — What It's For

`app/data/mockData.ts` serves **two purposes**:

1. **TypeScript types** — `Investor`, `WarmthTier`, `CoInvestment`, `Signal` interfaces. Everything imports from here.
2. **Dev fallback** — `getInvestors()` in `app/data/investors.ts` falls back to 6 mock investors in `NODE_ENV === "development"` only, when the API is unreachable.

**Do not delete** `mockData.ts` — the types are referenced everywhere.  
The fallback only fires in local dev without `DATABASE_URL`. On Railway (production), a failed API call throws.

Ideally before Demo Day: move the types to `lib/types.ts` (where Luba's `Relationship` type lives). Not urgent but would clean up the dual-purpose confusion.

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

| Issue                                         | Status          | Notes                                                                                                     |
| --------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| No Warm tier in DB                            | Expected        | Flybridge (Jun 2024) + Cherubic (Oct 2024) recalibrated to Stale — both dates now 20-24mo ago. Not a bug. |
| `sector`, `stage`, `alley_role` columns empty | Data gap        | Not seeded yet. Portfolio page doesn't show them.                                                         |
| `WarmthTier` types in `mockData.ts`           | Tech debt       | Should move to `lib/types.ts` pre-Demo Day                                                                |
| MCP barrel import crash on startup            | Yaasameen's fix | Import directly from `./security/allowlist.js` not the barrel                                             |
| Chatbot not wired to real MCP                 | Blocked         | Needs `app/api/ask/route.ts` to be built                                                                  |
| 6 companies missing co-investor data          | Luba's research | Avatar, Root Access, dolaGon, ARIX, Aescape, Spaero Bio                                                   |

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

_Last updated: June 7, 2026 — Luba Kaper_
