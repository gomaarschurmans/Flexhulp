"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/account/actions";

const initialState: ProfileState = { error: null };

export function ProfileForm({
  phone,
  address,
}: {
  phone: string | null;
  address: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction}>
      <div className="field mb-3">
        <label htmlFor="phone">Telefoon</label>
        <input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} />
      </div>
      <div className="field mb-3">
        <label htmlFor="address">Adres</label>
        <input
          id="address"
          name="address"
          type="text"
          placeholder="Straat, huisnummer, postcode, gemeente"
          defaultValue={address ?? ""}
        />
        <p className="mt-1 text-xs text-ink-soft">
          Wordt gebruikt als factuuradres.
        </p>
      </div>
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
