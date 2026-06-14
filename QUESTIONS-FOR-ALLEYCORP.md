# Questions for AlleyCorp

# Bring to June 11 office visit with Lauren Young and Kabir. Add new questions as they come up during build.

**Office visit:** June 11, 2026  
**Contact:** Lauren Young / Kabir  
**Last updated:** June 10, 2026

---

## Data & Scope

**Q1 — Do we track angel investors and family offices as co-investors?**  
Example: The Grote family (Jim Grote) co-led Appetronix's $10M+ seed alongside AlleyCorp. They're not a VC fund. Should they appear in the relationship intelligence tool as a tracked co-investor? Or should we only track institutional funds?

**Q2 — Portal Space Systems name**  
We have "Portal Space Systems" in the DB. Lauren's message referenced "Portal System." Is the full legal name "Portal Space Systems"? Don't want to change without confirmation.

**Q3 — Avatar: are there any external co-investors, or is ARV the sole backer?**  
Avatar was co-founded and incubated by AlleyCorp and backed by ARV. We didn't find any external co-investors in public records — is that by design, or are there investors we should be tracking for this company?

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

**Q8 — Warmth tier: do the thresholds feel right?**  
The tool scores relationships as Hot, Warm, Stale, or Cold based on how many signals exist and how recent they are. Hot means active co-investment in the last 18 months with multiple touchpoints. Stale means the last signal was over 6 months ago. Cold means no real relationship yet. Do these categories match how AlleyCorp actually thinks about relationship health? Are there funds showing the wrong tier that feel off?

**Q8b — Funds who only attended an event: how should we show them?**  
Several funds attended DTNY (Jan 2026) but have never co-invested with AlleyCorp — USV, a16z American Dynamism, Eclipse Ventures. We currently show them as Cold with a note that they attended the event. Does that feel right? Or should attending an AlleyCorp event count as the start of a relationship and show them as Warm/Stale instead of Cold?

---

## Demo Day

**Q9 — Demo Day prompt 5: confirm it's Trimble Ventures, not Lux Capital**  
Early docs said "Show me the full picture on Lux Capital." We no longer treat Lux as a co-investor — their only candidate co-investment (Inductive Bio) isn't on Lauren's confirmed list. After the June 11 pivot, Lux stays in the DB as a deep tech market prospect (no co-investment), and Demo Day prompt 5 now uses Trimble Ventures. Confirm this is right before June 24.

**Q10 — Who is "Abe" in the demo scenario?**  
The acceptance tests and demo script are written from Abe's POV. Is this Abe Strauss (AlleyCorp)? Confirm so we get the persona right in the demo narrative.

---

**Q12 — How should we keep co-investor data in sync as the portfolio changes?**  
Right now co-investor data is researched manually. When AlleyCorp makes a new investment, someone has to find who else invested. We want to automate this. The best source depends on what AlleyCorp has access to — Crunchbase API (paid, reliable), cap table exports from Lauren, or web scraping (free but misses stealth rounds — we nearly missed Avatar's $6M seed with Defy Partners and REFASHIOND Ventures). What's realistic for us to use?

**Q11 — Do you want to discover new funds through your existing co-investors' networks?**  
Example: Riot Ventures co-invested in a company alongside Fund X, who AlleyCorp has never met. The tool could surface Fund X as a "2nd-degree connection — met through Riot Ventures." Is that something you'd use? Right now the tool only knows about funds that have directly co-invested with AlleyCorp or attended one of your events. Expanding to 2nd-degree connections is doable but would be a bigger build — want to know if it's worth prioritizing.

---

## Notes

- Add new questions here as you find them during build or data research
- Mark answered questions with ✅ and the answer inline
- Bring printed copy to June 11 — don't rely on screen
