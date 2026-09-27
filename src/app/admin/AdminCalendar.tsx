"use client";

import { useMemo, useState } from "react";
import { useRealtimeAvailability } from "@/hooks/useRealtimeAvailability";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import type { AvailabilitySlot, Task } from "@/lib/types/domain";

const MONTH_NAMES = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];
const WEEKDAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
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
          return (
            <div
              key={cell.iso}
              className={`rounded border p-1.5 text-xs ${
                isToday ? "border-navy bg-navy-tint" : "border-line bg-[#FAF9F6]"
              }`}
              style={{ minHeight: 56 }}
            >
              <div className="mb-1 font-semibold">{cell.date.getDate()}</div>
              <div className="flex flex-col gap-0.5">
                {openCount > 0 && (
                  <span className="rounded-full bg-teal-soft px-1.5 py-0.5 text-teal">
                    {openCount} vrij
                  </span>
                )}
                {taskCount > 0 && (
                  <span className="rounded-full bg-navy-tint px-1.5 py-0.5 text-navy">
                    {taskCount} taak{taskCount > 1 ? "en" : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
