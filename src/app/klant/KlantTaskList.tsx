"use client";

import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { ClientTaskItem } from "@/app/klant/ClientTaskItem";
import type { Task } from "@/lib/types/domain";

export function KlantTaskList({ initialTasks }: { initialTasks: Task[] }) {
  const tasks = useRealtimeTasks(initialTasks);
  const sorted = [...tasks].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div>
      <h2 className="mb-4">Jouw geplaatste taken</h2>
      {sorted.length === 0 ? (
        <div className="rounded border border-dashed border-line p-12 text-center text-sm text-ink-soft">
          Je hebt nog geen taken geplaatst.
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {sorted.map((task) => (
            <ClientTaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
