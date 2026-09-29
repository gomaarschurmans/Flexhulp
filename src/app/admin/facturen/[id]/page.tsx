import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceView } from "@/components/InvoiceView";
import type { Invoice } from "@/lib/types/domain";

export default async function AdminFactuurPage({
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

  return <InvoiceView invoice={invoice} />;
}
