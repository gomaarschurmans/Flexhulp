import { getMollie, SITE_URL } from "@/lib/mollie/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatTimeRange } from "@/lib/utils";
import type { Task } from "@/lib/types/domain";

/**
 * Maakt een Mollie-betaling aan voor een voltooide taak, of hergebruikt een
 * nog openstaande betaling die al bestaat. Schrijft altijd via de
 * service-role client: de aanroeper (admin- of klantactie) heeft de
 * autorisatie al zelf gecontroleerd, en enforce_task_transitions() blokkeert
 * deze velden voor een normale klantsessie.
 *
 * Geeft null terug als Mollie niet geconfigureerd is (geen MOLLIE_API_KEY)
 * — online betalen is optioneel, geen harde vereiste.
 */
export async function getOrCreateTaskPayment(task: Task): Promise<string | null> {
  const mollie = getMollie();
  if (!mollie) return null;

  if (task.mollie_payment_id && task.payment_status === "pending") {
    try {
      const existing = await mollie.payments.get(task.mollie_payment_id);
      if (existing.status === "open" || existing.status === "pending") {
        const url = existing.getCheckoutUrl();
        if (url) return url;
      }
    } catch (e) {
      console.error("Bestaande Mollie-betaling ophalen mislukt", e);
    }
  }

  const amount = (task.hours * task.rate_at_creation).toFixed(2);
  const payment = await mollie.payments.create({
    amount: { currency: "EUR", value: amount },
    description: `Flexhulp – ${task.category} op ${formatTimeRange(task.date, task.time, task.end_time)}`,
    redirectUrl: `${SITE_URL}/klant`,
    webhookUrl: `${SITE_URL}/api/mollie/webhook`,
    metadata: { taskId: task.id },
  });

  const admin = createAdminClient();
  await admin
    .from("tasks")
    .update({ mollie_payment_id: payment.id, payment_status: "pending" })
    .eq("id", task.id);

  return payment.getCheckoutUrl();
}
