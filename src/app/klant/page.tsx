import { createClient } from "@/lib/supabase/server";
import { CreateTaskForm } from "@/app/klant/CreateTaskForm";
import { KlantTaskList } from "@/app/klant/KlantTaskList";
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

  const [{ data: settings }, { data: tasks }, { data: slots }] = await Promise.all([
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
    supabase
      .from("availability")
      .select("*")
      .gte("slot_date", new Date().toISOString().slice(0, 10)),
  ]);

  return (
    <div>
      {error === "cancel_too_late" && (
        <div className="mb-6 rounded border border-danger/30 bg-[#FBEAE6] px-4 py-3 text-sm text-danger">
          Je kan deze boeking niet meer intrekken — dat kan enkel tot{" "}
          {settings?.cancellation_notice_hours ?? 24} uur op voorhand.
        </div>
      )}
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[380px_1fr]">
        <CreateTaskForm
          rate={settings?.hourly_rate ?? 0}
          initialSlots={sortAvailability(slots ?? [])}
        />
        <KlantTaskList initialTasks={tasks ?? []} />
      </div>
    </div>
  );
}
