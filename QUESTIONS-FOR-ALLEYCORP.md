# Questions for AlleyCorp
# Bring to June 11 office visit. Add new questions as they come up during build.

**Office visit:** June 11, 2026  
**Contact:** Abe / Lauren Young  
**Last updated:** June 7, 2026

---

## Data & Scope

**Q1 — Do we track angel investors and family offices as co-investors?**  
Example: The Grote family (Jim Grote) co-led Appetronix's $10M+ seed alongside AlleyCorp. They're not a VC fund. Should they appear in the relationship intelligence tool as a tracked co-investor? Or should we only track institutional funds?

**Q2 — Portal Space Systems name**  
We have "Portal Space Systems" in the DB. Lauren's message referenced "Portal System." Is the full legal name "Portal Space Systems"? Don't want to change without confirmation.

**Q3 — What do you want to see for companies with no public co-investor data?**  
5 companies returned zero results from web search: Avatar, Root Access, dolaGon, ARIX Technologies, Spaero Bio. Should we show them on the dashboard with no co-investor data (blank/unknown), or does AlleyCorp have internal data on who co-invested? Can Lauren pull Crunchbase or cap table records for these?

**Q4 — Swoogo contacts: any way to get per-event export?**  
The Swoogo CSV Lauren shared has no dates or event names — it's a flat contact list. It's not actionable for signal tracking. If Lauren can export per-event registration lists (like she did for DTNY), we can ingest those as signals. Worth asking.

---

## Product Direction

**Q5 — Alley Robotics Ventures (ARV): treat as internal or external?**  
ARV is AlleyCorp's own robotics fund. It appears as a co-investor in Koop Technologies, Mapless AI, and Dexai Robotics. Should ARV be treated as a known internal fund (no need to track warmth — it's always "hot" by default), or tracked like any other co-investor?

**Q6 — Government grant agencies: include or exclude?**  
NSF and Massachusetts Technology Collaborative appear as funders for Mapless AI. They're grant agencies, not VCs. Should they appear in the tool at all, or should co-investor tracking be limited to institutional equity investors?

**Q7 — Alumni companies: same dashboard or separate?**  
We have 3 alumni companies (Aescape, Spaero Bio, Dexai Robotics) in the DB. Should their co-investor relationships appear in the main dashboard, or should alumni be filtered out by default?

**Q8 — Warmth tier: who decides "stale" threshold?**  
Currently: <12mo signal → hot, 12-24mo → warm, 24mo+ → stale. Does this match how AlleyCorp thinks about relationship decay? Some deep tech funds move slower — is 24 months too aggressive for "stale"?

**Q8b — Event-only attendance: Cold or Stale?**  
Example: Union Square Ventures attended DTNY in January 2026 but has no co-investment history with AlleyCorp. The scoring rules say 1 active signal = Stale, but Stale normally implies a relationship that *used to be warm and lapsed*. Should a fund with zero co-investment history that only attended one event be shown as Cold (no real relationship yet) or Stale (they engaged once)? The answer will set the rule for all similar accounts — BOLD Capital Partners, ff Venture Capital, a16z American Dynamism, and others who appear only from DTNY attendance.

---

## Demo Day

**Q9 — Demo Day prompt 5: confirm it's Trimble Ventures, not Lux Capital**  
Early docs said "Show me the full picture on Lux Capital." Lux Capital was removed from the DB (their co-investment Inductive Bio isn't on Lauren's confirmed list). We now use Trimble Ventures. Confirm this is right before June 24.

**Q10 — Who is "Abe" in the demo scenario?**  
The acceptance tests and demo script are written from Abe's POV. Is this Abe Strauss (AlleyCorp)? Confirm so we get the persona right in the demo narrative.

---

## Notes
- Add new questions here as you find them during build or data research
- Mark answered questions with ✅ and the answer inline
- Bring printed copy to June 11 — don't rely on screen
