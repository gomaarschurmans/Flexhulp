import type { BoardTask, Task } from "@/lib/types/domain";
import { formatEuro, formatTimeRange } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmAction } from "@/components/ConfirmAction";

type Action = () => Promise<void | { error?: string }>;

export function BoardTaskCard({
  task,
  applied,
  onApply,
  onWithdraw,
}: {
  task: BoardTask;
  applied: boolean;
  onApply: Action;
  onWithdraw: Action;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="mb-2 inline-block rounded-full bg-navy-tint px-2.5 py-1 text-xs font-semibold text-navy">
            {task.category}
          </span>
          <h3 className="m-0 text-lg font-semibold">{task.category}</h3>
        </div>
        <StatusBadge status="open" />
      </div>

      {task.description && (
        <p className="my-3 text-sm leading-relaxed text-ink-soft">
          {task.description}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-3.5 text-sm text-ink-soft">
        <span>
          <strong className="text-ink">
            {formatTimeRange(task.date, task.time, task.end_time)}
          </strong>
        </span>
        <span>{task.city || "Gemeente onbekend"}</span>
        <span>
          {task.hours} u · {formatEuro(task.hours * task.rate_at_creation)}
        </span>
      </div>
      <p className="mb-3 text-xs text-ink-soft">
        Het volledige adres en de contactgegevens van de klant zie je pas als
        de klant jou kiest.
      </p>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {applied ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-soft">Aangemeld, wacht op klant</span>
            <ConfirmAction
              action={onWithdraw}
              label="Intrekken"
              successMessage="Aanmelding ingetrokken."
              confirm={{
                title: "Aanmelding intrekken?",
                text: "De klant ziet jou dan niet meer tussen de geïnteresseerden voor deze klus. Je kan je later opnieuw aanmelden zolang de klus open staat.",
                confirmLabel: "Ja, intrekken",
              }}
            />
          </div>
        ) : (
          <ConfirmAction
            action={onApply}
            label="Ik wil dit doen"
            className="btn btn-teal text-xs px-3.5 py-2"
            successMessage="Aangemeld! De klant kiest wie de klus krijgt."
          />
        )}
      </div>
    </div>
  );
}

export function AssignedTaskCard({
  task,
  onComplete,
}: {
  task: Task;
  onComplete: Action;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="mb-2 inline-block rounded-full bg-navy-tint px-2.5 py-1 text-xs font-semibold text-navy">
            {task.category}
          </span>
          <h3 className="m-0 text-lg font-semibold">{task.title}</h3>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {task.description && (
        <p className="my-3 text-sm leading-relaxed text-ink-soft">
          {task.description}
        </p>
      )}
      {task.extra_info && (
        <p className="mb-3 text-sm leading-relaxed text-ink-soft">
          <span className="font-medium text-ink">Extra info: </span>
          {task.extra_info}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-3.5 text-sm text-ink-soft">
        <span>
          <strong className="text-ink">
            {formatTimeRange(task.date, task.time, task.end_time)}
          </strong>
        </span>
        <span>{task.location || "Adres onbekend"}</span>
        <span>
          {task.hours} u · {formatEuro(task.hours * task.rate_at_creation)}
        </span>
      </div>
      <p className="mb-3 text-sm text-ink-soft">
        Klant: <strong className="text-ink">{task.client_name}</strong>
        {task.client_phone ? ` · ${task.client_phone}` : ""}
      </p>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {task.status === "accepted" && (
          <ConfirmAction
            action={onComplete}
            label="Markeer als voltooid"
            className="btn btn-teal text-xs px-3.5 py-2"
            successMessage="Klus als voltooid gemarkeerd."
            confirm={{
              title: "Klus voltooid?",
              text: "De klant krijgt hiervan een melding. Dit kan je niet meer ongedaan maken.",
              confirmLabel: "Ja, voltooid",
            }}
          />
        )}
        {task.status === "done" && (
          <span className="text-sm text-ink-soft">Afgerond</span>
        )}
      </div>
    </div>
  );
}
