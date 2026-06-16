-- Migration 007: Normalize verified market prospect metadata after the
-- source-gated prospect importer write.
--
-- Purpose:
-- - avoid duplicate Eclipse / Eclipse Ventures rows
-- - keep VIP false for market prospects
-- - clear or replace older seeded fields that were not backed by the Jun 15
--   field-level evidence file

BEGIN;

WITH canonical AS (
  SELECT id FROM fund WHERE name = 'Eclipse Ventures' LIMIT 1
),
duplicate AS (
  SELECT id, notes FROM fund WHERE name = 'Eclipse' LIMIT 1
)
UPDATE relationship r
SET fund_id = canonical.id
FROM canonical, duplicate
WHERE r.fund_id = duplicate.id
  AND duplicate.id <> canonical.id;

WITH canonical AS (
  SELECT id FROM fund WHERE name = 'Eclipse Ventures' LIMIT 1
),
duplicate AS (
  SELECT id, notes FROM fund WHERE name = 'Eclipse' LIMIT 1
)
UPDATE fund f
SET notes = COALESCE(f.notes, duplicate.notes)
FROM canonical, duplicate
WHERE f.id = canonical.id
  AND duplicate.id <> canonical.id;

DELETE FROM fund duplicate
USING fund canonical
WHERE duplicate.name = 'Eclipse'
  AND canonical.name = 'Eclipse Ventures'
  AND duplicate.id <> canonical.id;

UPDATE fund
SET
  name = 'Eclipse',
  website = 'https://eclipse.capital',
  focus = 'Physical economy and critical systems',
  stage = NULL,
  hq_location = NULL,
  geography_focus = 'Physical economy and critical systems',
  check_size_proxy = NULL,
  aum_tier = NULL,
  deep_tech_signal = 'Eclipse says it partners with innovators transforming the physical economy and strengthening the resilience, competitiveness, and security of critical systems.',
  investor_status = 'market_prospect',
  is_vip = false,
  profile_last_checked_at = now(),
  updated_at = now()
WHERE name = 'Eclipse Ventures';

UPDATE fund
SET
  website = 'https://www.luxcapital.com',
  focus = 'Science and technology venture capital',
  stage = 'Any stage',
  hq_location = 'New York City / Silicon Valley',
  geography_focus = 'New York City and Silicon Valley network',
  check_size_proxy = '$100K to $100M stated investment range',
  aum_tier = 'Large ($7B+ AUM)',
  deep_tech_signal = 'Lux describes itself as a science and tech venture capital firm investing at the intersection of new and not-yet-imagined technologies.',
  investor_status = 'market_prospect',
  is_vip = false,
  profile_last_checked_at = now(),
  updated_at = now()
WHERE name = 'Lux Capital';

UPDATE fund
SET
  website = 'https://a16z.com/american-dynamism/',
  focus = 'American Dynamism: aerospace, defense, public safety, education, housing, supply chain, industrials, and manufacturing',
  stage = NULL,
  hq_location = NULL,
  geography_focus = 'US national-interest sectors with companies across all 50 states and global impact',
  check_size_proxy = NULL,
  aum_tier = NULL,
  deep_tech_signal = 'American Dynamism invests in aerospace, defense, public safety, education, housing, supply chain, industrials, and manufacturing companies that support the national interest.',
  investor_status = 'market_prospect',
  is_vip = false,
  profile_last_checked_at = now(),
  updated_at = now()
WHERE name = 'a16z American Dynamism';

UPDATE fund
SET
  investor_status = 'market_prospect',
  is_vip = false,
  profile_last_checked_at = now(),
  updated_at = now()
WHERE name = 'Starburst';

DELETE FROM signal s
USING relationship r
JOIN fund f ON f.id = r.fund_id
WHERE s.relationship_id = r.id
  AND f.name IN ('a16z American Dynamism', 'Eclipse')
  AND r.portfolio_company_id IS NULL
  AND s.source_url IS NULL;

DELETE FROM relationship r
USING fund f
WHERE r.fund_id = f.id
  AND f.name IN ('a16z American Dynamism', 'Eclipse')
  AND r.portfolio_company_id IS NULL;

COMMIT;
