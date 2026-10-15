import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

// TIJDELIJK: enkel om te controleren dat Sentry in productie events ontvangt.
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("t") !== "d82e21a7ec5a90e28ac86d780701e7a4") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 401 });
  }
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";
  let parsed: Record<string, unknown> = {};
  let ingestStatus: number | string = "n.v.t.";
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace("/", "");
    parsed = {
      protocol: u.protocol,
      host: u.host,
      projectId,
      hasPublicKey: Boolean(u.username),
      length: dsn.length,
      startsWithQuote: /^["']/.test(dsn),
      hasWhitespace: /\s/.test(dsn),
    };
    const res = await fetch(`${u.protocol}//${u.host}/api/${projectId}/envelope/?sentry_key=${u.username}&sentry_version=7`, {
      method: "POST",
      body: JSON.stringify({ event_id: crypto.randomUUID().replace(/-/g, "") }) + "\n" + JSON.stringify({ type: "event" }) + "\n" + JSON.stringify({ message: "Flexhulp directe test", level: "error", platform: "javascript" }),
    });
    ingestStatus = res.status;
  } catch (e) {
    parsed = { parseError: String(e) };
  }
  const client = Sentry.getClient();
  const eventId = Sentry.captureException(new Error("Flexhulp Sentry-test: dit is een testmelding"));
  const flushed = await Sentry.flush(3000);
  return NextResponse.json({ hasClient: Boolean(client), eventId, flushed, runtime: process.env.NEXT_RUNTIME, parsed, ingestStatus });
}
