export function formatEuro(amount: number): string {
  return "€ " + amount.toFixed(2).replace(".", ",");
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

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  accepted: "Toegewezen",
  done: "Voltooid",
};
