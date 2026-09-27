import { createClient } from "@/lib/supabase/server";
import {
  updateRate,
  updateCancellationPolicy,
  addAvailability,
} from "@/app/admin/actions";
import { AdminTasksPanel } from "@/app/admin/AdminTasksPanel";
import { AdminAvailabilityList } from "@/app/admin/AdminAvailabilityList";
import { AdminCalendar } from "@/app/admin/AdminCalendar";
import { AdminRevenueReport } from "@/app/admin/AdminRevenueReport";
import { AdminClientsPanel } from "@/app/admin/AdminClientsPanel";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: availability }, { data: tasks }, { data: clients }] =
    await Promise.all([
      supabase
        .from("platform_settings")
        .select("hourly_rate, cancellation_notice_hours")
        .eq("id", 1)
        .single(),
      supabase.from("availability").select("*"),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "client").order("name"),
    ]);

  return (
    <div>
      <p className="mb-8 text-sm text-ink-soft">Platformoverzicht en instellingen.</p>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card">
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

        <div className="card">
          <h2 className="mb-2">Annuleringsbeleid</h2>
          <p className="mb-4 text-sm text-ink-soft">
            Hoeveel uur op voorhand moet een klant ten laatste annuleren?
          </p>
          <form action={updateCancellationPolicy} className="flex items-end gap-3">
            <div className="field mb-0 w-40">
              <label htmlFor="cancellation_notice_hours">Uren op voorhand</label>
              <input
                id="cancellation_notice_hours"
                name="cancellation_notice_hours"
                type="number"
                min="0"
                step="1"
                defaultValue={settings?.cancellation_notice_hours ?? 24}
              />
            </div>
            <button type="submit" className="btn btn-navy w-auto">
              Opslaan
            </button>
          </form>
        </div>
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
          <div className="field mb-0 w-44">
            <label htmlFor="repeat_weeks">Herhaal (extra weken)</label>
            <input
              id="repeat_weeks"
              name="repeat_weeks"
              type="number"
              min="0"
              max="52"
              defaultValue="0"
            />
          </div>
          <button type="submit" className="btn btn-navy w-auto">
            Toevoegen
          </button>
        </form>
        <AdminAvailabilityList initialSlots={availability ?? []} />
      </div>

      <div className="mb-8 card">
        <h2 className="mb-4">Kalender</h2>
        <AdminCalendar initialSlots={availability ?? []} initialTasks={tasks ?? []} />
      </div>

      <div className="mb-8 card">
        <h2 className="mb-4">Omzet &amp; rapportage</h2>
        <AdminRevenueReport tasks={tasks ?? []} />
      </div>

      <div className="mb-8">
        <h2 className="mb-4">Klanten</h2>
        <AdminClientsPanel clients={clients ?? []} />
      </div>

      <AdminTasksPanel initialTasks={tasks ?? []} />
    </div>
  );
}
