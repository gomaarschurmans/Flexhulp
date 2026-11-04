import * as Sentry from "@sentry/nextjs";
import { createInvoiceForTask } from "@/lib/invoicing/createInvoice";
import { getOrCreateTaskPayment } from "@/lib/mollie/payment";
import { SITE_URL } from "@/lib/mollie/client";
import { getResend, FROM_EMAIL } from "@/lib/resend/client";
import { paymentRequestEmail } from "@/lib/resend/templates";
import type { Invoice, Task } from "@/lib/types/domain";

/**
 * Wat er moet gebeuren zodra een klus voltooid is, ongeacht wie hem afrondt
 * (de student of de admin): een factuur aanmaken, een Mollie-betaallink maken
 * (enkel als Mollie ingesteld is) en die samen aan de klant mailen.
 *
 * Veilig om opnieuw uit te voeren: de factuur is idempotent en een nog
 * openstaande betaling wordt hergebruikt.
 */
export async function finalizeCompletedTask(
  task: Task
): Promise<{ invoice: Invoice | null; checkoutUrl: string | null; emailed: boolean }> {
  const invoice = await createInvoiceForTask(task);

  let checkoutUrl: string | null = null;
  let emailed = false;
  try {
    checkoutUrl = await getOrCreateTaskPayment(task);
    const invoiceUrl = invoice ? `${SITE_URL}/klant/facturen/${invoice.id}` : null;
    if (checkoutUrl || invoiceUrl) {
      const { subject, html } = paymentRequestEmail(task, checkoutUrl, invoice, invoiceUrl);
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: task.client_email,
        subject,
        html,
      });
      emailed = true;
    }
  } catch (e) {
    console.error("Betaalverzoek aanmaken/versturen mislukt", e);
    Sentry.captureException(e);
  }

  return { invoice, checkoutUrl, emailed };
}
