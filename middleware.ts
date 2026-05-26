import { NextRequest, NextResponse } from "next/server";

// TODO: replace crypto.randomUUID() with shared lib/trace.ts once implemented
export function middleware(request: NextRequest) {
  const traceId = crypto.randomUUID();
  const response = NextResponse.next();
  response.headers.set("X-Trace-Id", traceId);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
