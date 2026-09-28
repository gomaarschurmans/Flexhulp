"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { bookTimeRange, type BookSlotState } from "@/app/klant/actions";
import { CATEGORIES } from "@/lib/constants";
import {
  formatEuro,
  formatDateTime,
  slotHours,
  computeFreeGaps,
  type TimeRange,
} from "@/lib/utils";
import { useRealtimeAvailability } from "@/hooks/useRealtimeAvailability";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { Turnstile } from "@/components/Turnstile";
import type { AvailabilitySlot, Task } from "@/lib/types/domain";

const initialState: BookSlotState = { error: null };

export function CreateTaskForm({
  rate,
  initialSlots,
  initialBusyTasks,
}: {
  rate: number;
  initialSlots: AvailabilitySlot[];
  initialBusyTasks: Task[];
}) {
  const [state, formAction, pending] = useActionState(bookTimeRange, initialState);
  const slots = useRealtimeAvailability(initialSlots);
  const busyTasks = useRealtimeTasks(initialBusyTasks);

  const windowGaps = useMemo(() => {
    const map = new Map<string, TimeRange[]>();
    for (const s of slots) {
      const busyRanges = busyTasks
        .filter((t) => t.date === s.slot_date)
        .map((t) => ({ start: t.time, end: t.end_time }));
      map.set(s.id, computeFreeGaps(s.start_time, s.end_time, busyRanges));
    }
    return map;
  }, [slots, busyTasks]);

  // Vensters die volledig volgeboekt zijn hebben niets meer te kiezen —
  // die worden niet aangeboden.
  const bookableSlots = useMemo(
    () => slots.filter((s) => (windowGaps.get(s.id)?.length ?? 0) > 0),
    [slots, windowGaps]
  );

  const [windowId, setWindowId] = useState(bookableSlots[0]?.id ?? "");
  const [gapIndex, setGapIndex] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (!bookableSlots.some((s) => s.id === windowId)) {
      setWindowId(bookableSlots[0]?.id ?? "");
      setGapIndex(0);
    }
  }, [bookableSlots, windowId]);

  const selectedWindow = useMemo(
    () => bookableSlots.find((s) => s.id === windowId),
    [bookableSlots, windowId]
  );
  const gaps = selectedWindow ? windowGaps.get(selectedWindow.id) ?? [] : [];
  const busyRangesForWindow = selectedWindow
    ? busyTasks
        .filter((t) => t.date === selectedWindow.slot_date)
        .map((t) => ({ start: t.time, end: t.end_time }))
        .sort((a, b) => a.start.localeCompare(b.start))
    : [];
  const selectedGap = gaps[gapIndex] ?? gaps[0];

  useEffect(() => {
    if (selectedGap) {
      setStartTime(selectedGap.start.slice(0, 5));
      setEndTime(selectedGap.end.slice(0, 5));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGap?.start, selectedGap?.end]);

  function handleWindowChange(id: string) {
    setWindowId(id);
    setGapIndex(0);
  }

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

      {bookableSlots.length === 0 ? (
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
              onChange={(e) => handleWindowChange(e.target.value)}
            >
              {bookableSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDateTime(s.slot_date, s.start_time)}–
                  {s.end_time.slice(0, 5)} beschikbaar
                </option>
              ))}
            </select>
          </div>

          {busyRangesForWindow.length > 0 && (
            <p className="mb-3 text-xs text-ink-soft">
              Al geboekt op deze dag:{" "}
              {busyRangesForWindow
                .map((b) => `${b.start.slice(0, 5)}–${b.end.slice(0, 5)}`)
                .join(", ")}
            </p>
          )}

          {gaps.length > 1 && (
            <div className="field mb-4">
              <label htmlFor="gap_index">Beschikbaar tijdstip</label>
              <select
                id="gap_index"
                value={gapIndex}
                onChange={(e) => setGapIndex(Number(e.target.value))}
              >
                {gaps.map((g, i) => (
                  <option key={`${g.start}-${g.end}`} value={i}>
                    {g.start.slice(0, 5)}–{g.end.slice(0, 5)} (
                    {slotHours(g.start.slice(0, 5), g.end.slice(0, 5))} u)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedGap && (
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="field">
                <label htmlFor="start_time">Van</label>
                <input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={startTime}
                  min={selectedGap.start.slice(0, 5)}
                  max={selectedGap.end.slice(0, 5)}
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
                  min={selectedGap.start.slice(0, 5)}
                  max={selectedGap.end.slice(0, 5)}
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
