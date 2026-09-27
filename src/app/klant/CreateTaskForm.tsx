"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { bookTimeRange, type BookSlotState } from "@/app/klant/actions";
import { CATEGORIES } from "@/lib/constants";
import { formatEuro, formatDateTime, slotHours } from "@/lib/utils";
import { useRealtimeAvailability } from "@/hooks/useRealtimeAvailability";
import { Turnstile } from "@/components/Turnstile";
import type { AvailabilitySlot } from "@/lib/types/domain";

const initialState: BookSlotState = { error: null };

export function CreateTaskForm({
  rate,
  initialSlots,
}: {
  rate: number;
  initialSlots: AvailabilitySlot[];
}) {
  const [state, formAction, pending] = useActionState(bookTimeRange, initialState);
  const slots = useRealtimeAvailability(initialSlots);
  const [windowId, setWindowId] = useState(slots[0]?.id ?? "");
  const [startTime, setStartTime] = useState(slots[0]?.start_time.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(slots[0]?.end_time.slice(0, 5) ?? "");

  const selectedWindow = useMemo(
    () => slots.find((s) => s.id === windowId),
    [slots, windowId]
  );

  useEffect(() => {
    if (selectedWindow) {
      setStartTime(selectedWindow.start_time.slice(0, 5));
      setEndTime(selectedWindow.end_time.slice(0, 5));
    }
  }, [selectedWindow]);

  const hours =
    startTime && endTime && endTime > startTime
      ? slotHours(startTime, endTime)
      : 0;
  const preview =
    selectedWindow && hours > 0
      ? `Geschatte vergoeding: ${formatEuro(hours * rate)} (${hours} u × ${formatEuro(rate)})`
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
            <label htmlFor="window_id">Kies een dag</label>
            <select
              id="window_id"
              name="window_id"
              value={windowId}
              onChange={(e) => setWindowId(e.target.value)}
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDateTime(s.slot_date, s.start_time)}–
                  {s.end_time.slice(0, 5)} beschikbaar
                </option>
              ))}
            </select>
          </div>
          {selectedWindow && (
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="field">
                <label htmlFor="start_time">Van</label>
                <input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={startTime}
                  min={selectedWindow.start_time.slice(0, 5)}
                  max={selectedWindow.end_time.slice(0, 5)}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="end_time">Tot</label>
                <input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={endTime}
                  min={selectedWindow.start_time.slice(0, 5)}
                  max={selectedWindow.end_time.slice(0, 5)}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
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
          <Turnstile />
          {state.error && (
            <p className="mb-3 text-sm text-danger">{state.error}</p>
          )}
          <button type="submit" disabled={pending} className="btn btn-navy w-full">
            {pending ? "Bezig..." : "Tijdstip boeken"}
          </button>
        </form>
      )}
    </div>
  );
}
