"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile, type ProfileState } from "@/app/account/actions";
import { useToast } from "@/components/Toast";
import { MAX_BIO_LENGTH, MAX_TRAITS, MIN_BIO_LENGTH, TRAITS } from "@/lib/studentProfile";

const initialState: ProfileState = { error: null };

export function ProfileForm({
  phone,
  address,
  bio,
  traits,
  notifyNewTasks,
  isStudent,
}: {
  phone: string | null;
  address: string | null;
  bio: string | null;
  traits: string[];
  notifyNewTasks: boolean;
  isStudent: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>(traits);
  const [bioLength, setBioLength] = useState((bio ?? "").length);

  // Na een actie wist React de velden: zet de teruggestuurde waarden terug.
  useEffect(() => {
    if (state.values) {
      setSelected(state.values.traits);
      setBioLength(state.values.bio.length);
    }
  }, [state.values]);

  function toggleTrait(trait: string) {
    setSelected((cur) =>
      cur.includes(trait)
        ? cur.filter((t) => t !== trait)
        : cur.length < MAX_TRAITS
          ? [...cur, trait]
          : cur
    );
  }

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
        <>
          <div className="field mb-3">
            <label htmlFor="bio">Wie ben je en wat doe je?</label>
            <textarea
              id="bio"
              name="bio"
              maxLength={MAX_BIO_LENGTH}
              rows={5}
              required
              onChange={(e) => setBioLength(e.target.value.length)}
              placeholder="Bv. Ik ben Sien, 20 jaar en studeer verpleegkunde. Ik werk graag buiten, ben handig en kom altijd op tijd. Meestal beschikbaar in het weekend."
              defaultValue={state.values?.bio ?? bio ?? ""}
            />
            <p className="mt-1 text-xs text-ink-soft">
              Klanten lezen dit samen met je foto, je aantal voltooide klussen en je score
              wanneer je je aanmeldt. {bioLength}/{MAX_BIO_LENGTH} tekens
              {bioLength < MIN_BIO_LENGTH ? ` (minstens ${MIN_BIO_LENGTH})` : ""}.
            </p>
          </div>

          <fieldset className="mb-4">
            <legend className="mb-1.5 block text-sm font-medium text-ink-soft">
              Welke eigenschappen passen bij jou? (kies 1 tot {MAX_TRAITS})
            </legend>
            <div className="flex flex-wrap gap-2">
              {TRAITS.map((trait) => {
                const on = selected.includes(trait);
                const full = !on && selected.length >= MAX_TRAITS;
                return (
                  <label
                    key={trait}
                    className={`cursor-pointer rounded-full border px-3.5 py-2 text-sm transition-colors ${
                      on
                        ? "border-teal bg-teal-soft font-semibold text-teal"
                        : full
                          ? "cursor-not-allowed border-line text-ink-soft opacity-50"
                          : "border-line text-ink-soft hover:border-teal"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="traits"
                      value={trait}
                      checked={on}
                      disabled={full}
                      onChange={() => toggleTrait(trait)}
                      className="sr-only"
                    />
                    {trait}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </>
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
