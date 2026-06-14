-- Migration 004: Backfill verified source URLs
-- Non-destructive QA pass for the highest-confidence seeded signals.
-- Adds only URLs that were verified directly. Clears homepage placeholders and
-- inferred profile slugs so the UI does not present assumptions as evidence.

BEGIN;

UPDATE signal
SET source_url = NULL
WHERE source = 'AlleyCorp Substack'
  AND source_url = 'https://alleycorp.substack.com';

UPDATE signal
SET source_url = NULL
WHERE source = 'Crunchbase'
  AND source_url ILIKE 'https://www.crunchbase.com/organization/%';

UPDATE signal
SET source_title = 'Crunchbase'
WHERE source = 'Crunchbase'
  AND source_title ILIKE 'Crunchbase profile:%';

UPDATE signal s
SET source_url = NULL
FROM relationship r
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND s.source = 'Crunchbase'
  AND pc.name IN (
    'Valar Atomics',
    'Portal Space Systems',
    'Civ Robotics',
    'Halo Braid',
    'Cargo Robotics'
  );

UPDATE signal s
SET
  source = 'TechCrunch',
  source_url = 'https://techcrunch.com/2025/08/26/eyebot-gets-20m-series-a-to-boost-to-expand-eye-care-access/',
  source_title = 'Eyebot gets $20M Series A to expand eye care access'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Eyebot'
  AND f.name IN ('General Catalyst', 'Ubiquity Ventures')
  AND s.signal_date = '2025-08-26'
  AND s.value ILIKE '%Series A $20M%';

UPDATE signal s
SET
  source = 'TechCrunch',
  source_url = 'https://techcrunch.com/2024/06/06/eyebot-raised-6m-for-ai-powered-kiosks-that-provide-90-second-eye-exams-without-optometrist/',
  source_title = 'Eyebot raised $6M for AI-powered kiosks that provide 90-second vision exams without an on-site optometrist'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Eyebot'
  AND f.name = 'Ubiquity Ventures'
  AND s.signal_date = '2024-06-01'
  AND s.value ILIKE '%Seed $6M%';

UPDATE signal s
SET
  source = 'TechCrunch',
  source_url = 'https://techcrunch.com/2025/04/28/amazon-backed-glacier-gets-16m-to-expand-its-robot-recycling-fleet/',
  source_title = 'Amazon-backed Glacier gets $16M to expand its robot recycling fleet'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Glacier'
  AND f.name IN ('NEA', 'Amazon Climate Pledge Fund')
  AND s.signal_date = '2025-04-28'
  AND s.value ILIKE '%Series A $16M%';

UPDATE signal s
SET
  source = 'Glacier',
  source_url = 'https://endwaste.io/glacier-amazon-partnership-html/',
  source_title = 'GLACIER + AMAZON'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Glacier'
  AND f.name IN ('NEA', 'Amazon Climate Pledge Fund')
  AND s.signal_date = '2024-03-01'
  AND s.value ILIKE '%Seed Extension $7.7M%';

UPDATE signal s
SET
  source = 'TechCrunch',
  source_url = 'https://techcrunch.com/2021/09/02/3d-printing-startup-aon3d-closes-11-5m-series-a/',
  source_title = 'AON3D closes $11.5M Series A, partners with Astrobotic to send 3D-printed parts to the moon'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Aon 3D'
  AND f.name = 'SineWave Ventures'
  AND s.signal_date = '2021-09-02'
  AND s.value ILIKE '%Series A $11.5M%';

UPDATE signal s
SET
  source = 'GlobeNewswire',
  source_url = 'https://www.globenewswire.com/news-release/2022/11/29/2564034/0/en/Earth-Force-Technologies-Announces-8-6-Million-Raise-to-Prevent-Catastrophic-Wildfire.html',
  source_title = 'Earth Force Technologies Announces $8.6 Million Raise to Prevent Catastrophic Wildfire'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Earth Force'
  AND f.name = 'BOLD Capital Partners'
  AND s.signal_date = '2022-11-29'
  AND s.value ILIKE '%Seed $8.6M%';

COMMIT;
