"use client";

import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { useRealtimeApplications } from "@/hooks/useRealtimeApplications";
import { ClientTaskItem } from "@/app/klant/ClientTaskItem";
import type { Task, TaskApplication } from "@/lib/types/domain";

export function KlantTaskList({
  initialTasks,
  initialApplications,
}: {
  initialTasks: Task[];
  initialApplications: TaskApplication[];
}) {
  const tasks = useRealtimeTasks(initialTasks);
  const applications = useRealtimeApplications(initialApplications);
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
            <ClientTaskItem
              key={task.id}
              task={task}
              applications={applications.filter((a) => a.task_id === task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
