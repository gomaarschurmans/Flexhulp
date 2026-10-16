"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { useRealtimeRows } from "@/hooks/useRealtimeRows";
import { useRealtimeApplications } from "@/hooks/useRealtimeApplications";
import { AssignedTaskCard, BoardTaskCard } from "@/components/TaskCard";
import { applyToTask, withdrawApplication, completeTask } from "@/app/student/actions";
import { CATEGORIES } from "@/lib/constants";
import { formatEuro, hasStarted, tasksOverlap } from "@/lib/utils";
import type { BoardTask, PhotoStatus, Task, TaskApplication } from "@/lib/types/domain";

export function StudentTaskLists({
  initialAssigned,
  initialBoard,
  initialApplications,
  userId,
  photoStatus,
  photoRejectReason,
}: {
  initialAssigned: Task[];
  initialBoard: BoardTask[];
  initialApplications: TaskApplication[];
  userId: string;
  photoStatus: PhotoStatus | null;
  photoRejectReason: string | null;
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
        .filter((t) => !hasStarted(t))
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

  const myAccepted = useMemo(() => mine.filter((t) => t.status === "accepted"), [mine]);

  // Overzicht: aantal klussen, gemiddelde score en verdiensten.
  const summary = useMemo(() => {
    const done = mine.filter((t) => t.status === "done");
    const ratings = done.map((t) => t.rating).filter((r): r is number => r !== null);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    const amount = (t: Task) => t.hours * t.rate_at_creation;
    return {
      jobs: done.length,
      avg,
      ratingCount: ratings.length,
      earned: done.reduce((sum, t) => sum + amount(t), 0),
      outstanding: done.filter((t) => !t.student_paid_at).reduce((sum, t) => sum + amount(t), 0),
    };
  }, [mine]);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile label="Voltooide klussen" value={String(summary.jobs)} />
        <SummaryTile
          label={
            summary.ratingCount > 0
              ? `Gemiddelde score (${summary.ratingCount})`
              : "Gemiddelde score"
          }
          value={summary.avg !== null ? `★ ${summary.avg.toFixed(1).replace(".", ",")}` : "–"}
        />
        <SummaryTile label="Totaal verdiend" value={formatEuro(summary.earned)} />
        <SummaryTile label="Nog uit te betalen" value={formatEuro(summary.outstanding)} />
      </div>

      <p className="mb-5 text-sm text-ink-soft">
        Bekijk openstaande taken en meld je aan voor wat bij je past. De
        klant kiest zelf wie de taak toegewezen krijgt.
      </p>

      {photoStatus === "pending" && (
        <div className="mb-5 rounded border border-amber/30 bg-[#FCEFD8] px-4 py-3 text-sm text-amber-deep">
          Je profielfoto wordt gecontroleerd. Zodra ze goedgekeurd is, kan je je aanmelden voor
          klussen. Je krijgt een mail.
        </div>
      )}
      {photoStatus !== "pending" && photoStatus !== "approved" && (
        <div className="mb-5 rounded border border-danger/30 bg-[#FBEAE6] px-4 py-3 text-sm text-danger">
          {photoStatus === "rejected" && photoRejectReason
            ? `Je foto werd niet goedgekeurd: ${photoRejectReason}. `
            : "Je hebt nog geen profielfoto. "}
          <Link href="/account" className="font-semibold underline">
            Voeg een foto toe
          </Link>{" "}
          om je te kunnen aanmelden.
        </div>
      )}

      <div className="mb-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-line bg-card px-3 py-2 text-base sm:text-sm"
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
              conflict={myAccepted.some((m) => tasksOverlap(m, task))}
              canApply={photoStatus === "approved"}
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

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <span className="mb-0.5 block text-2xl font-semibold">{value}</span>
      <span className="text-xs text-ink-soft">{label}</span>
    </div>
  );
}
