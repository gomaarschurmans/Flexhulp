"use client";

import { useMemo, useState } from "react";
import { useRealtimeAvailability } from "@/hooks/useRealtimeAvailability";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { StatusBadge } from "@/components/StatusBadge";
import { markTaskDone } from "@/app/admin/actions";
import { formatEuro } from "@/lib/utils";
import type { AvailabilitySlot, PaymentStatus, Task } from "@/lib/types/domain";

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Nog niet betaald",
  pending: "Wacht op betaling",
  paid: "Betaald",
  failed: "Betaling mislukt",
  expired: "Betaalverzoek verlopen",
  canceled: "Betaling geannuleerd",
};

const MONTH_NAMES = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];
const WEEKDAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function toISODate(d: Date): string {
  // Let op: d.toISOString() converteert naar UTC en schuift de datum een
  // dag terug in tijdzones vóór UTC (zoals België) — daarom hier de lokale
  // datumcomponenten rechtstreeks opbouwen.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AdminCalendar({
  initialSlots,
  initialTasks,
}: {
  initialSlots: AvailabilitySlot[];
  initialTasks: Task[];
}) {
  const slots = useRealtimeAvailability(initialSlots);
  const tasks = useRealtimeTasks(initialTasks);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const openByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of slots) {
      map.set(s.slot_date, (map.get(s.slot_date) ?? 0) + 1);
    }
    return map;
  }, [slots]);

  const taskByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      map.set(t.date, (map.get(t.date) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = maandag
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = toISODate(new Date());

  const cells: Array<{ date: Date; iso: string } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({ date: d, iso: toISODate(d) });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="btn btn-ghost px-3 py-1.5 text-xs"
        >
          ← Vorige
        </button>
        <span className="font-semibold">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="btn btn-ghost px-3 py-1.5 text-xs"
        >
          Volgende →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-soft">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const openCount = openByDate.get(cell.iso) ?? 0;
          const taskCount = taskByDate.get(cell.iso) ?? 0;
          const isToday = cell.iso === todayISO;
          const isSelected = cell.iso === selectedDate;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() =>
                setSelectedDate((current) => (current === cell.iso ? null : cell.iso))
              }
              className={`rounded border p-1.5 text-left text-xs transition-colors ${
                isSelected
                  ? "border-navy bg-navy text-white"
                  : isToday
                    ? "border-navy bg-navy-tint"
                    : "border-line bg-[#FAF9F6] hover:bg-navy-tint"
              }`}
              style={{ minHeight: 56 }}
            >
              <div className="mb-1 font-semibold">{cell.date.getDate()}</div>
              <div className="flex flex-col gap-0.5">
                {openCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 ${
                      isSelected ? "bg-white/20 text-white" : "bg-teal-soft text-teal"
                    }`}
                  >
                    {openCount} vrij
                  </span>
                )}
                {taskCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 ${
                      isSelected ? "bg-white/20 text-white" : "bg-navy-tint text-navy"
                    }`}
                  >
                    {taskCount} taak{taskCount > 1 ? "en" : ""}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <DayDetail
          date={selectedDate}
          slots={slots.filter((s) => s.slot_date === selectedDate)}
          tasks={tasks.filter((t) => t.date === selectedDate)}
        />
      )}
    </div>
  );
}

function DayDetail({
  date,
  slots,
  tasks,
}: {
  date: string;
  slots: AvailabilitySlot[];
  tasks: Task[];
}) {
  const label = new Date(date + "T00:00:00").toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mt-4 rounded border border-line bg-[#FAF9F6] p-4">
      <h3 className="mb-3 text-sm font-semibold capitalize">{label}</h3>

      {slots.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold text-ink-soft">
            Vrijgegeven tijdvensters
          </p>
          <div className="flex flex-col gap-1">
            {slots.map((s) => (
              <span key={s.id} className="text-xs text-ink-soft">
                {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
              </span>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-xs text-ink-soft">Geen taken op deze dag.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((t) => (
              <div
                key={t.id}
                className="rounded border border-line bg-card p-3 text-xs"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <strong className="text-sm">{t.category}</strong>
                  <StatusBadge status={t.status} />
                </div>
                <p className="mb-1 text-ink-soft">
                  {t.time.slice(0, 5)} – {t.end_time.slice(0, 5)} ·{" "}
                  {formatEuro(t.hours * t.rate_at_creation)} ({t.hours} u)
                </p>
                <p className="mb-1">
                  <strong>Klant:</strong> {t.client_name} · {t.client_email}
                  {t.client_phone ? ` · ${t.client_phone}` : ""}
                </p>
                <p className="mb-1">
                  <strong>Locatie:</strong> {t.location}
                </p>
                {t.description && (
                  <p className="mb-1">
                    <strong>Beschrijving:</strong> {t.description}
                  </p>
                )}
                {t.extra_info && (
                  <p className="mb-1">
                    <strong>Extra info:</strong> {t.extra_info}
                  </p>
                )}
                {t.status === "done" && (
                  <p className="mb-2">
                    <strong>Betaling:</strong> {PAYMENT_LABELS[t.payment_status]}
                  </p>
                )}
                {t.status === "open" && (
                  <form action={markTaskDone.bind(null, t.id)}>
                    <button type="submit" className="btn btn-ghost px-3 py-1.5 text-xs">
                      Markeer voltooid
                    </button>
                  </form>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
