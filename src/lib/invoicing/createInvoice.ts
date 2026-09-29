import { createAdminClient } from "@/lib/supabase/admin";
import type { Invoice, Task } from "@/lib/types/domain";

/**
 * Maakt een factuur aan voor een voltooide taak, of geeft de bestaande
 * terug als er al eentje is (idempotent — voorkomt dubbele facturen bij
 * een retry). Schrijft via de service-role client: eenmaal aangemaakt
 * blijft een factuur onveranderlijk, net als in de praktijk.
 */
export async function createInvoiceForTask(task: Task): Promise<Invoice | null> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("invoices")
    .select("*")
    .eq("task_id", task.id)
    .maybeSingle<Invoice>();
  if (existing) return existing;

  let clientAddress = task.location;
  if (task.client_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("address")
      .eq("id", task.client_id)
      .maybeSingle();
    if (profile?.address) clientAddress = profile.address;
  }

  const { data: invoice, error } = await admin
    .from("invoices")
    .insert({
      task_id: task.id,
      client_id: task.client_id,
      client_name: task.client_name,
      client_email: task.client_email,
      client_address: clientAddress,
      category: task.category,
      description: task.description,
      service_date: task.date,
      service_time: task.time,
      service_end_time: task.end_time,
      hours: task.hours,
      rate: task.rate_at_creation,
      total: task.hours * task.rate_at_creation,
    })
    .select()
    .single<Invoice>();

  if (error) {
    console.error("Factuur aanmaken mislukt", error);
    return null;
  }
  return invoice;
}
