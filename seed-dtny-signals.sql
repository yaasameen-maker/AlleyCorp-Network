-- DTNY Event Signals — January 28, 2026
-- Source: DTNY Registration.xlsx (Lauren Young, June 2026)
-- 6 AlleyCorp co-investors attended Deep Tech New York (DTNY) on Jan 28, 2026
-- Signal type: event_attendance · Weight: medium

BEGIN;

-- USV has no relationship row yet — create one (cold, no co-investment)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Union Square Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Glacier'),
  'cold',
  '2026-01-28',
  now(), now()
);

-- Riot Ventures — Nolan Van Nortwick (Principal) attended DTNY
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT r.id FROM relationship r JOIN fund f ON f.id = r.fund_id WHERE f.name = 'Riot Ventures' LIMIT 1),
  'event_attendance',
  '2026-01-28',
  'DTNY — Deep Tech New York',
  'Nolan Van Nortwick (Principal) attended AlleyCorp DTNY event',
  'medium',
  'confirmed',
  now()
);

-- BOLD Capital Partners — Will Borthwick (Partner) attended DTNY
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT r.id FROM relationship r JOIN fund f ON f.id = r.fund_id WHERE f.name = 'BOLD Capital Partners' LIMIT 1),
  'event_attendance',
  '2026-01-28',
  'DTNY — Deep Tech New York',
  'Will Borthwick (Partner) attended AlleyCorp DTNY event',
  'medium',
  'confirmed',
  now()
);

-- Eclipse Ventures — Gareth Kaczkowski (Investor) attended DTNY
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT r.id FROM relationship r JOIN fund f ON f.id = r.fund_id WHERE f.name = 'Eclipse Ventures' LIMIT 1),
  'event_attendance',
  '2026-01-28',
  'DTNY — Deep Tech New York',
  'Gareth Kaczkowski (Investor) attended AlleyCorp DTNY event',
  'medium',
  'confirmed',
  now()
);

-- ff Venture Capital — Oliver Mitchell (Partner) attended DTNY
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT r.id FROM relationship r JOIN fund f ON f.id = r.fund_id WHERE f.name = 'ff Venture Capital' LIMIT 1),
  'event_attendance',
  '2026-01-28',
  'DTNY — Deep Tech New York',
  'Oliver Mitchell (Partner) attended AlleyCorp DTNY event',
  'medium',
  'confirmed',
  now()
);

-- Union Square Ventures — Nikhil Raman (Investor) attended DTNY
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT r.id FROM relationship r JOIN fund f ON f.id = r.fund_id WHERE f.name = 'Union Square Ventures' LIMIT 1),
  'event_attendance',
  '2026-01-28',
  'DTNY — Deep Tech New York',
  'Nikhil Raman (Investor) attended AlleyCorp DTNY event',
  'medium',
  'confirmed',
  now()
);

-- a16z American Dynamism — Will Bitsky (Partner) attended DTNY
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT r.id FROM relationship r JOIN fund f ON f.id = r.fund_id WHERE f.name = 'a16z American Dynamism' LIMIT 1),
  'event_attendance',
  '2026-01-28',
  'DTNY — Deep Tech New York',
  'Will Bitsky (Partner) attended AlleyCorp DTNY event',
  'medium',
  'confirmed',
  now()
);

-- Update last_signal_date for all affected relationships
UPDATE relationship SET last_signal_date = '2026-01-28', updated_at = now()
WHERE fund_id IN (
  SELECT id FROM fund WHERE name IN (
    'BOLD Capital Partners', 'Eclipse Ventures', 'ff Venture Capital',
    'Union Square Ventures', 'a16z American Dynamism'
  )
);

COMMIT;
