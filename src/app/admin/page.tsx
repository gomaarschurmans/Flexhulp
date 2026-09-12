import { createClient } from "@/lib/supabase/server";
import { updateRate, addAvailability, removeAvailability } from "@/app/admin/actions";
import { AdminTasksPanel } from "@/app/admin/AdminTasksPanel";
import { DAYS } from "@/lib/constants";
import { sortAvailability } from "@/lib/utils";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: availabilityRaw }, { data: tasks }] =
    await Promise.all([
      supabase.from("platform_settings").select("hourly_rate").eq("id", 1).single(),
      supabase.from("availability").select("*"),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    ]);
  const availability = sortAvailability(availabilityRaw ?? []);

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
        <h2 className="mb-2">Beschikbaarheid voor klanten</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Geef door op welke dagen en uren je bereikbaar bent. Klanten zien dit
          als richtlijn wanneer ze een taak plaatsen.
        </p>
        <form action={addAvailability} className="mb-5 flex flex-wrap items-end gap-3">
          <div className="field mb-0 w-40">
            <label htmlFor="day">Dag</label>
            <select id="day" name="day" defaultValue={DAYS[0]}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
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
        <div className="flex flex-col gap-2">
          {!availability || availability.length === 0 ? (
            <div className="rounded border border-dashed border-line p-8 text-center text-sm text-ink-soft">
              Nog geen beschikbaarheid doorgegeven.
            </div>
          ) : (
            availability.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded border border-line bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              >
                <span>
                  {a.day}, {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}
                </span>
                <form action={removeAvailability.bind(null, a.id)}>
                  <button type="submit" className="btn btn-ghost px-3.5 py-2 text-xs">
                    Verwijder
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>

      <AdminTasksPanel initialTasks={tasks ?? []} />
    </div>
  );
}
