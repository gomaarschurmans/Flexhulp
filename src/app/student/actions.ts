"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentStats } from "@/lib/studentStats";
import { getResend, FROM_EMAIL } from "@/lib/resend/client";
import { newApplicationClientEmail, taskCompletedEmail } from "@/lib/resend/templates";
import { sendSms } from "@/lib/sms";
import { formatEuro, hasStarted, tasksOverlap } from "@/lib/utils";
import type { Task } from "@/lib/types/domain";

export async function applyToTask(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, phone, bio, banned, traits, photo_status")
    .eq("id", user.id)
    .single();
  if (!profile) return;
  if (profile.banned) {
    return { error: "Je account is geblokkeerd. Neem contact op met Flexhulp." };
  }
  if (profile.photo_status !== "approved") {
    return {
      error:
        profile.photo_status === "pending"
          ? "Je foto wordt nog gecontroleerd. Je kan je aanmelden zodra ze goedgekeurd is."
          : "Voeg eerst een goedgekeurde profielfoto toe op je accountpagina.",
    };
  }

  // Via de service-role client: de student mag de volledige klus niet lezen.
  const { data: task } = await createAdminClient()
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single<Task>();
  if (!task || task.status !== "open") {
    revalidatePath("/student");
    return { error: "Deze klus is niet meer beschikbaar." };
  }
  if (hasStarted(task)) {
    revalidatePath("/student");
    return { error: "Deze klus is al begonnen. Aanmelden kan niet meer." };
  }

  const { data: myTasks } = await supabase
    .from("tasks")
    .select("date, time, end_time")
    .eq("student_id", user.id)
    .eq("status", "accepted");
  if ((myTasks ?? []).some((t) => tasksOverlap(t, task))) {
    return { error: "Je hebt op dat moment al een andere klus." };
  }

  const stats = await getStudentStats(user.id);

  // De student mag de volledige taak niet lezen (klantgegevens): de RLS-policy
  // op task_applications controleert zelf of de klus op het prikbord staat.
  const { error } = await supabase.from("task_applications").insert({
    task_id: taskId,
    student_id: user.id,
    student_name: profile.name,
    student_email: profile.email,
    student_phone: profile.phone,
    student_bio: profile.bio,
    student_jobs_done: stats.jobsDone,
    student_avg_rating: stats.avgRating,
    student_rating_count: stats.ratingCount,
    student_has_photo: true,
    student_traits: profile.traits ?? [],
    student_reviews: stats.recentReviews,
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

  const { data: current } = await supabase
    .from("tasks")
    .select("date, time")
    .eq("id", id)
    .eq("student_id", user.id)
    .eq("status", "accepted")
    .maybeSingle();
  if (current && !hasStarted(current)) {
    return { error: "Je kan een klus pas afronden vanaf het begin ervan." };
  }

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

export type StudentReviewState = { error: string | null; saved?: boolean };

/** De student beoordeelt de klant na een afgeronde klus (één keer, 1 tot 5 sterren). */
export async function submitStudentReview(
  taskId: string,
  _prevState: StudentReviewState,
  formData: FormData
): Promise<StudentReviewState> {
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Kies een aantal sterren." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je bent niet ingelogd." };

  // De beoordeling wordt via de server geschreven (de database laat studenten
  // dit veld niet rechtstreeks aanpassen), na controle van eigenaar en status.
  const { data: updated, error } = await createAdminClient()
    .from("tasks")
    .update({ student_rating: rating, student_review_comment: comment || null })
    .eq("id", taskId)
    .eq("student_id", user.id)
    .eq("status", "done")
    .is("student_rating", null)
    .select("id");
  if (error || !updated?.length) {
    return { error: "Beoordelen is niet gelukt. Misschien heb je deze klus al beoordeeld." };
  }

  revalidatePath("/student");
  return { error: null, saved: true };
}
