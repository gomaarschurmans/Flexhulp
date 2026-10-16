"use client";

import { useActionState, useEffect } from "react";
import { submitStudentReview, type StudentReviewState } from "@/app/student/actions";
import { useToast } from "@/components/Toast";

const initialState: StudentReviewState = { error: null };

/** Formulier waarmee een student de klant beoordeelt na een afgeronde klus. */
export function StudentReviewForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(
    submitStudentReview.bind(null, taskId),
    initialState
  );
  const toast = useToast();

  useEffect(() => {
    if (state.saved) toast("Bedankt voor je beoordeling.");
  }, [state, toast]);

  return (
    <form action={formAction} className="mt-3 border-t border-line pt-3.5">
      <p className="mb-2 text-sm font-medium">Hoe was de klant?</p>
      <div className="mb-2 flex gap-1" role="radiogroup" aria-label="Aantal sterren">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer text-xl">
            <input
              type="radio"
              name="rating"
              value={n}
              defaultChecked={n === 5}
              className="peer sr-only"
            />
            <span className="opacity-40 peer-checked:opacity-100">★</span>
          </label>
        ))}
      </div>
      <textarea
        name="comment"
        maxLength={400}
        placeholder="Opmerking (optioneel, enkel zichtbaar voor Flexhulp)"
        className="mb-2 w-full rounded-lg border border-line bg-[#FCFBF9] px-3 py-2.5 text-base sm:text-sm"
      />
      {state.error && <p className="mb-2 text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-teal px-3.5 py-2 text-xs">
        {pending ? "Bezig..." : "Beoordeling versturen"}
      </button>
    </form>
  );
}
