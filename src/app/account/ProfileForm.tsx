"use client";

import { useActionState, useEffect } from "react";
import { updateProfile, type ProfileState } from "@/app/account/actions";
import { useToast } from "@/components/Toast";

const initialState: ProfileState = { error: null };

export function ProfileForm({
  phone,
  address,
  bio,
  notifyNewTasks,
  isStudent,
}: {
  phone: string | null;
  address: string | null;
  bio: string | null;
  notifyNewTasks: boolean;
  isStudent: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const toast = useToast();

  useEffect(() => {
    if (state.saved) toast("Profiel opgeslagen.");
  }, [state, toast]);

  return (
    <form action={formAction}>
      <div className="field mb-3">
        <label htmlFor="phone">Telefoon</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={state.values?.phone ?? phone ?? ""}
        />
      </div>
      <div className="field mb-3">
        <label htmlFor="address">Adres</label>
        <input
          id="address"
          name="address"
          type="text"
          placeholder="Straat, huisnummer, postcode, gemeente"
          autoComplete="street-address"
          defaultValue={state.values?.address ?? address ?? ""}
        />
        <p className="mt-1 text-xs text-ink-soft">
          {isStudent
            ? "Enkel voor Flexhulp zichtbaar."
            : "Wordt gebruikt als factuuradres."}
        </p>
      </div>
      {isStudent && (
        <div className="field mb-3">
          <label htmlFor="bio">Over mij</label>
          <textarea
            id="bio"
            name="bio"
            maxLength={400}
            rows={4}
            placeholder="Vertel kort wie je bent: wat je studeert, waar je goed in bent, wanneer je beschikbaar bent..."
            defaultValue={state.values?.bio ?? bio ?? ""}
          />
          <p className="mt-1 text-xs text-ink-soft">
            Klanten zien deze tekst, samen met je aantal voltooide klussen en
            gemiddelde score, wanneer je je aanmeldt voor een klus.
          </p>
        </div>
      )}
      {isStudent && (
        <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="notify_new_tasks"
            defaultChecked={state.values?.notify ?? notifyNewTasks}
            className="mt-1"
          />
          <span>
            Mail mij wanneer er een nieuwe klus beschikbaar is.
            <span className="block text-xs text-ink-soft">
              Je krijgt enkel de gegevens te zien die ook op het prikbord staan.
            </span>
          </span>
        </label>
      )}
      {state.error && <p className="mb-2 text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-navy px-3.5 py-2 text-sm"
      >
        {pending ? "Bezig..." : "Opslaan"}
      </button>
    </form>
  );
}
