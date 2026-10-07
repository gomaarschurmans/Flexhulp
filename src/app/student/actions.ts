"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, FROM_EMAIL } from "@/lib/resend/client";
import { newApplicationClientEmail, taskCompletedEmail } from "@/lib/resend/templates";
import { sendSms } from "@/lib/sms";
import { formatEuro } from "@/lib/utils";
import type { Task } from "@/lib/types/domain";

export async function applyToTask(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, phone")
    .eq("id", user.id)
    .single();
  if (!profile) return;

  // De student mag de volledige taak niet lezen (klantgegevens): de RLS-policy
  // op task_applications controleert zelf of de klus op het prikbord staat.
  const { error } = await supabase.from("task_applications").insert({
    task_id: taskId,
    student_id: user.id,
    student_name: profile.name,
    student_email: profile.email,
    student_phone: profile.phone,
  });

  if (error) {
    revalidatePath("/student");
    return {
      error:
        error.code === "23505"
          ? "Je bent al aangemeld voor deze klus."
          : "Aanmelden is niet gelukt. De klus is mogelijk al toegewezen.",
    };
  }

  const { data: task } = await createAdminClient()
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single<Task>();
  if (!task) return;

  try {
    const { subject, html } = newApplicationClientEmail(task, profile.name);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: task.client_email,
      subject,
      html,
    });
  } catch (e) {
    console.error("Aanmeldingsmail versturen mislukt", e);
  }
  await sendSms(
    task.client_phone,
    `Flexhulp: ${profile.name} wil je taak '${task.title}' uitvoeren. Log in om te kiezen.`
  );

  revalidatePath("/student");
  revalidatePath("/klant");
}

export async function withdrawApplication(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("task_applications")
    .delete()
    .eq("task_id", taskId)
    .eq("student_id", user.id);

  revalidatePath("/student");
  revalidatePath("/klant");
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

  if (error || !task) {
    return { error: "Markeren als voltooid is niet gelukt. Probeer opnieuw." };
  }

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
  await sendSms(
    task.client_phone,
    `Flexhulp: '${task.title}' is voltooid. Uitbetaling: ${formatEuro(task.hours * task.rate_at_creation)}.`
  );
}
