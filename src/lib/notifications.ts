import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, FROM_EMAIL } from "@/lib/resend/client";
import { newTaskStudentEmail } from "@/lib/resend/templates";
import type { Task } from "@/lib/types/domain";

type Mail = { to: string; subject: string; html: string };

/** Verstuurt mails in groepjes van 100 (limiet van Resend per batch). Fouten worden gelogd, niet gegooid. */
export async function sendMails(mails: Mail[]) {
  if (mails.length === 0) return;
  const resend = getResend();
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    try {
      await resend.batch.send(
        chunk.map((m) => ({
          from: FROM_EMAIL,
          to: [m.to],
          subject: m.subject,
          html: m.html,
        }))
      );
    } catch (e) {
      console.error("Batch-mail versturen mislukt", e);
    }
  }
}

/** Mailt alle actieve studenten die meldingen aan hebben over een nieuwe klus. */
export async function notifyStudentsOfNewTask(task: Task) {
  const { data: students, error } = await createAdminClient()
    .from("profiles")
    .select("email")
    .eq("role", "student")
    .eq("banned", false)
    .eq("notify_new_tasks", true);
  if (error) {
    console.error("Studenten ophalen voor melding mislukt", error);
    return;
  }

  const { subject, html } = newTaskStudentEmail(task);
  await sendMails((students ?? []).map((s) => ({ to: s.email, subject, html })));
}
