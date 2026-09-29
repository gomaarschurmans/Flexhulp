"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";

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
  const { error } = await supabase.auth.signUp({
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
  redirect("/login");
}
