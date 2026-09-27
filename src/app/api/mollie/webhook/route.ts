import { NextResponse, type NextRequest } from "next/server";
import { syncMolliePayment } from "@/lib/mollie/sync";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const id = formData.get("id");

  if (typeof id === "string" && id) {
    try {
      await syncMolliePayment(id);
    } catch (e) {
      console.error("Mollie-webhook verwerken mislukt", e);
    }
  }

  // Altijd 200 teruggeven: fouten worden gelogd, niet via een retry-storm
  // van Mollie afgehandeld.
  return NextResponse.json({ received: true });
}
