import { getRecentSignals } from "@/lib/db";

export async function GET() {
  const events = await getRecentSignals(20);
  return Response.json(events);
}
