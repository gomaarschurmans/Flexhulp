import { createClient } from "@/lib/supabase/server";
import { StudentTaskLists } from "@/app/student/StudentTaskLists";

export default async function StudentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: assigned }, { data: board }, { data: applications }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase.from("task_board").select("*").order("created_at"),
      supabase.from("task_applications").select("*"),
    ]);

  return (
    <StudentTaskLists
      initialAssigned={assigned ?? []}
      initialBoard={board ?? []}
      initialApplications={applications ?? []}
      userId={user!.id}
    />
  );
}
