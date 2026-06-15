-- Migration 006: Limit VIP/starred flag to confirmed anchor co-investors
--
-- June 11 pivot: co-investors live inside the broader deep tech investor universe,
-- but VIP/starred should mean a deliberately highlighted relationship, not "every
-- fund with any co-investment." Keep the explicit anchors stable for Demo Day.

BEGIN;

UPDATE fund
SET
  investor_status = CASE
    WHEN name IN ('Lux Capital', 'Union Square Ventures', 'a16z American Dynamism', 'Eclipse Ventures', 'Founders Fund')
      THEN 'market_prospect'
    WHEN name IN ('Riot Ventures', 'Snowpoint Ventures', 'General Catalyst', 'Mach33')
      THEN 'vip_co_investor'
    ELSE 'known_co_investor'
  END,
  is_vip = CASE
    WHEN name IN ('Riot Ventures', 'Snowpoint Ventures', 'General Catalyst', 'Mach33') THEN true
    ELSE false
  END,
  updated_at = now();

COMMIT;
