# Frontend User Stories — AlleyCorp Investor Intelligence

Updated: June 1, 2026 · Demo Day: June 24, 2026

Each story is implemented in its own TSX file under `stories/` — one at a time, journey + UX first.

| # | Story | Priority | File |
|---|-------|----------|------|
| 1 | Investor Profile Transparency | P0 | `stories/InvestorProfileTransparency/` |
| 2 | Stale Alerts Banner | P0 | `stories/StaleAlertsBanner/` |
| 3 | MCP Query Interface | P0 | `stories/MCPQueryInterface/` |
| 4 | Investor Profile — Email Draft | P1 | `stories/InvestorProfileEmailDraft/` |
| 5 | Email Digest View | P1 | `stories/EmailDigestView/` |
| 6 | Portfolio Explorer | P2 | `stories/PortfolioExplorer/` |

---

## 1. Investor Profile Transparency (P0)

As an AlleyCorp partner,
I want to understand why a relationship received its warmth classification
So that I can trust the score and make informed decisions.

Acceptance Criteria
- Profile displays all active signals
- Each signal shows: type, source, date
- Last signal date is visible and human-readable (e.g. "Sep 2021 · 42 months ago")
- Current warmth tier is clearly displayed
- Co-investment history shows company name, round, and date — not just a count
- If multiple co-investments, most recent shown first
- User can understand the classification without additional explanation
- Data freshness is visible on the profile

---

## 2. Stale Alerts Banner (P0)

As an AlleyCorp partner,
I want to immediately see which relationships need attention when I open the dashboard
So that I can identify relationship risk without manually reviewing the full investor list.

Acceptance Criteria
- Alert section appears at the top of the dashboard
- Stale relationships appear before warm-at-risk relationships
- Each alert displays: investor/fund name, portfolio company, time since last signal (e.g. "14 months ago"), warmth tier, suggested next action
- Clicking an alert opens the investor profile
- Alerts are sorted by severity then recency
- Section is hidden if no alerts exist

---

## 3. MCP Query Interface (P0)

As an AlleyCorp partner,
I want to ask questions about the relationship network in plain English
So that I can find information without manually searching and filtering.

Acceptance Criteria
- Query input is visible on the dashboard
- User can submit natural language questions
- Results are displayed inline in a readable format
- System supports queries like:
  - "Show stale relationships"
  - "Who are our warmest co-investors?"
  - "Show me Trimble Ventures"
  - "Which investors co-invested in Civ Robotics?"
- Query results include links to relevant investor profiles
- Small label indicates which MCP tool was used (e.g. "via list_stale_relationships")
- Empty and error states are handled gracefully

---

## 4. Investor Profile — Email Draft (P1)

As an AlleyCorp partner,
I want a suggested outreach draft on an investor profile
So that I can quickly reconnect with investors without starting from a blank page.

Acceptance Criteria
- Email draft section visible on investor profiles for all warmth tiers
- Includes subject line and email body
- Draft adapts based on warmth tier:
  - Stale → reconnect ("it's been a while")
  - Warm → relationship maintenance
  - Hot → deal flow or event invite
- Draft addresses contact by first name if name is known
- Draft is editable before copying
- Copy-to-clipboard button available
- No email sending functionality required
- Gracefully handles missing contact information

---

## 5. Email Digest View (P1)

As an AlleyCorp partner,
I want to review a digest of relationship changes and alerts
So that I can quickly understand what requires attention this week.

Acceptance Criteria
- Digest accessible from dashboard navigation
- Displays: stale relationships, warm-at-risk relationships, new signals from the last 7 days
- Each item links to the relevant investor profile
- Digest items show timestamp and signal source
- View matches the format of the email digest
- "Send Digest Email" action available
- View is read-only

---

## 6. Portfolio Explorer (P2)

As an AlleyCorp partner,
I want to browse portfolio companies and their co-investor relationships
So that I can understand relationship coverage across the portfolio.

Acceptance Criteria
- Lists all active portfolio companies (17)
- Each company displays: name, sector, stage, AlleyCorp role, co-investor count
- Clicking a company shows: co-investing funds, warmth tiers, relationship status
- Portfolio companies can be filtered by sector
- Alumni companies appear in a separate collapsed section
