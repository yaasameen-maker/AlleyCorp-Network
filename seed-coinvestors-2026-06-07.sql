-- Co-investor Discovery Seed — June 7, 2026
-- Source: scripts/discover-coinvestors.ts output, manually reviewed
-- Run AFTER seed.sql and seed-dtny-signals.sql
--
-- Excluded from this file (see QUESTIONS-FOR-ALLEYCORP.md for rationale):
--   AlleyCorp          — host firm, not a co-investor to track
--   Jim Grote          — individual; same entity as Grote Family below
--   NSF                — government grant agency, not a VC co-investor
--   Massachusetts Tech Collaborative — same
--   Fusion Fund        — Crunchbase snippet too thin; verify manually before adding

BEGIN;

-- ── Appetronix ────────────────────────────────────────────────────────────────
-- Source: https://www.prnewswire.com/news-releases/appetronix-closes-10m-in-total-seed-funding-302606925.html

INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'Grote Family', 'Food Tech / Robotics', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'Grote Family');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Grote Family'),
  (SELECT id FROM portfolio_company WHERE name = 'Appetronix'),
  'hot', '2025-11-06', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Grote Family' AND pc.name = 'Appetronix'
);

-- ── Koop Technologies ─────────────────────────────────────────────────────────
-- Source (2021 seed): https://www.prnewswire.com/news-releases/autonomous-vehicle-insurtech-koop-technologies-raises-2-5-million-seed-round-301360242.html
-- Source (2023 seed): https://www.crunchbase.com/funding_round/koop-technologies-seed--02afed30

INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'Ubiquity Ventures', 'Deep Tech / InsurTech', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'Ubiquity Ventures');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Ubiquity Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Koop Technologies'),
  'stale', '2021-08-23', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Ubiquity Ventures' AND pc.name = 'Koop Technologies'
);

INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'Bee Partners', 'Deep Tech', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'Bee Partners');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Bee Partners'),
  (SELECT id FROM portfolio_company WHERE name = 'Koop Technologies'),
  'stale', '2021-08-23', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Bee Partners' AND pc.name = 'Koop Technologies'
);

INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'Sure Ventures', 'InsurTech', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'Sure Ventures');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Sure Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Koop Technologies'),
  'stale', '2021-08-23', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Sure Ventures' AND pc.name = 'Koop Technologies'
);

INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'WestWave Capital', 'Deep Tech', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'WestWave Capital');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'WestWave Capital'),
  (SELECT id FROM portfolio_company WHERE name = 'Koop Technologies'),
  'stale', '2021-08-23', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'WestWave Capital' AND pc.name = 'Koop Technologies'
);

-- Alley Robotics Ventures — led 2023 $4M seed (Crunchbase, medium confidence)
INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'Alley Robotics Ventures', 'Robotics / Deep Tech', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'Alley Robotics Ventures');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Alley Robotics Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Koop Technologies'),
  'stale', '2023-07-11', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Alley Robotics Ventures' AND pc.name = 'Koop Technologies'
);

-- Fusion Fund — verify on Crunchbase before uncommenting:
-- https://www.crunchbase.com/funding_round/koop-technologies-seed--02afed30
-- INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
-- SELECT gen_random_uuid(), 'Fusion Fund', 'Deep Tech', 'Seed', now(), now()
-- WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'Fusion Fund');
-- INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
-- SELECT gen_random_uuid(),
--   (SELECT id FROM fund WHERE name = 'Fusion Fund'),
--   (SELECT id FROM portfolio_company WHERE name = 'Koop Technologies'),
--   'stale', '2023-07-11', now(), now()
-- WHERE NOT EXISTS (
--   SELECT 1 FROM relationship r JOIN fund f ON f.id = r.fund_id
--   JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
--   WHERE f.name = 'Fusion Fund' AND pc.name = 'Koop Technologies'
-- );

-- ── Mapless AI ────────────────────────────────────────────────────────────────
-- Source: https://www.crunchbase.com/organization/mapless-ai/company_financials
-- NSF and MTC excluded (grant agencies — see QUESTIONS-FOR-ALLEYCORP.md Q6)
-- Alley Robotics Ventures already inserted above

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Alley Robotics Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Mapless AI'),
  'stale', '2022-07-01', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Alley Robotics Ventures' AND pc.name = 'Mapless AI'
);

-- ── Dexai Robotics (alumni) ───────────────────────────────────────────────────
-- Source (2020 seed): https://www.businesswire.com/news/home/20200305005216/en/Dexai-Robotics-Announces-Oversubscribed-Funding-Round-to-Launch-Alfred-a-Robotic-Sous-chef
-- Source (2022 ARV): https://www.prnewswire.com/news-releases/alley-robotics-ventures-launches-30m-fund-to-invest-in-robotics-and-automation-301650864.html

INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'Hyperplane Venture Capital', 'Deep Tech / Robotics', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'Hyperplane Venture Capital');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Hyperplane Venture Capital'),
  (SELECT id FROM portfolio_company WHERE name = 'Dexai Robotics'),
  'stale', '2020-03-05', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Hyperplane Venture Capital' AND pc.name = 'Dexai Robotics'
);

INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'Rho Capital', 'Deep Tech', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'Rho Capital');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Rho Capital'),
  (SELECT id FROM portfolio_company WHERE name = 'Dexai Robotics'),
  'stale', '2020-03-05', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Rho Capital' AND pc.name = 'Dexai Robotics'
);

INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'Harlem Capital', 'Diverse Founders', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'Harlem Capital');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Harlem Capital'),
  (SELECT id FROM portfolio_company WHERE name = 'Dexai Robotics'),
  'stale', '2020-03-05', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Harlem Capital' AND pc.name = 'Dexai Robotics'
);

INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'Contour Venture Partners', 'Deep Tech / NYC', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'Contour Venture Partners');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Contour Venture Partners'),
  (SELECT id FROM portfolio_company WHERE name = 'Dexai Robotics'),
  'stale', '2020-03-05', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Contour Venture Partners' AND pc.name = 'Dexai Robotics'
);

INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
SELECT gen_random_uuid(), 'NextView Ventures', 'Consumer / Deep Tech', 'Seed', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM fund WHERE name = 'NextView Ventures');

INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'NextView Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Dexai Robotics'),
  'stale', '2020-03-05', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'NextView Ventures' AND pc.name = 'Dexai Robotics'
);

-- Alley Robotics Ventures already inserted above
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Alley Robotics Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Dexai Robotics'),
  'stale', '2022-07-22', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM relationship r
  JOIN fund f ON f.id = r.fund_id
  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
  WHERE f.name = 'Alley Robotics Ventures' AND pc.name = 'Dexai Robotics'
);

COMMIT;
