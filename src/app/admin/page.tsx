import { createClient } from "@/lib/supabase/server";
import {
  updateRate,
  updateCancellationPolicy,
  addAvailability,
} from "@/app/admin/actions";
import { AdminTabs } from "@/app/admin/AdminTabs";
import { AdminTasksPanel } from "@/app/admin/AdminTasksPanel";
import { AdminAvailabilityList } from "@/app/admin/AdminAvailabilityList";
import { AdminCalendar } from "@/app/admin/AdminCalendar";
import { AdminRevenueReport } from "@/app/admin/AdminRevenueReport";
import { AdminUsersPanel } from "@/app/admin/AdminUsersPanel";
import { AdminRequestsPanel } from "@/app/admin/AdminRequestsPanel";
import type { Profile } from "@/lib/types/domain";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const supabase = await createClient();

  const [
    { data: settings },
    { data: availability },
    { data: tasks },
    { data: users },
    { data: requests },
    { data: invoices },
  ] = await Promise.all([
    supabase
      .from("platform_settings")
      .select("hourly_rate, cancellation_notice_hours")
      .eq("id", 1)
      .single(),
    supabase.from("availability").select("*"),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("*")
      .in("role", ["client", "student"])
      .order("name")
      .returns<Profile[]>(),
    supabase.from("requests").select("*").order("created_at", { ascending: false }),
    supabase.from("invoices").select("id, task_id, invoice_number"),
  ]);

  const clients = (users ?? []).filter((u) => u.role === "client");
  const students = (users ?? []).filter((u) => u.role === "student");
  const openRequests = (requests ?? []).filter((r) => r.status === "open").length;

  const planning = (
    <>
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

      <div className="card">
        <h2 className="mb-4">Kalender</h2>
        <AdminCalendar initialSlots={availability ?? []} initialTasks={tasks ?? []} />
      </div>
    </>
  );

  const settingsPanel = (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
  );

  return (
    <div>
      <p className="mb-6 text-sm text-ink-soft">Platformoverzicht en instellingen.</p>

      <AdminTabs
        initialTab={tab ?? "planning"}
        tabs={[
          { id: "planning", label: "Planning", content: planning },
          {
            id: "taken",
            label: "Taken",
            content: (
              <AdminTasksPanel initialTasks={tasks ?? []} invoices={invoices ?? []} />
            ),
          },
          {
            id: "aanvragen",
            label: "Aanvragen",
            badge: openRequests,
            content: (
              <div className="card">
                <h2 className="mb-4">Aanvragen voor extra uren</h2>
                <AdminRequestsPanel initialRequests={requests ?? []} />
              </div>
            ),
          },
          {
            id: "gebruikers",
            label: "Gebruikers",
            content: (
              <>
                <h2 className="mb-4">Klanten</h2>
                <div className="mb-10">
                  <AdminUsersPanel kind="client" users={clients} tasks={tasks ?? []} />
                </div>
                <h2 className="mb-4">Studenten</h2>
                <AdminUsersPanel kind="student" users={students} tasks={tasks ?? []} />
              </>
            ),
          },
          {
            id: "rapport",
            label: "Rapport",
            content: (
              <div className="card">
                <h2 className="mb-4">Omzet &amp; rapportage</h2>
                <AdminRevenueReport tasks={tasks ?? []} />
              </div>
            ),
          },
          { id: "instellingen", label: "Instellingen", content: settingsPanel },
        ]}
      />
    </div>
  );
}
