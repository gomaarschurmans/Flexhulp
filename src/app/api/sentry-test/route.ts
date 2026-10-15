import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

// TIJDELIJK: enkel om te controleren dat Sentry in productie events ontvangt.
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("t") !== "d82e21a7ec5a90e28ac86d780701e7a4") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 401 });
  }
  Sentry.captureException(new Error("Flexhulp Sentry-test: dit is een testmelding"));
  const flushed = await Sentry.flush(3000);
  return NextResponse.json({ dsnSet: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN), flushed });
}
