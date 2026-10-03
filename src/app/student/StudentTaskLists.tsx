"use client";

import { useMemo, useState } from "react";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { useRealtimeRows } from "@/hooks/useRealtimeRows";
import { useRealtimeApplications } from "@/hooks/useRealtimeApplications";
import { AssignedTaskCard, BoardTaskCard } from "@/components/TaskCard";
import { applyToTask, withdrawApplication, completeTask } from "@/app/student/actions";
import { CATEGORIES } from "@/lib/constants";
import type { BoardTask, Task, TaskApplication } from "@/lib/types/domain";

export function StudentTaskLists({
  initialAssigned,
  initialBoard,
  initialApplications,
  userId,
}: {
  initialAssigned: Task[];
  initialBoard: BoardTask[];
  initialApplications: TaskApplication[];
  userId: string;
}) {
  const assigned = useRealtimeTasks(initialAssigned);
  const board = useRealtimeRows<BoardTask>("task_board", initialBoard);
  const applications = useRealtimeApplications(initialApplications);
  const [category, setCategory] = useState("");

  const myApplicationTaskIds = useMemo(
    () =>
      new Set(
        applications.filter((a) => a.student_id === userId).map((a) => a.task_id)
      ),
    [applications, userId]
  );

  const open = useMemo(
    () =>
      board
        .filter((t) => !category || t.category === category)
        .sort((a, b) => (a.created_at > b.created_at ? 1 : -1)),
    [board, category]
  );

  const mine = useMemo(
    () =>
      assigned
        .filter((t) => t.student_id === userId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [assigned, userId]
  );

  return (
    <div>
      <p className="mb-5 text-sm text-ink-soft">
        Bekijk openstaande taken en meld je aan voor wat bij je past. De
        klant kiest zelf wie de taak toegewezen krijgt.
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
            <BoardTaskCard
              key={task.id}
              task={task}
              applied={myApplicationTaskIds.has(task.id)}
              onApply={applyToTask.bind(null, task.id)}
              onWithdraw={withdrawApplication.bind(null, task.id)}
            />
          ))}
        </div>
      )}

      <hr className="my-9 border-line" />

      <h2 className="mb-4">Mijn opdrachten</h2>
      {mine.length === 0 ? (
        <div className="rounded border border-dashed border-line p-12 text-center text-sm text-ink-soft">
          Je hebt nog geen taken toegewezen gekregen.
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {mine.map((task) => (
            <AssignedTaskCard
              key={task.id}
              task={task}
              onComplete={completeTask.bind(null, task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
