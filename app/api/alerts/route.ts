import { getAlerts } from "../../../lib/alerts.server";

export async function GET() {
  try {
    const alerts = await getAlerts();
    return Response.json({ alerts, count: alerts.length });
  } catch (err) {
    console.error("[alerts] query failed:", err);
    return Response.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
