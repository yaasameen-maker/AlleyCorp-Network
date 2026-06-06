# Signal Ingestion Pipeline — Technical Proposal
**Author:** Luba · **Date:** June 4, 2026 · **Status:** Implemented (Phase 1 complete)

---

## 1. Current Architecture

```
Exa search (3 queries per target)
  → dedupe by URL
  → Claude tool_use extraction (schema-enforced)
  → source-based confidence scoring
  → unique_hash deduplication
  → Neon INSERT ON CONFLICT DO NOTHING
  → UPDATE relationship.last_signal_date
```

**Stack:** TypeScript · exa-js · @anthropic-ai/sdk · pg (Neon) · tsx

**Current targets:** 17 fund+company relationships, 3 queries each = 51 Exa searches per run.

**Results so far:**
- 36 real signals in Neon from live web sources
- Sources: TechCrunch, Bloomberg, PR Newswire, BusinessWire, Axios, Crunchbase
- Zero fabricated signals — if not explicitly in the article, not inserted
- Safe to re-run: ON CONFLICT DO NOTHING + unique_hash prevents duplicates

---

## 2. Improvements Implemented (this PR)

### Priority 1 — Structured Outputs
**Problem:** `JSON.parse()` of free-form Claude text failed on ~30% of targets (truncated output, apostrophes in snippets).
**Fix:** Claude tool_use with `tool_choice: { type: "tool", name: "extract_signals" }`. Schema-enforced extraction — malformed output is impossible.
**Impact:** Zero parse errors across all 17 targets.

### Priority 2 — Quoted Search Terms
**Problem:** Generic queries returned false positives. "Halo Braid" queries returned Halo Industries, Hailo, HALO Technologies.
**Fix:** All company names wrapped in quotes: `"Halo Braid" funding investor` instead of `Halo Braid funding investors 2024`.
**Impact:** SineWave+AON3D (5 signals), NEA+Glacier (5 signals) — both previously returned 0.

### Priority 4 — Source-Based Confidence
**Problem:** Confidence was left to Claude's judgment. Crunchbase person pages were getting `confirmed` confidence.
**Fix:** Confidence derived from URL domain at insert time:
- `confirmed` → TechCrunch, Bloomberg, PR Newswire, BusinessWire, Axios, Reuters
- `inferred` → Crunchbase, Forbes, WSJ, CNBC
- `pending` → everything else
**Impact:** Objective, reproducible confidence scoring. Scoring engine can weight by confidence.

---

## 3. Recommended Next Improvements (post-June 11)

### Priority 3 — Company-First Ingestion
**Problem:** Searching per fund+company pair means the same funding event is rediscovered multiple times.
- Current: 51 searches for 17 targets → 39 candidates → 27 duplicates (69% waste)
- Proposed: Search per company (12 companies) → extract all investors → map to relationships

**Architecture:**
```
For each portfolio company:
  1. Exa search: "{Company}" funding round investors
  2. Extract all co-investors from results
  3. Match co-investors to existing relationship records
  4. Insert signals for matched relationships only
```

**Expected impact:**
- Searches per run: 51 → ~24 (50% reduction)
- Duplicate rate: ~70% → ~20%
- Cost: ~$0.50/run → ~$0.25/run
- Signal consistency: same funding event produces identical signals for all investors

### Priority 5 — Signal Quality / Scoring Weights
**Problem:** Press mentions and co-investment signals carry equal weight in current scoring.
**Recommendation (for Yaasameen):** Adjust `lib/scoring.ts` weights:
- `co_investment` (confirmed): 10 pts — keep
- `co_investment` (inferred): 5 pts — add
- `press_mention` (confirmed): 2 pts — reduce from current
- `event_attendance` (confirmed): 3 pts — keep
- `press_mention` (pending): 0.5 pts — new

**Evidence:** 36 signals in DB, 28 are co_investment (78%), 8 are press_mention (22%). Co-investment signals are the primary warmth driver.

---

## 4. Expected Impact Summary

| Metric | Before | After (Phase 1) | After (Phase 2) |
|---|---|---|---|
| Parse failure rate | ~30% | 0% | 0% |
| False positives | High (Halo Industries, etc.) | Low | Low |
| Signals per run | 25 | 38–40 | 30–35 (less waste) |
| Duplicate rate | ~69% | ~69% | ~20% |
| Confidence source | Claude judgment | URL domain | URL domain |
| API cost per run | ~$0.50 | ~$0.50 | ~$0.25 |

---

## 5. Running the Pipeline

```bash
# Dry run — see candidates, no DB writes
npm run ingest:signals

# Live run — insert into Neon
npm run ingest:signals -- --write

# GitHub Actions (manual trigger until stable)
# Go to repo → Actions → Daily Signal Ingestion → Run workflow
# Enable daily schedule only after 3+ successful manual runs
```

**Required env vars:** `DATABASE_URL`, `ANTHROPIC_API_KEY`, `EXA_API_KEY`
