"use client";

import { useMemo, useState } from "react";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { TaskCard } from "@/components/TaskCard";
import { acceptTask, completeTask } from "@/app/student/actions";
import { CATEGORIES } from "@/lib/constants";
import type { Task } from "@/lib/types/domain";

export function StudentTaskLists({
  initialTasks,
  userId,
}: {
  initialTasks: Task[];
  userId: string;
}) {
  const tasks = useRealtimeTasks(initialTasks);
  const [category, setCategory] = useState("");

  const open = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "open")
        .filter((t) => !category || t.category === category)
        .sort((a, b) => (a.created_at > b.created_at ? 1 : -1)),
    [tasks, category]
  );

  const mine = useMemo(
    () =>
      tasks
        .filter((t) => t.student_id === userId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [tasks, userId]
  );

  return (
    <div>
      <p className="mb-5 text-sm text-ink-soft">
        Bekijk openstaande taken en accepteer wat bij je past.
      </p>

      <div className="mb-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-line bg-card px-3 py-2 text-sm"
        >
          <option value="">Alle categorieën</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <h2 className="mb-4">Openstaande taken</h2>
      {open.length === 0 ? (
        <div className="mb-10 rounded border border-dashed border-line p-12 text-center text-sm text-ink-soft">
          Geen openstaande taken op dit moment.
        </div>
      ) : (
        <div className="mb-10 flex flex-col gap-3.5">
          {open.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              mode="student-open"
              onAccept={acceptTask.bind(null, task.id)}
            />
          ))}
        </div>
      )}

      <hr className="my-9 border-line" />

      <h2 className="mb-4">Mijn opdrachten</h2>
      {mine.length === 0 ? (
        <div className="rounded border border-dashed border-line p-12 text-center text-sm text-ink-soft">
          Je hebt nog geen taken aangenomen.
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {mine.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              mode="student-mine"
              onComplete={completeTask.bind(null, task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
