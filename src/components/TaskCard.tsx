import type { Task } from "@/lib/types/domain";
import { formatDateTime, formatEuro } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

type Mode = "client-owned" | "student-open" | "student-mine";

export function TaskCard({
  task,
  mode,
  onCancel,
  onAccept,
  onComplete,
}: {
  task: Task;
  mode: Mode;
  onCancel?: (formData: FormData) => void | Promise<void>;
  onAccept?: (formData: FormData) => void | Promise<void>;
  onComplete?: (formData: FormData) => void | Promise<void>;
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

      <div className="mb-3 flex flex-wrap gap-3.5 text-sm text-ink-soft">
        <span>
          <strong className="text-ink">
            {formatDateTime(task.date, task.time)}
          </strong>
        </span>
        <span>{task.location || "Locatie onbekend"}</span>
        <span>
          {task.hours} u · {formatEuro(task.hours * task.rate_at_creation)}
        </span>
        {mode !== "client-owned" && <span>Klant: {task.client_name}</span>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span />
        {mode === "client-owned" && task.status === "open" && onCancel && (
          <form action={onCancel}>
            <button type="submit" className="btn btn-ghost text-xs px-3.5 py-2">
              Intrekken
            </button>
          </form>
        )}
        {mode === "client-owned" && task.status === "accepted" && (
          <span className="text-sm text-ink-soft">
            Toegewezen aan <strong className="text-ink">{task.student_name}</strong>
          </span>
        )}
        {mode === "client-owned" && task.status === "done" && (
          <span className="text-sm text-ink-soft">
            Afgerond door {task.student_name}
          </span>
        )}

        {mode === "student-open" && onAccept && (
          <form action={onAccept}>
            <button type="submit" className="btn btn-teal text-xs px-3.5 py-2">
              Accepteren
            </button>
          </form>
        )}

        {mode === "student-mine" && task.status === "accepted" && onComplete && (
          <form action={onComplete}>
            <button type="submit" className="btn btn-teal text-xs px-3.5 py-2">
              Markeer als voltooid
            </button>
          </form>
        )}
        {mode === "student-mine" && task.status === "done" && (
          <span className="text-sm text-ink-soft">Afgerond</span>
        )}
      </div>
    </div>
  );
}
