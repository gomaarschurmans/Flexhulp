import { NextResponse, type NextRequest } from "next/server";
import { getMollie, SITE_URL, CANONICAL_URL } from "@/lib/mollie/client";

// TIJDELIJK: toont waarom een Mollie-betaling niet aangemaakt kan worden.
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("t") !== "938e3a67e191b157d8a29bc0ad5c8d89") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 401 });
  }
  const key = process.env.MOLLIE_API_KEY ?? "";
  const out: Record<string, unknown> = {
    sleutelAanwezig: Boolean(key),
    sleutelType: key.slice(0, 5),
    sleutelLengte: key.length,
    heeftSpaties: /\s/.test(key),
    siteUrl: SITE_URL,
    mollieAdres: CANONICAL_URL,
  };
  const mollie = getMollie();
  if (!mollie) return NextResponse.json(out);

  const describe = (e: unknown) => {
    const err = e as { message?: string; statusCode?: number; field?: string; title?: string; detail?: string };
    return { message: err.message, statusCode: err.statusCode, field: err.field, title: err.title, detail: err.detail };
  };
  try {
    const profile = await mollie.profiles.getCurrent();
    out.profiel = { naam: profile.name, status: profile.status };
  } catch (e) {
    out.profielFout = describe(e);
  }
  try {
    const methods = await mollie.methods.list();
    out.betaalmethodes = Array.from(methods).map((m) => m.id);
  } catch (e) {
    out.methodesFout = describe(e);
  }
  try {
    const p = await mollie.payments.create({
      amount: { currency: "EUR", value: "1.00" },
      description: "Flexhulp diagnose",
      redirectUrl: `${CANONICAL_URL}/klant`,
      webhookUrl: `${CANONICAL_URL}/api/mollie/webhook`,
    });
    out.betalingAangemaakt = { id: p.id, status: p.status };
  } catch (e) {
    out.betalingFout = describe(e);
  }
  return NextResponse.json(out);
}
