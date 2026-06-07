// Single source of investor data for the frontend.
// Fetches from GET /api/investors — Railway DB via lib/db.ts → app/api/investors/route.ts

import { mockInvestors, type Investor } from "./mockData";

/**
 * Returns all investors for the list view from the real DB via GET /api/investors.
 * In local dev, falls back to mockData when the API is unavailable (no DATABASE_URL).
 */
export async function getInvestors(): Promise<Investor[]> {
  try {
    const res = await fetch("/api/investors", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to load investors: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[getInvestors] Live API unavailable — using mock data for local dev. Add DATABASE_URL to .env to connect Railway.",
        err
      );
      return mockInvestors;
    }
    throw err;
  }
}
