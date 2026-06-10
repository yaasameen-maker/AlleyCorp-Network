import { NextResponse } from "next/server";
import { getAllRelationships } from "../../../lib/db";
import { groupByFund } from "../../../lib/investors";

export async function GET() {
  try {
    const relationships = await getAllRelationships();
    const investors = groupByFund(relationships);
    return NextResponse.json(investors);
  } catch (err) {
    console.error("[GET /api/investors]", err);
    return NextResponse.json({ error: "Failed to load investors" }, { status: 500 });
  }
}
