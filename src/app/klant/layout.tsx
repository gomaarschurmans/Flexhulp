import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";

export default async function KlantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "client") redirect("/");

  return (
    <div>
      <Navbar name={profile.name} role="client" />
      <div className="mx-auto max-w-[1080px] px-6 pb-20 pt-8">{children}</div>
    </div>
  );
}
