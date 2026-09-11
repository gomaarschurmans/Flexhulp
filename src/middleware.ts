import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { Role } from "@/lib/types/domain";

const ROLE_HOME: Record<Role, string> = {
  client: "/klant",
  student: "/student",
  admin: "/admin",
};

const ROLE_PREFIX: Record<string, Role> = {
  "/klant": "client",
  "/student": "student",
  "/admin": "admin",
};

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, role } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isAuthRoute = path === "/login" || path === "/signup";
  const guardedPrefix = Object.keys(ROLE_PREFIX).find((prefix) =>
    path.startsWith(prefix)
  );

  if (!user && guardedPrefix) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = role ? ROLE_HOME[role] : "/";
    return NextResponse.redirect(url);
  }

  if (user && guardedPrefix && role && ROLE_PREFIX[guardedPrefix] !== role) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role];
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
