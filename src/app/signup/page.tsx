"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signup, type AuthState } from "@/app/auth/actions";
import { Turnstile } from "@/components/Turnstile";

const initialState: AuthState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [role, setRole] = useState<"client" | "student">("client");

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-6 py-10">
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
        <h2 className="mb-5 text-xl">Account aanmaken</h2>

        <div className="mb-4 flex rounded-full border border-line bg-card p-1">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              role === "client" ? "bg-navy text-white" : "text-ink-soft"
            }`}
          >
            Ik ben klant
          </button>
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              role === "student" ? "bg-teal text-white" : "text-ink-soft"
            }`}
          >
            Ik ben student
          </button>
        </div>
        <input type="hidden" name="role" value={role} />

        <div className="field mb-4">
          <label htmlFor="name">Jouw naam</label>
          <input id="name" name="name" type="text" placeholder="bv. Sien" required />
        </div>
        <div className="field mb-4">
          <label htmlFor="email">E-mailadres</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field mb-4">
          <label htmlFor="phone">Telefoonnummer (optioneel)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="bv. 0470 12 34 56"
          />
        </div>
        <div className="field mb-4">
          <label htmlFor="password">Wachtwoord</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
          />
        </div>

        <Turnstile />

        <label className="mb-4 flex items-start gap-2 text-xs text-ink-soft">
          <input type="checkbox" name="accept_terms" required className="mt-0.5" />
          <span>
            Ik ga akkoord met de{" "}
            <Link href="/terms" target="_blank" className="text-navy underline">
              algemene voorwaarden
            </Link>{" "}
            en de{" "}
            <Link href="/privacy" target="_blank" className="text-navy underline">
              privacyverklaring
            </Link>
            .
          </span>
        </label>

        {state.error && (
          <p className="mb-2 text-sm text-danger">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="btn btn-navy mt-2 w-full"
        >
          {pending ? "Bezig..." : "Registreren"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Al een account?{" "}
        <Link href="/login" className="font-semibold text-navy">
          Log in
        </Link>
      </p>
    </div>
  );
}
