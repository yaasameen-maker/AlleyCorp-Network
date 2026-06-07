import { listStaleRelationships } from "@/lib/db";

export async function GET() {
  const stale = await listStaleRelationships();
  return Response.json(stale);
}
