import type { TaskStatus } from "@/lib/types/domain";
import { STATUS_LABELS } from "@/lib/utils";

const STYLES: Record<TaskStatus, string> = {
  open: "bg-teal-soft text-teal",
  accepted: "bg-[#FCEFD8] text-amber-deep",
  done: "bg-[#E9E9E9] text-ink-soft",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
