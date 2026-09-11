import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend/client";
import { welcomeEmail } from "@/lib/resend/templates";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", data.user.id)
        .single();

      if (profile && profile.role !== "admin" && data.user.email) {
        try {
          const { subject, html } = welcomeEmail(
            profile.name,
            profile.role as "client" | "student"
          );
          await getResend().emails.send({
            from: FROM_EMAIL,
            to: data.user.email,
            subject,
            html,
          });
        } catch (e) {
          console.error("Welkomstmail versturen mislukt", e);
        }
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm_failed`);
}
