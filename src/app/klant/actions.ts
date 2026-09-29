"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/constants";
import { getResend, FROM_EMAIL, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend/client";
import {
  newBookingAdminEmail,
  taskCancelledAdminEmail,
  newRequestAdminEmail,
  studentChosenEmail,
} from "@/lib/resend/templates";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendSms, ADMIN_NOTIFICATION_PHONE } from "@/lib/sms";
import { getOrCreateTaskPayment } from "@/lib/mollie/payment";
import { formatTimeRange } from "@/lib/utils";
import type { HourRequest, Task } from "@/lib/types/domain";

const bookTimeRangeSchema = z
  .object({
    window_id: z.string().uuid("Kies een dag."),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Kies een starttijd."),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Kies een eindtijd."),
    category: z.enum(CATEGORIES),
    description: z.string().trim().min(1, "Geef een beschrijving van de klus."),
    location: z.string().trim().min(1, "Geef een locatie op."),
    extra_info: z.string().trim().default(""),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "Eindtijd moet na starttijd liggen.",
    path: ["end_time"],
  });

export type BookSlotState = { error: string | null };

export async function bookTimeRange(
  _prevState: BookSlotState,
  formData: FormData
): Promise<BookSlotState> {
  const parsed = bookTimeRangeSchema.safeParse({
    window_id: formData.get("window_id"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    category: formData.get("category"),
    description: formData.get("description"),
    location: formData.get("location"),
    extra_info: formData.get("extra_info"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  const turnstileOk = await verifyTurnstile(formData.get("cf-turnstile-response"));
  if (!turnstileOk) {
    return { error: "Verificatie mislukt. Probeer opnieuw." };
  }

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .rpc("book_time_range", {
      p_window_id: parsed.data.window_id,
      p_start_time: parsed.data.start_time,
      p_end_time: parsed.data.end_time,
      p_category: parsed.data.category,
      p_description: parsed.data.description,
      p_location: parsed.data.location,
      p_extra_info: parsed.data.extra_info,
    })
    .select()
    .single<Task>();

  if (error) {
    return { error: error.message };
  }

  try {
    const { subject, html } = newBookingAdminEmail(task);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject,
      html,
    });
  } catch (e) {
    console.error("Adminmelding versturen mislukt", e);
  }
  await sendSms(
    ADMIN_NOTIFICATION_PHONE,
    `Nieuwe boeking: ${task.category} op ${formatTimeRange(task.date, task.time, task.end_time)} — ${task.client_name}`
  );

  revalidatePath("/klant");
  return { error: null };
}

export async function cancelTask(id: string) {
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("status", "open")
    .single<Task>();
  if (!task) return;

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("cancellation_notice_hours")
    .eq("id", 1)
    .single();
  const noticeHours = settings?.cancellation_notice_hours ?? 24;

  const taskStart = new Date(`${task.date}T${task.time}`);
  const deadline = new Date(taskStart.getTime() - noticeHours * 60 * 60 * 1000);
  if (new Date() > deadline) {
    redirect("/klant?error=cancel_too_late");
  }

  await supabase.from("tasks").delete().eq("id", id).eq("status", "open");

  try {
    const { subject, html } = taskCancelledAdminEmail(task);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject,
      html,
    });
  } catch (e) {
    console.error("Annulerings-adminmelding versturen mislukt", e);
  }
  await sendSms(
    ADMIN_NOTIFICATION_PHONE,
    `Boeking ingetrokken: ${task.category} op ${formatTimeRange(task.date, task.time, task.end_time)}`
  );

  revalidatePath("/klant");
}

export async function payTask(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("client_id", user.id)
    .eq("status", "done")
    .single<Task>();
  if (!task || task.payment_status === "paid") return;

  let checkoutUrl: string | null = null;
  try {
    checkoutUrl = await getOrCreateTaskPayment(task);
  } catch (e) {
    console.error("Mollie-betaling aanmaken mislukt", e);
  }

  if (!checkoutUrl) {
    redirect("/klant?error=payment_unavailable");
  }

  redirect(checkoutUrl);
}

export async function acceptStudent(taskId: string, studentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("client_id", user.id)
    .eq("status", "open")
    .single<Task>();
  if (!task) return;

  const { data: application } = await supabase
    .from("task_applications")
    .select("*")
    .eq("task_id", taskId)
    .eq("student_id", studentId)
    .single();
  if (!application) return;

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("tasks")
    .update({
      student_id: studentId,
      student_name: application.student_name,
      student_email: application.student_email,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single<Task>();

  if (error || !updated) return;

  try {
    const { subject, html } = studentChosenEmail(updated);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: application.student_email,
      subject,
      html,
    });
  } catch (e) {
    console.error("Keuzemail versturen mislukt", e);
  }
  await sendSms(
    application.student_phone,
    `Flexhulp: je bent gekozen voor '${updated.title}' op ${formatTimeRange(updated.date, updated.time, updated.end_time)}.`
  );

  revalidatePath("/klant");
  revalidatePath("/student");
}

const editTaskSchema = z.object({
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(1, "Geef een beschrijving van de klus."),
  location: z.string().trim().min(1, "Geef een locatie op."),
  extra_info: z.string().trim().default(""),
});

export type EditTaskState = { error: string | null };

export async function editTask(
  id: string,
  _prevState: EditTaskState,
  formData: FormData
): Promise<EditTaskState> {
  const parsed = editTaskSchema.safeParse({
    category: formData.get("category"),
    description: formData.get("description"),
    location: formData.get("location"),
    extra_info: formData.get("extra_info"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      category: parsed.data.category,
      title: parsed.data.category,
      description: parsed.data.description,
      location: parsed.data.location,
      extra_info: parsed.data.extra_info,
    })
    .eq("id", id)
    .eq("status", "open");

  if (error) {
    return { error: "Bewerken is mislukt. Probeer opnieuw." };
  }

  revalidatePath("/klant");
  return { error: null };
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  review_comment: z.string().trim().default(""),
});

export type ReviewState = { error: string | null };

export async function submitReview(
  id: string,
  _prevState: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    review_comment: formData.get("review_comment"),
  });
  if (!parsed.success) {
    return { error: "Kies een score van 1 tot 5." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      rating: parsed.data.rating,
      review_comment: parsed.data.review_comment,
    })
    .eq("id", id)
    .eq("status", "done");

  if (error) {
    return { error: "Beoordeling opslaan is mislukt. Probeer opnieuw." };
  }

  revalidatePath("/klant");
  return { error: null };
}

const submitRequestSchema = z.object({
  category: z.enum(CATEGORIES),
  estimated_hours: z.coerce
    .number({ invalid_type_error: "Geef een geschat aantal uren op." })
    .positive("Geef een geschat aantal uren op."),
  preferred_period: z
    .string()
    .trim()
    .min(1, "Geef aan wanneer je dit ongeveer nodig hebt."),
  description: z.string().trim().default(""),
});

export type RequestState = { error: string | null; success: boolean };

export async function submitRequest(
  _prevState: RequestState,
  formData: FormData
): Promise<RequestState> {
  const parsed = submitRequestSchema.safeParse({
    category: formData.get("category"),
    estimated_hours: formData.get("estimated_hours"),
    preferred_period: formData.get("preferred_period"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Ongeldige invoer.",
      success: false,
    };
  }

  const turnstileOk = await verifyTurnstile(formData.get("cf-turnstile-response"));
  if (!turnstileOk) {
    return { error: "Verificatie mislukt. Probeer opnieuw.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Je bent niet ingelogd.", success: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, phone")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return { error: "Profiel niet gevonden.", success: false };
  }

  const { data: request, error } = await supabase
    .from("requests")
    .insert({
      client_id: user.id,
      client_name: profile.name,
      client_email: profile.email,
      client_phone: profile.phone,
      category: parsed.data.category,
      estimated_hours: parsed.data.estimated_hours,
      preferred_period: parsed.data.preferred_period,
      description: parsed.data.description,
    })
    .select()
    .single<HourRequest>();

  if (error) {
    return {
      error: "Aanvraag versturen is mislukt. Probeer opnieuw.",
      success: false,
    };
  }

  try {
    const { subject, html } = newRequestAdminEmail(request);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject,
      html,
    });
  } catch (e) {
    console.error("Aanvraag-adminmelding versturen mislukt", e);
  }
  await sendSms(
    ADMIN_NOTIFICATION_PHONE,
    `Nieuwe aanvraag: ${request.category} (±${request.estimated_hours} u) — ${request.client_name}`
  );

  revalidatePath("/klant");
  return { error: null, success: true };
}

export async function cancelRequest(id: string) {
  const supabase = await createClient();
  await supabase.from("requests").delete().eq("id", id).eq("status", "open");
  revalidatePath("/klant");
}
