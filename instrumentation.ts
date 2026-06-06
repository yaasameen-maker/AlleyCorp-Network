/**
 * Next.js instrumentation hook — runs once per runtime at startup.
 * Initializes Sentry for server + edge runtimes. Env-gated so this is a
 * safe no-op when SENTRY_DSN is not set (e.g. local dev without a project).
 *
 * Client-side Sentry init lives in `instrumentation-client.ts` (add when
 * NEXT_PUBLIC_SENTRY_DSN is provided).
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      enabled: process.env.NODE_ENV !== "test",
    });
  }
}
