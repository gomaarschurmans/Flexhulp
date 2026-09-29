"use client";

import { useRealtimeRequests } from "@/hooks/useRealtimeRequests";
import { markRequestHandled, deleteRequest } from "@/app/admin/actions";
import type { HourRequest } from "@/lib/types/domain";

export function AdminRequestsPanel({
  initialRequests,
}: {
  initialRequests: HourRequest[];
}) {
  const requests = useRealtimeRequests(initialRequests);
  const open = requests
    .filter((r) => r.status === "open")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const handled = requests
    .filter((r) => r.status === "handled")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  if (requests.length === 0) {
    return (
      <div className="rounded border border-dashed border-line p-8 text-center text-sm text-ink-soft">
        Nog geen aanvragen binnengekomen.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {open.map((r) => (
        <div
          key={r.id}
          className="rounded border border-amber/30 bg-[#FCEFD8] p-3.5 text-sm"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <strong>{r.category}</strong>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-amber-deep">
              In behandeling
            </span>
          </div>
          <p className="mb-1">
            Geschat: <strong>±{r.estimated_hours} u</strong> · Gewenst:{" "}
            <strong>{r.preferred_period}</strong>
          </p>
          <p className="mb-1">
            {r.client_name} · {r.client_email}
            {r.client_phone ? ` · ${r.client_phone}` : ""}
          </p>
          {r.description && <p className="mb-2">{r.description}</p>}
          <div className="flex gap-2">
            <form action={markRequestHandled.bind(null, r.id)}>
              <button type="submit" className="btn btn-ghost px-3 py-1.5 text-xs">
                Markeer afgehandeld
              </button>
            </form>
            <form action={deleteRequest.bind(null, r.id)}>
              <button type="submit" className="btn btn-ghost px-3 py-1.5 text-xs">
                Verwijder
              </button>
            </form>
          </div>
        </div>
      ))}

      {handled.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
            Afgehandelde aanvragen ({handled.length})
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {handled.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded border border-line bg-[#FAF9F6] px-3.5 py-2.5 text-xs text-ink-soft"
              >
                <span>
                  {r.category} · ±{r.estimated_hours} u · {r.client_name}
                </span>
                <form action={deleteRequest.bind(null, r.id)}>
                  <button type="submit" className="btn btn-ghost px-3 py-1 text-xs">
                    Verwijder
                  </button>
                </form>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
