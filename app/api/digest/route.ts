import { NextRequest, NextResponse } from "next/server";
import { sendDigest } from "@/lib/mailer";

// Guarded by APP_SECRET_KEY so Railway cron can call it safely.
// Header: Authorization: Bearer <APP_SECRET_KEY>
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization") ?? "";
  const secret = process.env.APP_SECRET_KEY;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendDigest();

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
