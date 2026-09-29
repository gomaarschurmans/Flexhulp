"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { updatePassword, type AuthState } from "@/app/auth/actions";
import { PasswordInput } from "@/components/PasswordInput";

const initialState: AuthState = { error: null };

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
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

      <form action={formAction} className="card">
        <h2 className="mb-5 text-xl">Nieuw wachtwoord instellen</h2>
        <div className="field mb-4">
          <label htmlFor="password">Nieuw wachtwoord</label>
          <PasswordInput
            id="password"
            name="password"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="field mb-2">
          <label htmlFor="confirm">Herhaal wachtwoord</label>
          <PasswordInput
            id="confirm"
            name="confirm"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>
        {state.error && (
          <p className="mb-2 text-sm text-danger">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="btn btn-navy mt-4 w-full"
        >
          {pending ? "Bezig..." : "Wachtwoord opslaan"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Link verlopen?{" "}
        <Link href="/forgot-password" className="font-semibold text-navy">
          Vraag een nieuwe aan
        </Link>
      </p>
    </div>
  );
}
