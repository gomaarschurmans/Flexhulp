import { formatDateTime, formatEuro } from "@/lib/utils";
import type { Task } from "@/lib/types/domain";

const wrapper = (title: string, bodyHtml: string) => `
<div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F5F3EE; color: #16181D;">
  <h1 style="font-size: 22px; color: #1E2A44; margin: 0 0 16px;">Flexhulp</h1>
  <h2 style="font-size: 18px; margin: 0 0 12px;">${title}</h2>
  <div style="font-size: 15px; line-height: 1.6;">${bodyHtml}</div>
  <p style="font-size: 12px; color: #5B5F66; margin-top: 32px;">Klussen &amp; opdrachten voor studenten.</p>
</div>`;

export function taskAcceptedEmail(task: Task) {
  return {
    subject: `${task.student_name} heeft je opdracht geaccepteerd`,
    html: wrapper(
      "Je opdracht is geaccepteerd",
      `<p>Goed nieuws! <strong>${task.student_name}</strong> heeft je opdracht '<strong>${task.title}</strong>' geaccepteerd.</p>
       <p>Gepland op: <strong>${formatDateTime(task.date, task.time)}</strong><br/>
       Locatie: ${task.location}</p>`
    ),
  };
}

export function taskCompletedEmail(task: Task) {
  const payout = formatEuro(task.hours * task.rate_at_creation);
  return {
    subject: `'${task.title}' is voltooid`,
    html: wrapper(
      "Opdracht voltooid",
      `<p><strong>${task.student_name}</strong> heeft '<strong>${task.title}</strong>' als voltooid gemarkeerd.</p>
       <p>Uitbetaling: <strong>${payout}</strong> (${task.hours} u × ${formatEuro(task.rate_at_creation)})</p>`
    ),
  };
}

export function welcomeEmail(name: string, role: "client" | "student") {
  const roleText =
    role === "client"
      ? "Je kan meteen een taak plaatsen."
      : "Je kan meteen openstaande taken bekijken en accepteren.";
  return {
    subject: "Welkom bij Flexhulp",
    html: wrapper(
      `Welkom, ${name}!`,
      `<p>Je account is bevestigd. ${roleText}</p>`
    ),
  };
}
