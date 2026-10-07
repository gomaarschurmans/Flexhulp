import type { AvailabilitySlot } from "@/lib/types/domain";

export function formatEuro(amount: number): string {
  return "€ " + amount.toFixed(2).replace(".", ",");
}

export function sortAvailability(rows: AvailabilitySlot[]): AvailabilitySlot[] {
  return [...rows].sort((a, b) =>
    a.slot_date === b.slot_date
      ? a.start_time.localeCompare(b.start_time)
      : a.slot_date.localeCompare(b.slot_date)
  );
}

export function computePayout(hours: number, rate: number): number {
  return hours * rate;
}

export function formatDateTime(date: string, time: string): string {
  if (!date && !time) return "Geen tijdstip opgegeven";
  let out = "";
  if (date) {
    const dt = new Date(date + "T00:00:00");
    out += dt.toLocaleDateString("nl-BE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }
  if (time) out += (out ? " · " : "") + time.slice(0, 5);
  return out;
}

export function formatTimeRange(
  date: string,
  startTime: string,
  endTime: string
): string {
  return `${formatDateTime(date, startTime)}–${endTime.slice(0, 5)}`;
}

export function slotHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

export interface TimeRange {
  start: string;
  end: string;
}

/**
 * Geeft de vrije tijdsblokken binnen [windowStart, windowEnd) terug, na
 * aftrek van reeds bezette bereiken (bv. bestaande boekingen op diezelfde
 * dag). Overlappende/aansluitende bezette bereiken worden eerst
 * samengevoegd zodat het resultaat altijd niet-overlappende, gesorteerde
 * vrije blokken zijn.
 */
export function computeFreeGaps(
  windowStart: string,
  windowEnd: string,
  busy: TimeRange[]
): TimeRange[] {
  const clipped = busy
    .map((b) => ({
      start: b.start < windowStart ? windowStart : b.start,
      end: b.end > windowEnd ? windowEnd : b.end,
    }))
    .filter((b) => b.start < b.end)
    .sort((a, b) => a.start.localeCompare(b.start));

  const merged: TimeRange[] = [];
  for (const b of clipped) {
    const last = merged[merged.length - 1];
    if (last && b.start <= last.end) {
      if (b.end > last.end) last.end = b.end;
    } else {
      merged.push({ ...b });
    }
  }

  const gaps: TimeRange[] = [];
  let cursor = windowStart;
  for (const b of merged) {
    if (b.start > cursor) gaps.push({ start: cursor, end: b.start });
    if (b.end > cursor) cursor = b.end;
  }
  if (cursor < windowEnd) gaps.push({ start: cursor, end: windowEnd });

  return gaps;
}

/**
 * Zet een datum + tijd in Belgische tijd (zoals opgeslagen) om naar het
 * juiste tijdstip. new Date("2026-10-12T12:00") op de server (UTC) zou
 * anders 1 à 2 uur ernaast zitten.
 */
export function brusselsLocalToDate(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(guess));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute")
  );
  return new Date(guess - (asUtc - guess));
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const total = ((h * 60 + m + minutes) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Alle "HH:MM"-tijdstippen op het hele/halve uur tussen start en end
 * (beide inclusief) — gebruikt om de Van/Tot-keuzelijsten te vullen zodat
 * er nooit iets anders dan een half uur gekozen kan worden (een native
 * time-input met step laat je nog steeds vrij typen, een <select> niet).
 */
export function halfHourMarks(start: string, end: string): string[] {
  const marks: string[] = [];
  let cursor = start.slice(0, 5);
  const endStr = end.slice(0, 5);
  while (cursor <= endStr) {
    marks.push(cursor);
    cursor = addMinutes(cursor, 30);
  }
  return marks;
}

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  accepted: "Toegewezen",
  done: "Voltooid",
};
