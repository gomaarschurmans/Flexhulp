import { createClient } from "@/lib/supabase/server";
import { CreateTaskForm } from "@/app/klant/CreateTaskForm";
import { KlantTaskList } from "@/app/klant/KlantTaskList";
import { RequestForm } from "@/app/klant/RequestForm";
import { KlantRequestList } from "@/app/klant/KlantRequestList";
import { sortAvailability } from "@/lib/utils";

export default async function KlantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayISO = new Date().toISOString().slice(0, 10);

  const [
    { data: settings },
    { data: tasks },
    { data: slots },
    { data: busyTasks },
    { data: requests },
    { data: applications },
    { data: invoices },
  ] = await Promise.all([
    supabase
      .from("platform_settings")
      .select("hourly_rate, cancellation_notice_hours")
      .eq("id", 1)
      .single(),
    supabase
      .from("tasks")
      .select("*")
      .eq("client_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("availability").select("*").gte("slot_date", todayISO),
    supabase.from("task_busy").select("*").gte("date", todayISO),
    supabase
      .from("requests")
      .select("*")
      .eq("client_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("task_applications").select("*"),
    supabase.from("invoices").select("id, task_id, invoice_number"),
  ]);

  return (
    <div>
      {error === "payment_unavailable" && (
        <div className="mb-6 rounded border border-danger/30 bg-[#FBEAE6] px-4 py-3 text-sm text-danger">
          Online betalen is momenteel niet beschikbaar. Neem contact op met Flexhulp.
        </div>
      )}
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[380px_1fr]">
        <div>
          <CreateTaskForm
            rate={settings?.hourly_rate ?? 0}
            initialSlots={sortAvailability(slots ?? [])}
            initialBusyTasks={busyTasks ?? []}
          />
          <div className="mt-4">
            <RequestForm />
          </div>
          <KlantRequestList initialRequests={requests ?? []} />
        </div>
        <KlantTaskList
          initialTasks={tasks ?? []}
          initialApplications={applications ?? []}
          invoices={invoices ?? []}
        />
      </div>
    </div>
  );
}
