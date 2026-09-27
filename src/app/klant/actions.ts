"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";
import { getResend, FROM_EMAIL, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend/client";
import { newBookingAdminEmail, taskCancelledAdminEmail } from "@/lib/resend/templates";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendSms, ADMIN_NOTIFICATION_PHONE } from "@/lib/sms";
import { formatDateTime } from "@/lib/utils";
import type { Task } from "@/lib/types/domain";

const bookSlotSchema = z.object({
  slot_id: z.string().uuid("Kies een tijdslot."),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(1, "Geef een beschrijving van de klus."),
  location: z.string().trim().min(1, "Geef een locatie op."),
  extra_info: z.string().trim().default(""),
});

export type BookSlotState = { error: string | null };

export async function bookSlot(
  _prevState: BookSlotState,
  formData: FormData
): Promise<BookSlotState> {
  const parsed = bookSlotSchema.safeParse({
    slot_id: formData.get("slot_id"),
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
    .rpc("book_slot", {
      p_slot_id: parsed.data.slot_id,
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
    `Nieuwe boeking: ${task.category} op ${formatDateTime(task.date, task.time)} — ${task.client_name}`
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
    `Boeking ingetrokken: ${task.category} op ${formatDateTime(task.date, task.time)}`
  );

  revalidatePath("/klant");
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
