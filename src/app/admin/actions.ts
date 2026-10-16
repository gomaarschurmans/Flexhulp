"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateTaskPayment } from "@/lib/mollie/payment";
import { SITE_URL } from "@/lib/mollie/client";
import { createInvoiceForTask } from "@/lib/invoicing/createInvoice";
import { getResend, FROM_EMAIL } from "@/lib/resend/client";
import {
  paymentRequestEmail,
  studentPaidEmail,
  photoApprovedEmail,
  photoRejectedEmail,
} from "@/lib/resend/templates";
import type { Task } from "@/lib/types/domain";

export async function updateRate(formData: FormData) {
  const rate = parseFloat(String(formData.get("hourly_rate") ?? ""));
  if (!rate || rate <= 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("platform_settings")
    .update({
      hourly_rate: rate,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", 1);

  revalidatePath("/admin");
  revalidatePath("/klant");
}

export async function updateCancellationPolicy(formData: FormData) {
  const hours = parseInt(String(formData.get("cancellation_notice_hours") ?? ""), 10);
  if (isNaN(hours) || hours < 0) return;

  const supabase = await createClient();
  await supabase
    .from("platform_settings")
    .update({ cancellation_notice_hours: hours })
    .eq("id", 1);

  revalidatePath("/admin");
  revalidatePath("/klant");
}

export async function addAvailability(formData: FormData) {
  const slotDate = String(formData.get("slot_date") ?? "");
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const repeatWeeks = Math.max(
    0,
    Math.min(52, parseInt(String(formData.get("repeat_weeks") ?? "0"), 10) || 0)
  );
  if (!slotDate || !start || !end) return;
  if (start >= end) return;

  const supabase = await createClient();
  const rows = [];
  const base = new Date(slotDate + "T00:00:00");
  for (let week = 0; week <= repeatWeeks; week++) {
    const d = new Date(base);
    d.setDate(d.getDate() + week * 7);
    rows.push({
      slot_date: d.toISOString().slice(0, 10),
      start_time: start,
      end_time: end,
    });
  }

  await supabase.from("availability").insert(rows);
  revalidatePath("/admin");
  revalidatePath("/klant");
}

export async function removeAvailability(id: string) {
  const supabase = await createClient();
  await supabase.from("availability").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/klant");
}

export async function markTaskDone(id: string) {
  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("status", "open")
    .single<Task>();
  if (!task) return;

  await supabase
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id);

  const invoice = await createInvoiceForTask(task);

  try {
    const checkoutUrl = await getOrCreateTaskPayment(task);
    const invoiceUrl = invoice ? `${SITE_URL}/klant/facturen/${invoice.id}` : null;
    if (checkoutUrl || invoiceUrl) {
      const { subject, html } = paymentRequestEmail(task, checkoutUrl, invoice, invoiceUrl);
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: task.client_email,
        subject,
        html,
      });
    }
  } catch (e) {
    console.error("Betaalverzoek aanmaken/versturen mislukt", e);
  }

  revalidatePath("/admin");
  revalidatePath("/klant");
}

export async function adminDeleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    return {
      error:
        error.code === "23503"
          ? "Deze taak heeft een factuur en kan niet verwijderd worden."
          : "Verwijderen is mislukt. Probeer opnieuw.",
    };
  }
  revalidatePath("/admin");
}

/** Houdt bij of de vergoeding van een voltooide klus al aan de student is uitbetaald. */
export async function setStudentPaid(id: string, paid: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Niet ingelogd." };

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return { error: "Geen toegang." };

  const { data: task, error } = await supabase
    .from("tasks")
    .update({ student_paid_at: paid ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("status", "done")
    .not("student_id", "is", null)
    .select()
    .single<Task>();
  if (error || !task) {
    return { error: "Bijwerken is mislukt. Enkel voltooide klussen met een student kunnen uitbetaald worden." };
  }

  if (paid && task.student_email) {
    try {
      const { subject, html } = studentPaidEmail(task);
      await getResend().emails.send({ from: FROM_EMAIL, to: task.student_email, subject, html });
    } catch (e) {
      console.error("Uitbetalingsmail versturen mislukt", e);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/student");
}

/** Keurt de profielfoto van een student goed of af (met reden). De student krijgt een mail. */
export async function reviewPhoto(studentId: string, approve: boolean, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Niet ingelogd." };

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return { error: "Geen toegang." };

  const cleanReason = reason.trim().slice(0, 300);
  if (!approve && !cleanReason) return { error: "Geef een reden op, zodat de student weet wat er moet veranderen." };

  const admin = createAdminClient();
  const { data: student, error } = await admin
    .from("profiles")
    .update({
      photo_status: approve ? "approved" : "rejected",
      photo_reject_reason: approve ? null : cleanReason,
    })
    .eq("id", studentId)
    .eq("role", "student")
    .not("photo_path", "is", null)
    .select("name, email")
    .single();
  if (error || !student) return { error: "Bijwerken is mislukt. Probeer opnieuw." };

  // Lopende aanmeldingen tonen de foto enkel zolang ze goedgekeurd is.
  await admin
    .from("task_applications")
    .update({ student_has_photo: approve })
    .eq("student_id", studentId);

  try {
    const mail = approve
      ? photoApprovedEmail(student.name)
      : photoRejectedEmail(student.name, cleanReason);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: student.email,
      subject: mail.subject,
      html: mail.html,
    });
  } catch (e) {
    console.error("Mail over fotobeoordeling versturen mislukt", e);
  }

  revalidatePath("/admin");
  revalidatePath("/student");
}

export async function setUserBanned(id: string, banned: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Niet ingelogd." };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return { error: "Geen toegang." };

  // De kolom `banned` is voor gewone gebruikers (en dus ook voor de sessie van
  // de admin) niet schrijfbaar; na de rolcontrole hierboven gaat het via de
  // service-role client.
  const { data, error } = await createAdminClient()
    .from("profiles")
    .update({ banned })
    .eq("id", id)
    .neq("role", "admin")
    .select("id");
  if (error || !data?.length) {
    return { error: "Wijzigen is mislukt. Probeer opnieuw." };
  }

  revalidatePath("/admin");
}

export async function markRequestHandled(id: string) {
  const supabase = await createClient();
  await supabase.from("requests").update({ status: "handled" }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/klant");
}

export async function deleteRequest(id: string) {
  const supabase = await createClient();
  await supabase.from("requests").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/klant");
}
