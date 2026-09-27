"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  cancelTask,
  editTask,
  submitReview,
  type EditTaskState,
  type ReviewState,
} from "@/app/klant/actions";
import { CATEGORIES } from "@/lib/constants";
import { formatTimeRange, formatEuro } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import type { Task } from "@/lib/types/domain";

const editInitial: EditTaskState = { error: null };
const reviewInitial: ReviewState = { error: null };

export function ClientTaskItem({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [editState, editAction, editPending] = useActionState(
    editTask.bind(null, task.id),
    editInitial
  );
  const [reviewState, reviewAction, reviewPending] = useActionState(
    submitReview.bind(null, task.id),
    reviewInitial
  );

  const wasEditPending = useRef(false);
  useEffect(() => {
    if (wasEditPending.current && !editPending && !editState.error) {
      setEditing(false);
    }
    wasEditPending.current = editPending;
  }, [editPending, editState.error]);

  if (editing) {
    return (
      <div className="card">
        <form action={editAction}>
          <div className="field mb-3">
            <label htmlFor={`category-${task.id}`}>Categorie</label>
            <select
              id={`category-${task.id}`}
              name="category"
              defaultValue={task.category}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field mb-3">
            <label htmlFor={`description-${task.id}`}>Beschrijving</label>
            <textarea
              id={`description-${task.id}`}
              name="description"
              defaultValue={task.description}
              required
            />
          </div>
          <div className="field mb-3">
            <label htmlFor={`location-${task.id}`}>Locatie</label>
            <input
              id={`location-${task.id}`}
              name="location"
              type="text"
              defaultValue={task.location}
              required
            />
          </div>
          <div className="field mb-1">
            <label htmlFor={`extra_info-${task.id}`}>
              Extra info / benodigdheden
            </label>
            <textarea
              id={`extra_info-${task.id}`}
              name="extra_info"
              defaultValue={task.extra_info}
            />
          </div>
          {editState.error && (
            <p className="mb-2 text-sm text-danger">{editState.error}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={editPending}
              className="btn btn-navy text-xs px-3.5 py-2"
            >
              {editPending ? "Bezig..." : "Opslaan"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-ghost text-xs px-3.5 py-2"
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    );
  }

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
        <span>{task.location || "Locatie onbekend"}</span>
        <span>
          {task.hours} u · {formatEuro(task.hours * task.rate_at_creation)}
        </span>
      </div>

      {task.status === "open" && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn btn-ghost text-xs px-3.5 py-2"
          >
            Bewerken
          </button>
          <form action={cancelTask.bind(null, task.id)}>
            <button type="submit" className="btn btn-ghost text-xs px-3.5 py-2">
              Intrekken
            </button>
          </form>
        </div>
      )}

      {task.status === "accepted" && (
        <span className="text-sm text-ink-soft">
          Toegewezen aan <strong className="text-ink">{task.student_name}</strong>
        </span>
      )}

      {task.status === "done" && task.rating === null && (
        <form action={reviewAction} className="mt-2 border-t border-line pt-3.5">
          <p className="mb-2 text-sm font-medium">Hoe ging het?</p>
          <div className="mb-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer text-lg">
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  defaultChecked={n === 5}
                  className="peer sr-only"
                />
                <span className="peer-checked:opacity-100 opacity-40">★</span>
              </label>
            ))}
          </div>
          <textarea
            name="review_comment"
            placeholder="Opmerking (optioneel)"
            className="mb-2 w-full rounded-lg border border-line bg-[#FCFBF9] px-3 py-2.5 text-sm"
          />
          {reviewState.error && (
            <p className="mb-2 text-sm text-danger">{reviewState.error}</p>
          )}
          <button
            type="submit"
            disabled={reviewPending}
            className="btn btn-teal text-xs px-3.5 py-2"
          >
            {reviewPending ? "Bezig..." : "Beoordeling versturen"}
          </button>
        </form>
      )}

      {task.status === "done" && task.rating !== null && (
        <div className="mt-2 border-t border-line pt-3.5 text-sm text-ink-soft">
          <p className="mb-1">
            Jouw beoordeling: {"★".repeat(task.rating)}
            {"☆".repeat(5 - task.rating)}
          </p>
          {task.review_comment && <p>{task.review_comment}</p>}
        </div>
      )}
    </div>
  );
}
