"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { login, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

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
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field mb-2">
          <label htmlFor="password">Wachtwoord</label>
          <input id="password" name="password" type="password" required />
        </div>
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
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Nog geen account?{" "}
        <Link href="/signup" className="font-semibold text-navy">
          Registreer
        </Link>
      </p>
    </div>
  );
}
