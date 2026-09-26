"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  requestPasswordReset,
  type ResetRequestState,
} from "@/app/auth/actions";

const initialState: ResetRequestState = { error: null, sent: false };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-6">
      <Image
        src="/flexhulp-logo.png"
        alt="Flexhulp"
        width={190}
        height={40}
        priority
        className="mb-1 h-10 w-auto"
      />
      <p className="mb-8 text-sm text-ink-soft">
        klussen &amp; opdrachten voor studenten
      </p>

      <div className="card">
        <h2 className="mb-2 text-xl">Wachtwoord vergeten</h2>
        {state.sent ? (
          <p className="text-sm text-ink-soft">
            Als dit e-mailadres bij een account hoort, is er een mail met een
            link onderweg om een nieuw wachtwoord in te stellen. Check ook je
            spam.
          </p>
        ) : (
          <form action={formAction}>
            <p className="mb-4 text-sm text-ink-soft">
              Vul je e-mailadres in. We sturen je een link om een nieuw
              wachtwoord in te stellen.
            </p>
            <div className="field mb-2">
              <label htmlFor="email">E-mailadres</label>
              <input id="email" name="email" type="email" required />
            </div>
            {state.error && (
              <p className="mb-2 text-sm text-danger">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="btn btn-navy mt-4 w-full"
            >
              {pending ? "Bezig..." : "Stuur link"}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/login" className="font-semibold text-navy">
          Terug naar inloggen
        </Link>
      </p>
    </div>
  );
}
