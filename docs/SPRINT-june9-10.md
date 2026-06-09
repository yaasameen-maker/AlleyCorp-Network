# Sprint Plan: June 9–10 (Thursday Partner Meeting Prep)

**Goal:** Ship a demo-ready product for the Thursday AlleyCorp partner meeting.  
**Not the goal:** Finish the entire project.  
**Optimize for:** Stakeholder impact, data credibility, AI demo reliability.

---

## The One Constraint That Drives Everything

Lauren and the AlleyCorp team know their own network. They will mentally
fact-check every fund name, every warmth score, every relationship claim.
**Data credibility is the demo.** A beautiful UI with thin or wrong data
will undermine trust instantly.

Everything in this sprint serves one of three things:
1. Accurate warmth tiers for funds AlleyCorp actually knows
2. Evidence behind each tier (real signals, real contact names)
3. AI that answers the 5 Demo Day prompts cleanly, every time

---

## Code Freeze

**Wednesday June 10 at 6pm.** No new features after that. Bug fixes only.

---

## MICHAEL — Research (Tuesday all day)

**Deliverable:** `data/fund-contacts.csv` by Tuesday 5pm  
**Columns:** `fund_name, contact_name, contact_title, linkedin_url, fund_website, notes`

### 12 Priority Funds (in this order)

**Hot/Warm — do these first:**
1. Riot Ventures
2. Snowpoint Ventures
3. General Catalyst
4. Mach33
5. SOSV

**Stale reconnect targets — do these second:**
6. Trimble Ventures
7. BOLD Capital Partners
8. SineWave Ventures
9. Flybridge
10. Cherubic Ventures
11. Eclipse Ventures
12. Union Square Ventures

### For each fund, find:
- The managing partner OR the partner most likely to co-invest in deep tech
- 1 person per fund minimum, 2 is better
- Their exact title (Managing Partner / General Partner / Partner)
- Their LinkedIn URL (full URL, paste directly)
- Fund website domain (e.g. `riotvc.com`)

### Sources
Crunchbase, fund website team page, LinkedIn, Pitchbook if you have access.
No scraping needed — manual copy-paste research only.

**Do not guess.** If you cannot confirm a name from a public source, leave
the cell blank. Wrong data is worse than no data.

---

## LUBA — Scraping + DB Enrichment

### Tuesday Morning — Schema + Clearbit Script (3 hours)

**1. Add logo_url to fund table**

Run against Railway immediately:
```sql
ALTER TABLE fund ADD COLUMN IF NOT EXISTS logo_url TEXT;
```

Update `schema.sql` so it stays idempotent:
```sql
-- in the fund table CREATE TABLE IF NOT EXISTS block:
logo_url         TEXT,
```

**2. Create `scripts/enrich-funds.ts`**

For each fund in the DB:
- Read `fund.website`
- Construct Clearbit URL: `https://logo.clearbit.com/{domain}`
- Write `logo_url` back to the fund row
- No API key needed — Clearbit Logo API is free

Example:
```ts
const logoUrl = `https://logo.clearbit.com/${domain}`;
await pool.query(`UPDATE fund SET logo_url = $1 WHERE id = $2`, [logoUrl, fund.id]);
```

### Tuesday Morning — Seed Fund Websites (30 min)

Update `seed.sql` fund INSERT blocks to include `website` values.
Research the domain for each fund (quick Google per fund — all public):

| Fund | Website |
|---|---|
| Riot Ventures | riotvc.com |
| Snowpoint Ventures | snowpoint.vc |
| General Catalyst | generalcatalyst.com |
| Mach33 | mach33.vc |
| SOSV | sosv.com |
| Trimble Ventures | trimbleventures.com |
| BOLD Capital Partners | boldcap.com |
| SineWave Ventures | sinewaveventures.com |
| Flybridge | flybridge.com |
| Cherubic Ventures | cherubic.com |
| Eclipse Ventures | eclipse.vc |
| Union Square Ventures | usv.com |
| a16z American Dynamism | a16z.com |
| Founders Fund | foundersfund.com |
| NEA | nea.com |
| ff Venture Capital | ffvc.com |
| Geodesic Capital | geodesiccap.com |
| Ubiquity Ventures | ubiquity.vc |
| Amazon Climate Pledge Fund | (skip — no Clearbit) |

Then run enrich script against Railway to populate `logo_url`.

### Tuesday Afternoon — Seed Investor Contacts (2 hours)

After Michael delivers `data/fund-contacts.csv`, create `seed-contacts.sql`:

```sql
-- seed-contacts.sql
-- Real investor contacts for priority funds
-- Source: manual research, public LinkedIn / fund websites, June 9 2026
-- PII: do not commit data/fund-contacts.csv (gitignored)

-- Truncate first so this is re-runnable
TRUNCATE investor RESTART IDENTITY CASCADE;

INSERT INTO investor (id, fund_id, name, role, linkedin_url, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    (SELECT id FROM fund WHERE name = 'Riot Ventures'),
    'Contact Name Here',
    'Managing Partner',
    'https://linkedin.com/in/...',
    now(), now()
  ),
  -- repeat for each fund
  ...
;
```

Run against Railway: `psql $DATABASE_URL -f seed-contacts.sql`

### Tuesday Afternoon — Wire Investors into lib/db.ts (2 hours)

**File:** `lib/db.ts`

Add investor JOIN to `REL_SELECT`:
```sql
LEFT JOIN investor i ON i.fund_id = f.id
```

Add investor JSON to the SELECT:
```sql
'investor', CASE WHEN i.id IS NOT NULL THEN json_build_object(
  'id',          i.id,
  'name',        i.name,
  'role',        i.role,
  'linkedinUrl', i.linkedin_url
) ELSE NULL END,
```

Add `logo_url` to the fund JSON:
```sql
'logoUrl', f.logo_url,
```

**File:** `lib/types.ts`

Add to the `Fund` interface:
```ts
logoUrl?: string;
```

Add to the `Relationship` interface:
```ts
investor?: {
  id: string;
  name: string;
  role: string;
  linkedinUrl?: string;
} | null;
```

**File:** `app/api/investors/route.ts`

Pass `investor` and `fund.logoUrl` through to the API response so the
frontend can consume them.

### Wednesday Morning — Signal Enrichment (2 hours)

Audit signal counts per fund:
```sql
SELECT f.name, r.warmth_tier, COUNT(s.id) AS signal_count
FROM relationship r
JOIN fund f ON f.id = r.fund_id
LEFT JOIN signal s ON s.relationship_id = r.id
GROUP BY f.name, r.warmth_tier
ORDER BY r.warmth_tier, signal_count;
```

Any Hot or Warm fund with fewer than 3 signals needs more. Add real,
verifiable signals to `seed.sql`:
- Co-investment dates: verify on Crunchbase
- Event attendance: verify from public event records
- Press mentions: link to actual articles

**Do not add signals you cannot verify.** If Lauren asks "where did this
come from?" you need a real answer.

### Wednesday — Run tests + deploy

```bash
npm run test:run          # all 34 must pass
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f seed.sql
psql $DATABASE_URL -f seed-contacts.sql
```

---

## YAASAMEEN — Frontend Polish

### Tuesday Morning — Profile Card Contact Section (3 hours)

**File:** `app/components/ProfileDrawer.tsx`

Add a "Point of Contact" section that renders only when `investor` data
exists on the relationship. Use the same pattern as other sections:

```
POINT OF CONTACT
[Name]  ·  [Title]
[LinkedIn ↗]        ← small external link, opens in new tab
```

- Section does not render if no investor data — no placeholder, no "TBD"
- LinkedIn link: `text-[#0EA5D6]` with external link icon, `target="_blank"`
- Name: `text-sm font-semibold text-[#0D1320]`
- Title: `text-xs text-[#9CA3AF]`

### Tuesday Morning — Relationship Narrative Summary (2 hours)

**File:** `app/components/ProfileDrawer.tsx`

Add a 2-sentence computed summary at the very top of the drawer content,
above the warmth badge. No AI, no new API calls — pure string interpolation
from existing data:

| Tier | Template |
|---|---|
| Hot | `"Active co-investor since [earliest co_investment year]. [N] signals over the past [X] months."` |
| Warm | `"Co-invested in [Company] in [year]. [N] signals — last contact [month year]."` |
| Stale | `"Last co-invested in [Company] in [year]. No contact in [N] months — relationship at risk."` |
| Cold | `"No prior co-investment with AlleyCorp. Identified as a target deep tech fund."` |

Style: `text-sm text-[#6B7280] leading-relaxed` — same as body text elsewhere.

### Tuesday Afternoon — Fund Logo (2 hours)

**Files:** `app/components/ProfileDrawer.tsx`, `app/components/InvestorRow.tsx`

Once Luba seeds `logo_url`, show it:

In `ProfileDrawer` header:
- 36×36 rounded logo next to fund name
- Use Next.js `<Image unoptimized>` for external Clearbit URLs
- Fallback: first letter of fund name in a teal circle (`bg-[#0EA5D6] text-white`)

In `InvestorRow`:
- 24×24 logo at the start of the row
- Same fallback pattern

### Tuesday Afternoon — AI Assistant Bulletproofing (2 hours)

Run all 5 Demo Day prompts 10 times each. Screenshot every output.

**Prompts to test:**
1. "Who should we reconnect with before they lead a round without us?"
2. "Who are our warmest relationships right now?"
3. "What should I know before our meeting with General Catalyst?"
4. "Are there top deep tech funds we haven't co-invested with yet?"
5. "Show me the full picture on Trimble Ventures."

**Fix if any of these happen:**
- Em dashes appear in output (`renderInline` should catch them — verify)
- Response takes >4 seconds
- Fund cards don't match the answer text
- Raw markdown (`**bold**`, `---`) leaks through
- Prompt 3 or 5 returns "no fund found" (check `getInvestorByName` matching)

Flag anything consistently unreliable to Luba — may need system prompt
or tool data fixes.

### Wednesday Morning — Signal Evidence Display (2 hours)

**File:** `app/components/ProfileDrawer.tsx`

Improve the signals section so "why is this fund Warm?" is immediately
readable:

- Group signals by type
- Show source name prominently (e.g. "DTNY: Deep Tech New York")
- For `co_investment`: show portfolio company name inline
- For `event_attendance`: show event name as the primary label
- For `press_mention`: show source as a link if URL available
- Remove raw signal type strings — use human-readable labels:
  - `co_investment` → "Co-investment"
  - `event_attendance` → "Event"
  - `linkedin_connection` → "LinkedIn"
  - `press_mention` → "Press"
  - `co_investment_recency` → "Recent co-investment"
  - `email_contact` → "Email contact"

### Wednesday Afternoon — Demo Rehearsal Support

Join the 2pm rehearsal. Fix any visual issues that come up.
After rehearsal: fix top 3 issues only. Nothing else.

---

## Wednesday Schedule (Both)

| Time | Activity |
|---|---|
| Morning | Luba: signal enrichment + deploy. Yaasameen: signal evidence display. |
| 12pm | Deploy latest to Railway. Run `npm run test:run`. |
| 2pm | Full demo rehearsal — one person plays Abe, two people watch. |
| 3pm | Fix top 3 issues from rehearsal only. |
| 6pm | **Code freeze.** No new features. Bug fixes only. |

---

## Files Being Created / Modified

| File | Owner | What |
|---|---|---|
| `schema.sql` | Luba | Add `logo_url` to fund table |
| `seed.sql` | Luba | Add `website` values to fund inserts |
| `seed-contacts.sql` | Luba | New — investor contacts (not gitignored) |
| `scripts/enrich-funds.ts` | Luba | Clearbit logo fetch + write to DB |
| `lib/db.ts` | Luba | Join investor table, add logo_url to fund JSON |
| `lib/types.ts` | Luba | Add investor + logoUrl fields |
| `app/api/investors/route.ts` | Luba | Pass investor + logoUrl through to response |
| `app/components/ProfileDrawer.tsx` | Yaasameen | Contact section, narrative summary, logo, signal labels |
| `app/components/InvestorRow.tsx` | Yaasameen | Fund logo |
| `data/fund-contacts.csv` | Michael | Research deliverable — **gitignored (PII)** |

---

## Do Not Touch Before Thursday

- `mcp/` — invisible to stakeholders, Yaasameen resumes after Thursday
- Events data model — Phase 2
- LinkedIn scraping — rate limits + legal gray area
- `lib/scoring.ts`, `lib/alerts.ts`, `lib/alerts.server.ts` — working correctly, don't touch
- Any new pages or navigation items
- Dark mode — done
- Any new features after Wednesday 6pm

---

## Demo Flow (Thursday, ~12 minutes)

**Opening (1 min)**
Don't start with the UI. Start with the problem:
> "AlleyCorp co-invests with dozens of funds. The problem is relationship
> decay — a fund that was a great partner two years ago might be cold today,
> and you don't find out until they lead a round without you. We built a
> system that tells you exactly where each relationship stands and what to
> do about it."

**Scene 1 — Network Health (2 min)**
Open the dashboard. Show the hero card. Point to the warmth breakdown.
Click "Needs outreach" to filter to Stale funds.
> "These are the relationships that need a call this week."

**Scene 2 — Profile Deep Dive (3 min)**
Click into a Stale fund. Show the profile card: warmth tier, relationship
narrative, contact name, specific signals with dates, suggested action.
Then click into a Hot fund. Show the contrast.
> "The system knows the difference between a fund you saw last month and
> one you haven't heard from in two years."

**Scene 3 — AI Assistant (4 min)**
Open Ask the Network. Run these three prompts live:
1. "Who should we reconnect with before they lead a round without us?"
2. "What should I know before our meeting with General Catalyst?"
3. "Show me the full picture on Trimble Ventures."

Have prompts 4 and 5 ready if Lauren asks to see more. Don't volunteer them.

**Scene 4 — Daily Digest (1 min)**
Switch to Digest view briefly.
> "Every morning, Abe gets a digest of which relationships moved and
> what needs attention."

**Closing (1 min)**
> "Everything you just saw runs on your actual co-investor data. The warmth
> scores are deterministic — no AI hallucination in the scoring layer. The
> AI only touches the natural language interface. We can add new signals,
> new funds, and new events as your network grows."

Leave 10 minutes for questions.

---

## Risks

| Risk | Mitigation |
|---|---|
| AI prompt slow or unreliable | Rehearse all 3 demo prompts 10x Wednesday. Have screenshot backup. |
| Lauren corrects data live | Get the warmth tier breakdown in front of her before Thursday if possible. |
| Railway outage during demo | Screenshot key screens Tuesday after enrichment. Keep as backup. |
| Michael's research incomplete | 5 Hot/Warm funds are enough. Stale funds are bonus. |
| Logo URLs broken / slow | Test Clearbit for all 12 priority funds before demo. Remove `logo_url` render if flaky. |

---

*Plan written June 8 2026 · Demo Day target June 24 2026*
