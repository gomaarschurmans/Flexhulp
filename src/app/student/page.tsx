import { createClient } from "@/lib/supabase/server";
import { StudentTaskLists } from "@/app/student/StudentTaskLists";

export default async function StudentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tasks }, { data: applications }] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("task_applications").select("*"),
  ]);

  return (
    <StudentTaskLists
      initialTasks={tasks ?? []}
      initialApplications={applications ?? []}
      userId={user!.id}
    />
  );
}
