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
 * Rondt een "HH:MM"-tijdstip af naar het dichtstbijzijnde half uur —
 * klanten kunnen hun tijdslot enkel in stappen van 30 minuten aanpassen.
 */
export function roundToHalfHour(value: string): string {
  if (!value) return value;
  const [hStr, mStr] = value.split(":");
  let h = Number(hStr);
  const m = Number(mStr);
  const roundedM = m < 15 ? 0 : m < 45 ? 30 : 60;
  if (roundedM === 60) h = (h + 1) % 24;
  const finalM = roundedM === 60 ? 0 : roundedM;
  return `${String(h).padStart(2, "0")}:${String(finalM).padStart(2, "0")}`;
}

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  accepted: "Toegewezen",
  done: "Voltooid",
};
