import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, FROM_EMAIL, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend/client";
import {
  reminderClientEmail,
  reminderStudentEmail,
  reminderAdminEmail,
  completionReminderStudentEmail,
  overdueAdminEmail,
} from "@/lib/resend/templates";
import { sendSms, ADMIN_NOTIFICATION_PHONE } from "@/lib/sms";
import { brusselsDateString, formatTimeRange } from "@/lib/utils";
import type { Task } from "@/lib/types/domain";

/**
 * Dagelijks (zie vercel.json) een herinnering voor alle klussen van morgen,
 * naar klant en toegewezen student, plus een planningsoverzicht voor de
 * admin. Vercel stuurt automatisch "Authorization: Bearer $CRON_SECRET"
 * mee; zonder ingestelde CRON_SECRET weigert deze route alles.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 401 });
  }

  const admin = createAdminClient();
  const tomorrow = brusselsDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const { data: tasks, error } = await admin
    .from("tasks")
    .select("*")
    .eq("date", tomorrow)
    .in("status", ["open", "accepted"])
    .is("reminder_sent_at", null)
    .order("time")
    .returns<Task[]>();

  if (error) {
    console.error("Herinneringen ophalen mislukt", error);
    return NextResponse.json({ error: "Ophalen mislukt" }, { status: 500 });
  }

  const resend = getResend();
  const handled: Task[] = [];

  for (const task of tasks ?? []) {
    // Taken van verwijderde accounts zijn geanonimiseerd: niets te mailen.
    if (!task.client_id) continue;

    try {
      const client = reminderClientEmail(task);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: task.client_email,
        subject: client.subject,
        html: client.html,
      });
      await sendSms(
        task.client_phone,
        `Flexhulp: herinnering, morgen ${formatTimeRange(task.date, task.time, task.end_time)} (${task.category}).`
      );

      if (task.student_id && task.student_email) {
        const student = reminderStudentEmail(task);
        await resend.emails.send({
          from: FROM_EMAIL,
          to: task.student_email,
          subject: student.subject,
          html: student.html,
        });
        const { data: profile } = await admin
          .from("profiles")
          .select("phone")
          .eq("id", task.student_id)
          .maybeSingle();
        await sendSms(
          profile?.phone,
          `Flexhulp: herinnering, morgen ${formatTimeRange(task.date, task.time, task.end_time)} (${task.category}) bij ${task.client_name}.`
        );
      }

      await admin
        .from("tasks")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", task.id);
      handled.push(task);
    } catch (e) {
      console.error(`Herinnering voor taak ${task.id} mislukt`, e);
    }
  }

  if (handled.length > 0) {
    try {
      const summary = reminderAdminEmail(handled);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: summary.subject,
        html: summary.html,
      });
      await sendSms(
        ADMIN_NOTIFICATION_PHONE,
        `Flexhulp: morgen ${handled.length} klus${handled.length > 1 ? "sen" : ""} op de planning.`
      );
    } catch (e) {
      console.error("Planningsoverzicht versturen mislukt", e);
    }
  }

  // Vergeten afrondingen: toegewezen klussen van vóór vandaag die nog niet als
  // voltooid staan. De student krijgt één keer een herinnering, de admin een overzicht.
  const today = brusselsDateString(new Date());
  const { data: overdue } = await admin
    .from("tasks")
    .select("*")
    .eq("status", "accepted")
    .lt("date", today)
    .is("completion_reminder_sent_at", null)
    .returns<Task[]>();

  const nagged: Task[] = [];
  for (const task of overdue ?? []) {
    if (!task.student_id || !task.student_email) continue;
    try {
      const mail = completionReminderStudentEmail(task);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: task.student_email,
        subject: mail.subject,
        html: mail.html,
      });
      await admin
        .from("tasks")
        .update({ completion_reminder_sent_at: new Date().toISOString() })
        .eq("id", task.id);
      nagged.push(task);
    } catch (e) {
      console.error(`Afrondherinnering voor taak ${task.id} mislukt`, e);
    }
  }

  if (nagged.length > 0) {
    try {
      const summary = overdueAdminEmail(nagged);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: summary.subject,
        html: summary.html,
      });
    } catch (e) {
      console.error("Overzicht van niet-afgeronde klussen versturen mislukt", e);
    }
  }

  return NextResponse.json({
    date: tomorrow,
    reminded: handled.length,
    overdue: nagged.length,
  });
}
