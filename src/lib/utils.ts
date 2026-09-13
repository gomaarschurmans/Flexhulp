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

export function formatSlotRange(
  slotDate: string,
  startTime: string,
  endTime: string
): string {
  return `${formatDateTime(slotDate, startTime)}–${endTime.slice(0, 5)}`;
}

export function slotHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  accepted: "Toegewezen",
  done: "Voltooid",
};
