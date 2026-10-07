"use client";

import { useRealtimeRequests } from "@/hooks/useRealtimeRequests";
import { cancelRequest } from "@/app/klant/actions";
import { ConfirmAction } from "@/components/ConfirmAction";
import type { HourRequest } from "@/lib/types/domain";

export function KlantRequestList({
  initialRequests,
}: {
  initialRequests: HourRequest[];
}) {
  const requests = useRealtimeRequests(initialRequests);
  const sorted = [...requests].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );

  if (sorted.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-semibold">Jouw aanvragen</h3>
      <div className="flex flex-col gap-2">
        {sorted.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded border border-line bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
          >
            <span>
              <strong>{r.category}</strong> · ±{r.estimated_hours} u ·{" "}
              {r.preferred_period}
              <span className="ml-2 rounded-full bg-navy-tint px-2.5 py-0.5 text-xs font-semibold text-navy">
                {r.status === "open" ? "In behandeling" : "Afgehandeld"}
              </span>
            </span>
            {r.status === "open" && (
              <ConfirmAction
                action={cancelRequest.bind(null, r.id)}
                label="Intrekken"
                className="btn btn-ghost px-3 py-1.5 text-xs"
                successMessage="Aanvraag ingetrokken."
                confirm={{
                  title: "Aanvraag intrekken?",
                  text: "Flexhulp neemt dan geen contact meer op over deze aanvraag.",
                  confirmLabel: "Ja, intrekken",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
