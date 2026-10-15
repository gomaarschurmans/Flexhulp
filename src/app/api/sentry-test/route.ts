import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

// TIJDELIJK: enkel om te controleren dat Sentry in productie events ontvangt.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 401 });
  }
  Sentry.captureException(new Error("Flexhulp Sentry-test: dit is een testmelding"));
  const flushed = await Sentry.flush(3000);
  return NextResponse.json({ dsnSet: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN), flushed });
}
