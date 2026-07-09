import { pool } from "./db";
import { isWarmAtRisk } from "./scoring";
import { isMockMode } from "./mock/mode";
import { getAlertsMock } from "./mock/repository";
import type { Alert } from "./alerts";

export async function getAlerts(): Promise<Alert[]> {
  if (isMockMode()) return getAlertsMock();

  const { rows } = await pool.query<{
    warmth_tier: string;
    last_signal_date: Date | null;
    fund_name: string;
    company_name: string;
  }>(`
    SELECT
      r.warmth_tier,
      r.last_signal_date,
      f.name  AS fund_name,
      pc.name AS company_name
    FROM relationship r
    JOIN fund f             ON f.id  = r.fund_id
    JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
    WHERE r.warmth_tier IN ('stale', 'warm')
    ORDER BY
      CASE r.warmth_tier WHEN 'stale' THEN 0 ELSE 1 END,
      r.last_signal_date ASC NULLS FIRST
  `);

  const alerts: Alert[] = [];

  for (const row of rows) {
    const lastSignalDate = row.last_signal_date
      ? row.last_signal_date.toISOString().slice(0, 10)
      : null;

    if (row.warmth_tier === "stale") {
      alerts.push({
        type: "stale_relationship",
        severity: "high",
        fund: row.fund_name,
        portfolioCompany: row.company_name,
        lastSignalDate,
        message: `${row.fund_name} has gone stale on ${row.company_name}. Reconnect before their next round in this space.`,
      });
      continue;
    }

    if (row.warmth_tier === "warm" && isWarmAtRisk(lastSignalDate)) {
      alerts.push({
        type: "warm_at_risk",
        severity: "medium",
        fund: row.fund_name,
        portfolioCompany: row.company_name,
        lastSignalDate,
        message: `${row.fund_name} is warm on ${row.company_name} but no signal in 90+ days. Schedule a touchpoint soon.`,
      });
    }
  }

  return alerts;
}
