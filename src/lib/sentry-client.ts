import * as Sentry from "@sentry/nextjs";

let initialized = false;

/** Initialiseert Sentry in de browser, enkel als er een DSN is ingesteld. */
export function ensureSentryClient() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || initialized) return;
  Sentry.init({ dsn, tracesSampleRate: 0.1 });
  initialized = true;
}

export { Sentry };
