"use client";

import { useActionState, useMemo, useState } from "react";
import { bookSlot, type BookSlotState } from "@/app/klant/actions";
import { CATEGORIES } from "@/lib/constants";
import { formatEuro, formatSlotRange, slotHours } from "@/lib/utils";
import { useRealtimeAvailability } from "@/hooks/useRealtimeAvailability";
import type { AvailabilitySlot } from "@/lib/types/domain";

const initialState: BookSlotState = { error: null };

export function CreateTaskForm({
  rate,
  initialSlots,
}: {
  rate: number;
  initialSlots: AvailabilitySlot[];
}) {
  const [state, formAction, pending] = useActionState(bookSlot, initialState);
  const slots = useRealtimeAvailability(initialSlots).filter(
    (s) => s.status === "open"
  );
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");

  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === slotId),
    [slots, slotId]
  );
  const preview = selectedSlot
    ? (() => {
        const hours = slotHours(selectedSlot.start_time, selectedSlot.end_time);
        return `Geschatte vergoeding: ${formatEuro(hours * rate)} (${hours} u × ${formatEuro(rate)})`;
      })()
    : "";

  return (
    <div className="card">
      <h2 className="mb-4">Plaats een taak</h2>
      <div className="mb-5 flex items-center justify-between rounded border border-line bg-navy-tint px-5 py-3.5 text-sm">
        <span>Platformtarief</span>
        <strong className="text-lg">{formatEuro(rate)} /uur</strong>
      </div>

      {slots.length === 0 ? (
        <div className="rounded border border-dashed border-line p-8 text-center text-sm text-ink-soft">
          Er zijn op dit moment geen beschikbare tijdsloten. Kom later nog eens
          terug.
        </div>
      ) : (
        <form action={formAction}>
          <div className="field mb-4">
            <label htmlFor="slot_id">Kies een tijdslot</label>
            <select
              id="slot_id"
              name="slot_id"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatSlotRange(s.slot_date, s.start_time, s.end_time)}
                </option>
              ))}
            </select>
          </div>
          <div className="field mb-4">
            <label htmlFor="category">Categorie</label>
            <select id="category" name="category" defaultValue={CATEGORIES[0]}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field mb-4">
            <label htmlFor="description">Beschrijving</label>
            <textarea
              id="description"
              name="description"
              placeholder="Wat moet er gebeuren?"
              required
            />
          </div>
          <div className="field mb-4">
            <label htmlFor="location">Locatie</label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="bv. Sint-Truiden"
              required
            />
          </div>
          <div className="field mb-1">
            <label htmlFor="extra_info">Extra info / benodigdheden</label>
            <textarea
              id="extra_info"
              name="extra_info"
              placeholder="Specifieke vragen, benodigdheden of voorzieningen die gebruikt kunnen worden."
            />
          </div>
          {preview && <p className="mb-3 text-sm text-ink-soft">{preview}</p>}
          {state.error && (
            <p className="mb-3 text-sm text-danger">{state.error}</p>
          )}
          <button type="submit" disabled={pending} className="btn btn-navy w-full">
            {pending ? "Bezig..." : "Tijdslot boeken"}
          </button>
        </form>
      )}
    </div>
  );
}
