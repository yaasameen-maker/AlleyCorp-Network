-- Migration 005: Backfill verified source URLs (batch 2)
-- Researched June 14 2026. Every URL below was checked to confirm the article
-- explicitly names the fund + portfolio company + round before being attached.
-- Sources that only appear in candidate-only directories (Crunchbase/PitchBook/
-- Tracxn), and DTNY event-attendance signals (internal registration list, no public
-- URL), are intentionally left blank. Do not add a URL you have not verified.

BEGIN;

-- NEA + Glacier — Seed $4.5M Apr 2022 (NEA named as lead).
UPDATE signal s
SET source = 'PR Newswire',
    source_url = 'https://www.prnewswire.com/news-releases/glacier-raises-4-5m-to-combat-climate-change-with-ai-powered-recycling-robots-301527666.html',
    source_title = 'Glacier Raises $4.5M to Combat Climate Change with AI-Powered Recycling Robots'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND f.name = 'NEA' AND pc.name = 'Glacier'
  AND s.signal_date = '2022-04-19' AND s.value ILIKE '%Seed%';

-- Riot Ventures + Valar Atomics — corrected to the verified $19M seed (Feb 20 2025,
-- led by Riot, AlleyCorp participated). Prior row said "Mar 2025 co-led" — inaccurate.
UPDATE signal s
SET signal_date = '2025-02-20',
    value = 'Seed $19M · Feb 2025 · led by Riot Ventures (AlleyCorp participated)',
    source = 'TechCrunch',
    source_url = 'https://techcrunch.com/2025/02/20/valar-atomics-comes-out-of-stealth-with-19m-and-a-pilot-reactor-site/',
    source_title = 'Valar Atomics comes out of stealth with $19M and a pilot reactor site'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND f.name = 'Riot Ventures' AND pc.name = 'Valar Atomics'
  AND s.value ILIKE '%Seed%';

-- Day One Ventures + Valar Atomics — same $19M seed (Day One named as participant).
UPDATE signal s
SET source = 'TechCrunch',
    source_url = 'https://techcrunch.com/2025/02/20/valar-atomics-comes-out-of-stealth-with-19m-and-a-pilot-reactor-site/',
    source_title = 'Valar Atomics comes out of stealth with $19M and a pilot reactor site'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND f.name = 'Day One Ventures' AND pc.name = 'Valar Atomics'
  AND s.value ILIKE '%Seed%';

-- Snowpoint Ventures + Valar Atomics — Series A $130M Nov 2025 (Snowpoint named as lead).
UPDATE signal s
SET source = 'TradedVC',
    source_url = 'https://traded.co/vc/deal/valar-atomics-closes-130-million-series-a-funding-round-led-by-snowpoint-ventures/',
    source_title = 'Valar Atomics Closes $130 Million Series A Funding Round Led By Snowpoint Ventures'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND f.name = 'Snowpoint Ventures' AND pc.name = 'Valar Atomics'
  AND s.value ILIKE '%Series A%';

-- Geodesic Capital + Portal Space Systems — Series A $50M Apr 2026 (named as co-lead).
UPDATE signal s
SET source = 'SpaceNews',
    source_url = 'https://spacenews.com/portal-space-systems-raises-50-million-to-accelerate-spacecraft-development/',
    source_title = 'Portal Space Systems raises $50 million to accelerate spacecraft development'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND f.name = 'Geodesic Capital' AND pc.name = 'Portal Space Systems'
  AND s.value ILIKE '%Series A%';

-- Mach33 + Portal Space Systems — same Series A (Mach33 named as co-lead).
UPDATE signal s
SET source = 'SpaceNews',
    source_url = 'https://spacenews.com/portal-space-systems-raises-50-million-to-accelerate-spacecraft-development/',
    source_title = 'Portal Space Systems raises $50 million to accelerate spacecraft development'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND f.name = 'Mach33' AND pc.name = 'Portal Space Systems'
  AND s.value ILIKE '%Series A%';

-- Trimble Ventures + Civ Robotics — Seed $5M Sep 2022 (dedicated Trimble press release).
UPDATE signal s
SET source = 'PR Newswire',
    source_url = 'https://www.prnewswire.com/news-releases/trimble-ventures-invests-in-civ-roboticsa-construction-tech-startup-focused-on-autonomous-surveying-solutions-301629136.html',
    source_title = 'Trimble Ventures Invests in Civ Robotics'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND f.name = 'Trimble Ventures' AND pc.name = 'Civ Robotics'
  AND s.value ILIKE '%Seed%';

-- ff Venture Capital + Civ Robotics — Seed $5M Sep 2022 (ffVC named as lead).
UPDATE signal s
SET source = 'GlobeNewswire',
    source_url = 'https://www.globenewswire.com/news-release/2022/09/21/2520253/0/en/Civ-Robotics-Raises-5-Million-Seed-Funding-Round.html',
    source_title = 'Civ Robotics Raises $5 Million Seed Funding Round'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND f.name = 'ff Venture Capital' AND pc.name = 'Civ Robotics'
  AND s.value ILIKE '%Seed%';

-- ff Venture Capital + Civ Robotics — Series A $7.5M Jul 1 2025 (ffVC named participant).
UPDATE signal s
SET signal_date = '2025-07-01',
    source = 'The Robot Report',
    source_url = 'https://www.therobotreport.com/civ-robotics-spots-series-a-funding-automated-surveying/',
    source_title = 'Civ Robotics spots Series A funding for automated surveying'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND f.name = 'ff Venture Capital' AND pc.name = 'Civ Robotics'
  AND s.value ILIKE '%Series A%';

-- SOSV + Renovate Robotics — Pre-Seed $2.5M 2023 (SOSV/HAX named, SOSV's own release).
UPDATE signal s
SET source = 'SOSV',
    source_url = 'https://sosv.com/haxs-renovate-robotics-closes-2-5m-pre-seed-to-automate-roofing/',
    source_title = 'HAX''s Renovate Robotics closes $2.5M pre-seed to automate roofing'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND f.name = 'SOSV' AND pc.name = 'Renovate Robotics'
  AND s.value ILIKE '%Pre-Seed%';

COMMIT;
