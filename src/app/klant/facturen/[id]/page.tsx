import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceView } from "@/components/InvoiceView";
import type { Invoice } from "@/lib/types/domain";

export default async function KlantFactuurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single<Invoice>();

  if (!invoice) notFound();

  const { data: task } = await supabase
    .from("tasks")
    .select("paid_at, payment_status")
    .eq("id", invoice.task_id)
    .maybeSingle();
  const paidAt = task?.payment_status === "paid" ? (task.paid_at ?? null) : null;

  return (
    <InvoiceView
      invoice={invoice}
      paidAt={paidAt}
      onlinePayments={Boolean(process.env.MOLLIE_API_KEY)}
    />
  );
}
