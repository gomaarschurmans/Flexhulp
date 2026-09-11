"use client";

import { useActionState, useState } from "react";
import { createTask, type CreateTaskState } from "@/app/klant/actions";
import { CATEGORIES } from "@/lib/constants";
import { formatEuro } from "@/lib/utils";

const initialState: CreateTaskState = { error: null };

export function CreateTaskForm({ rate }: { rate: number }) {
  const [state, formAction, pending] = useActionState(createTask, initialState);
  const [hours, setHours] = useState("");

  const hoursNum = parseFloat(hours);
  const preview =
    hoursNum > 0
      ? `Geschatte vergoeding: ${formatEuro(hoursNum * rate)} (${hoursNum} u × ${formatEuro(rate)})`
      : "";

  return (
    <div className="card">
      <h2 className="mb-4">Plaats een taak</h2>
      <div className="mb-5 flex items-center justify-between rounded border border-line bg-navy-tint px-5 py-3.5 text-sm">
        <span>Platformtarief</span>
        <strong className="text-lg">{formatEuro(rate)} /uur</strong>
      </div>

      <form action={formAction}>
        <div className="field mb-4">
          <label htmlFor="title">Titel</label>
          <input id="title" name="title" type="text" placeholder="bv. Helpen verhuizen" required />
        </div>
        <div className="field mb-4">
          <label htmlFor="category">Categorie</label>
          <select id="category" name="category" defaultValue={CATEGORIES[0]}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field mb-4">
          <label htmlFor="description">Beschrijving</label>
          <textarea id="description" name="description" placeholder="Wat moet er gebeuren?" />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="field mb-0">
            <label htmlFor="date">Datum</label>
            <input id="date" name="date" type="date" required />
          </div>
          <div className="field mb-0">
            <label htmlFor="time">Tijdstip</label>
            <input id="time" name="time" type="time" required />
          </div>
        </div>
        <div className="mb-1 grid grid-cols-2 gap-3">
          <div className="field mb-0">
            <label htmlFor="location">Locatie</label>
            <input id="location" name="location" type="text" placeholder="bv. Sint-Truiden" required />
          </div>
          <div className="field mb-0">
            <label htmlFor="hours">Geschatte duur (uren)</label>
            <input
              id="hours"
              name="hours"
              type="number"
              min="0.5"
              step="0.5"
              placeholder="bv. 3"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
          </div>
        </div>
        {preview && <p className="mb-3 text-sm text-ink-soft">{preview}</p>}
        {state.error && <p className="mb-3 text-sm text-danger">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn btn-navy w-full">
          {pending ? "Bezig..." : "Taak plaatsen"}
        </button>
      </form>
    </div>
  );
}
