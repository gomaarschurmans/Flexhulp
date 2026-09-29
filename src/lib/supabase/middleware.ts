import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/types/domain";
import { REMEMBER_COOKIE, ACTIVE_SESSION_COOKIE } from "@/lib/authCookies";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let user = authUser;

  if (user) {
    // "Onthoud mij" stond uit bij het inloggen (flexhulp_remember=0) en de
    // sessiecookie (geen maxAge, verdwijnt bij een volledige browserherstart)
    // is weg: forceer uitloggen. We raken hiervoor bewust niets aan de
    // Supabase-cookies zelf aan — enkel deze extra laag erbovenop.
    const remember = request.cookies.get(REMEMBER_COOKIE)?.value;
    const activeSession = request.cookies.get(ACTIVE_SESSION_COOKIE);
    if (remember === "0" && !activeSession) {
      await supabase.auth.signOut();
      user = null;
      supabaseResponse.cookies.delete(REMEMBER_COOKIE);
    }
  }

  let role: Role | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = (profile?.role as Role) ?? null;
  }

  return { supabaseResponse, user, role };
}
