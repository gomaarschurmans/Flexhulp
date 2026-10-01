"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  REMEMBER_COOKIE,
  ACTIVE_SESSION_COOKIE,
  REMEMBER_MAX_AGE,
} from "@/lib/authCookies";

export type AuthState = {
  error: string | null;
  unconfirmedEmail?: string;
};

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return { error: "Vul je e-mailadres en wachtwoord in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Je account is nog niet bevestigd. Check je mailbox voor de bevestigingslink.",
        unconfirmedEmail: email,
      };
    }
    return { error: "Ongeldig e-mailadres of wachtwoord." };
  }

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(REMEMBER_COOKIE, remember ? "1" : "0", {
    maxAge: REMEMBER_MAX_AGE,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });
  if (remember) {
    cookieStore.delete(ACTIVE_SESSION_COOKIE);
  } else {
    // Geen maxAge/expires: een echte sessiecookie die verdwijnt zodra de
    // browser volledig afgesloten wordt (niet enkel het tabblad).
    cookieStore.set(ACTIVE_SESSION_COOKIE, "1", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
    });
  }

  redirect("/");
}

export type ResendState = { error: string | null; sent: boolean };

export async function resendConfirmation(
  _prevState: ResendState,
  formData: FormData
): Promise<ResendState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Vul je e-mailadres in.", sent: false };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/confirm` },
  });
  if (error) {
    return { error: "Opnieuw versturen is mislukt. Probeer later opnieuw.", sent: false };
  }

  return { error: null, sent: true };
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "student" ? "student" : "client";
  const acceptedTerms = formData.get("accept_terms") === "on";

  if (!name || !email || password.length < 8) {
    return {
      error: "Vul je naam, e-mailadres en een wachtwoord van minstens 8 tekens in.",
    };
  }
  if (!acceptedTerms) {
    return {
      error: "Je moet akkoord gaan met de voorwaarden en privacyverklaring.",
    };
  }

  const turnstileOk = await verifyTurnstile(formData.get("cf-turnstile-response"));
  if (!turnstileOk) {
    return { error: "Verificatie mislukt. Probeer opnieuw." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role, phone: phone || null },
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  });
  if (error) {
    return { error: error.message };
  }

  // Supabase geeft bij een reeds bestaand, bevestigd account geen fout
  // terug maar een "nep" user-object met een lege identities-lijst (om te
  // voorkomen dat je kan afleiden welke e-mailadressen al een account
  // hebben). Zonder deze check belandt iemand die per ongeluk opnieuw
  // registreert misleidend op "check je mailbox" zonder dat er iets
  // verstuurd werd.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      error:
        "Dit e-mailadres heeft al een account. Probeer in te loggen, of vraag een nieuw wachtwoord aan als je het vergeten bent.",
    };
  }

  redirect("/signup/check-email");
}

export type ResetRequestState = { error: string | null; sent: boolean };

export async function requestPasswordReset(
  _prevState: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Vul je e-mailadres in.", sent: false };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm`,
  });

  // Altijd hetzelfde antwoord, zodat niemand kan nagaan welke adressen een account hebben.
  return { error: null, sent: true };
}

export async function updatePassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Kies een wachtwoord van minstens 8 tekens." };
  }
  if (password !== confirm) {
    return { error: "De twee wachtwoorden komen niet overeen." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Deze link is verlopen. Vraag een nieuwe aan." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(REMEMBER_COOKIE);
  cookieStore.delete(ACTIVE_SESSION_COOKIE);

  redirect("/login");
}
