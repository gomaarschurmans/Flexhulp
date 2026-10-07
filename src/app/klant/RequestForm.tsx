"use client";

import { useActionState } from "react";
import { submitRequest, type RequestState } from "@/app/klant/actions";
import { CATEGORIES } from "@/lib/constants";
import { Turnstile } from "@/components/Turnstile";

const initialState: RequestState = { error: null, success: false };

export function RequestForm() {
  const [state, formAction, pending] = useActionState(submitRequest, initialState);

  return (
    <details className="card">
      <summary className="cursor-pointer text-sm font-semibold text-navy">
        Geen passend tijdstip? Doe een aanvraag voor extra uren
      </summary>
      <p className="mb-4 mt-2 text-sm text-ink-soft">
        Dit boekt niets automatisch — je geeft enkel door wat je ongeveer
        nodig denkt te hebben. Flexhulp neemt contact op en geeft indien
        mogelijk een passend tijdvenster vrij.
      </p>

      {state.success ? (
        <p className="rounded border border-teal/30 bg-teal-soft px-4 py-3 text-sm text-teal">
          Aanvraag verstuurd — Flexhulp neemt zo snel mogelijk contact op.
        </p>
      ) : (
        <form action={formAction}>
          <div className="field mb-3">
            <label htmlFor="request_category">Categorie</label>
            <select
              id="request_category"
              name="category"
              defaultValue={state.values?.category || CATEGORIES[0]}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field mb-3">
            <label htmlFor="estimated_hours">Geschat aantal uren</label>
            <input
              id="estimated_hours"
              name="estimated_hours"
              type="number"
              step="0.5"
              min="0.5"
              placeholder="bv. 6"
              defaultValue={state.values?.estimated_hours ?? ""}
              required
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="preferred_period">Gewenste periode</label>
            <input
              id="preferred_period"
              name="preferred_period"
              type="text"
              placeholder="bv. week van 12 oktober, zo snel mogelijk..."
              defaultValue={state.values?.preferred_period ?? ""}
              required
            />
          </div>
          <div className="field mb-1">
            <label htmlFor="request_description">Toelichting (optioneel)</label>
            <textarea
              id="request_description"
              name="description"
              placeholder="Waarvoor heb je hulp nodig?"
              defaultValue={state.values?.description ?? ""}
            />
          </div>
          <Turnstile />
          {state.error && (
            <p className="mb-3 text-sm text-danger">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="btn btn-ghost mt-3 w-full"
          >
            {pending ? "Bezig..." : "Aanvraag versturen"}
          </button>
        </form>
      )}
    </details>
  );
}
