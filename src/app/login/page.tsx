"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  login,
  resendConfirmation,
  type AuthState,
  type ResendState,
} from "@/app/auth/actions";
import { PasswordInput } from "@/components/PasswordInput";

const initialState: AuthState = { error: null };
const resendInitial: ResendState = { error: null, sent: false };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [resendState, resendAction, resendPending] = useActionState(
    resendConfirmation,
    resendInitial
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
      <form action={formAction} className="card">
        <h2 className="mb-5 text-xl">Inloggen</h2>
        <div className="field mb-4">
          <label htmlFor="email">E-mailadres</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field mb-2">
          <label htmlFor="password">Wachtwoord</label>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
        <label className="mb-3 flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="remember" defaultChecked />
          Onthoud mij op dit toestel
        </label>
        {state.error && (
          <p className="mb-2 text-sm text-danger">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="btn btn-navy mt-4 w-full"
        >
          {pending ? "Bezig..." : "Inloggen"}
        </button>
        <p className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="text-ink-soft underline">
            Wachtwoord vergeten?
          </Link>
        </p>
      </form>

      {state.unconfirmedEmail && !resendState.sent && (
        <form action={resendAction} className="mt-3 text-center">
          <input type="hidden" name="email" value={state.unconfirmedEmail} />
          <button
            type="submit"
            disabled={resendPending}
            className="text-sm text-navy underline"
          >
            {resendPending ? "Bezig..." : "Stuur bevestigingsmail opnieuw"}
          </button>
        </form>
      )}
      {resendState.sent && (
        <p className="mt-3 text-center text-sm text-teal">
          Nieuwe bevestigingsmail verstuurd — check je mailbox.
        </p>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        Nog geen account?{" "}
        <Link href="/signup" className="font-semibold text-navy">
          Registreer
        </Link>
      </p>
    </div>
  );
}
