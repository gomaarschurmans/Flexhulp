import { createClient } from "@/lib/supabase/server";
import { CreateTaskForm } from "@/app/klant/CreateTaskForm";
import { KlantTaskList } from "@/app/klant/KlantTaskList";

export default async function KlantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: settings }, { data: tasks }] = await Promise.all([
    supabase.from("platform_settings").select("hourly_rate").eq("id", 1).single(),
    supabase
      .from("tasks")
      .select("*")
      .eq("client_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[380px_1fr]">
      <CreateTaskForm rate={settings?.hourly_rate ?? 0} />
      <KlantTaskList initialTasks={tasks ?? []} />
    </div>
  );
}
