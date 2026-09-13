"use client";

import { useRealtimeAvailability } from "@/hooks/useRealtimeAvailability";
import { removeAvailability } from "@/app/admin/actions";
import { sortAvailability } from "@/lib/utils";
import type { AvailabilitySlot } from "@/lib/types/domain";

export function AdminAvailabilityList({
  initialSlots,
}: {
  initialSlots: AvailabilitySlot[];
}) {
  const slots = sortAvailability(useRealtimeAvailability(initialSlots));

  if (slots.length === 0) {
    return (
      <div className="rounded border border-dashed border-line p-8 text-center text-sm text-ink-soft">
        Nog geen tijdsloten vrijgegeven.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {slots.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between rounded border border-line bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
        >
          <span className="flex items-center gap-2.5">
            {new Date(s.slot_date + "T00:00:00").toLocaleDateString("nl-BE", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
            , {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
            {s.status === "booked" && (
              <span className="rounded-full bg-[#FCEFD8] px-2.5 py-1 text-xs font-semibold text-amber-deep">
                Geboekt
              </span>
            )}
          </span>
          {s.status === "open" && (
            <form action={removeAvailability.bind(null, s.id)}>
              <button type="submit" className="btn btn-ghost px-3.5 py-2 text-xs">
                Verwijder
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
