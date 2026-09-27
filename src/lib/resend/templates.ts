import { formatDateTime, formatEuro } from "@/lib/utils";
import type { Task } from "@/lib/types/domain";

const wrapper = (title: string, bodyHtml: string) => `
<div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F5F3EE; color: #16181D;">
  <img src="https://www.flexhulp.be/flexhulp-logo.png" alt="Flexhulp" height="32" style="height: 32px; width: auto; margin: 0 0 20px; display: block;" />
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

export function newBookingAdminEmail(task: Task) {
  return {
    subject: `Nieuwe boeking: ${task.category} op ${formatDateTime(task.date, task.time)}`,
    html: wrapper(
      "Nieuwe boeking binnengekomen",
      `<p><strong>${task.client_name}</strong> (${task.client_email}) heeft een tijdslot geboekt.</p>
       <p>Categorie: <strong>${task.category}</strong><br/>
       Gepland op: <strong>${formatDateTime(task.date, task.time)}</strong><br/>
       Locatie: ${task.location}</p>
       <p>Beschrijving: ${task.description}</p>
       ${task.extra_info ? `<p>Extra info: ${task.extra_info}</p>` : ""}`
    ),
  };
}

export function taskCancelledAdminEmail(task: Task) {
  return {
    subject: `Boeking ingetrokken: ${task.category} op ${formatDateTime(task.date, task.time)}`,
    html: wrapper(
      "Klant heeft een boeking ingetrokken",
      `<p><strong>${task.client_name}</strong> (${task.client_email}) heeft de boeking voor
       <strong>${formatDateTime(task.date, task.time)}</strong> (${task.category}) ingetrokken.</p>
       <p>Het tijdslot staat weer open voor andere klanten.</p>`
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
