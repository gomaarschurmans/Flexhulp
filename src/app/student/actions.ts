"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend/client";
import { taskAcceptedEmail, taskCompletedEmail } from "@/lib/resend/templates";
import type { Task } from "@/lib/types/domain";

export async function acceptTask(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single();
  if (!profile) return;

  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      status: "accepted",
      student_id: user.id,
      student_name: profile.name,
      student_email: profile.email,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "open")
    .select()
    .single<Task>();

  revalidatePath("/student");

  if (error || !task) return;

  try {
    const { subject, html } = taskAcceptedEmail(task);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: task.client_email,
      subject,
      html,
    });
  } catch (e) {
    console.error("Bevestigingsmail versturen mislukt", e);
  }
}

export async function completeTask(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: task, error } = await supabase
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("student_id", user.id)
    .eq("status", "accepted")
    .select()
    .single<Task>();

  revalidatePath("/student");

  if (error || !task) return;

  try {
    const { subject, html } = taskCompletedEmail(task);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: task.client_email,
      subject,
      html,
    });
  } catch (e) {
    console.error("Voltooiingsmail versturen mislukt", e);
  }
}
