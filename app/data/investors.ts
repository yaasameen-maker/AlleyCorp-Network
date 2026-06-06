// Single source of investor data for the frontend.
// Fetches from GET /api/investors — Railway DB via lib/db.ts → app/api/investors/route.ts

import type { Investor } from "./mockData";

/**
 * Returns all investors for the list view from the real DB via GET /api/investors.
 */
export async function getInvestors(): Promise<Investor[]> {
  const res = await fetch("/api/investors", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load investors: ${res.status}`);
  return res.json();
}
