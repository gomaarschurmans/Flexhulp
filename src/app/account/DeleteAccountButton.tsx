"use client";

import { useState } from "react";
import { deleteAccount } from "@/app/account/actions";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-danger px-4 py-2.5 text-sm font-semibold text-danger transition-opacity hover:opacity-80"
      >
        Account verwijderen
      </button>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-danger">
        Weet je het zeker? Dit kan niet ongedaan gemaakt worden.
      </p>
      <div className="flex gap-2">
        <form action={deleteAccount}>
          <button
            type="submit"
            className="rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ja, definitief verwijderen
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="btn btn-ghost px-4 py-2.5 text-sm"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
