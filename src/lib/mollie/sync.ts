import { getMollie } from "@/lib/mollie/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentStatus } from "@/lib/types/domain";

const STATUS_MAP: Record<string, PaymentStatus> = {
  paid: "paid",
  failed: "failed",
  expired: "expired",
  canceled: "canceled",
};

/**
 * Haalt de canonieke status van een betaling rechtstreeks bij Mollie op
 * (nooit de webhook-payload zelf vertrouwen) en past enkel de taak aan
 * waarvan mollie_payment_id overeenkomt — zo kan een vervalste of
 * onbekende id nooit een andere taak beïnvloeden.
 */
export async function syncMolliePayment(paymentId: string) {
  const mollie = getMollie();
  if (!mollie) return;

  const payment = await mollie.payments.get(paymentId);
  const taskId =
    payment.metadata && typeof payment.metadata === "object"
      ? (payment.metadata as { taskId?: string }).taskId
      : undefined;
  if (!taskId) return;

  const payment_status = STATUS_MAP[payment.status] ?? "pending";

  const admin = createAdminClient();
  await admin
    .from("tasks")
    .update({
      payment_status,
      paid_at: payment_status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("mollie_payment_id", paymentId);
}
