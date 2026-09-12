import { createClient } from "@/lib/supabase/server";
import { updateRate, addAvailability } from "@/app/admin/actions";
import { AdminTasksPanel } from "@/app/admin/AdminTasksPanel";
import { AdminAvailabilityList } from "@/app/admin/AdminAvailabilityList";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: availability }, { data: tasks }] =
    await Promise.all([
      supabase.from("platform_settings").select("hourly_rate").eq("id", 1).single(),
      supabase.from("availability").select("*"),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    ]);

  return (
    <div>
      <p className="mb-8 text-sm text-ink-soft">Platformoverzicht en instellingen.</p>

      <div className="mb-8 card">
        <h2 className="mb-2">Vast uurtarief</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Dit tarief geldt voor elke nieuw geplaatste taak op het platform.
        </p>
        <form action={updateRate} className="flex items-end gap-3">
          <div className="field mb-0 w-40">
            <label htmlFor="hourly_rate">Uurtarief (€)</label>
            <input
              id="hourly_rate"
              name="hourly_rate"
              type="number"
              min="1"
              step="0.5"
              defaultValue={settings?.hourly_rate ?? 15}
            />
          </div>
          <button type="submit" className="btn btn-navy w-auto">
            Tarief opslaan
          </button>
        </form>
      </div>

      <div className="mb-8 card">
        <h2 className="mb-2">Tijdsloten vrijgeven</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Geef concrete datums en tijdstippen vrij. Klanten kunnen enkel uit
          deze sloten kiezen — elk slot is eenmalig boekbaar.
        </p>
        <form action={addAvailability} className="mb-5 flex flex-wrap items-end gap-3">
          <div className="field mb-0 w-40">
            <label htmlFor="slot_date">Datum</label>
            <input id="slot_date" name="slot_date" type="date" required />
          </div>
          <div className="field mb-0 w-32">
            <label htmlFor="start">Van</label>
            <input id="start" name="start" type="time" defaultValue="09:00" />
          </div>
          <div className="field mb-0 w-32">
            <label htmlFor="end">Tot</label>
            <input id="end" name="end" type="time" defaultValue="17:00" />
          </div>
          <button type="submit" className="btn btn-navy w-auto">
            Toevoegen
          </button>
        </form>
        <AdminAvailabilityList initialSlots={availability ?? []} />
      </div>

      <AdminTasksPanel initialTasks={tasks ?? []} />
    </div>
  );
}
