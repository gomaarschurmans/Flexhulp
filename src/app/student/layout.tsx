import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { isStudentProfileComplete } from "@/lib/studentProfile";

export default async function StudentLayout({
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
    .select("name, role, bio, traits, photo_path, photo_status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "student") redirect("/");

  // Een student moet eerst een profiel met foto hebben voor hij klussen ziet.
  // Wie al een toegewezen klus heeft, kan die nog steeds afronden.
  if (!isStudentProfileComplete(profile)) {
    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id);
    if (!count) redirect("/profiel-afmaken");
  }

  return (
    <div>
      <Navbar name={profile.name} role="student" />
      <div className="mx-auto max-w-[1080px] px-6 pb-20 pt-8">{children}</div>
    </div>
  );
}
