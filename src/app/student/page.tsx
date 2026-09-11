import { createClient } from "@/lib/supabase/server";
import { StudentTaskLists } from "@/app/student/StudentTaskLists";

export default async function StudentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  return <StudentTaskLists initialTasks={tasks ?? []} userId={user!.id} />;
}
