import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types/domain";

const ROLE_HOME: Record<Role, string> = {
  client: "/klant",
  student: "/student",
  admin: "/admin",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  redirect(ROLE_HOME[(profile?.role as Role) ?? "client"]);
}
