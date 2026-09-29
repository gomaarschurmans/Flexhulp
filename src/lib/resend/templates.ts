import { formatDateTime, formatEuro, formatTimeRange } from "@/lib/utils";
import type { HourRequest, Task } from "@/lib/types/domain";

const wrapper = (title: string, bodyHtml: string) => `
<div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F5F3EE; color: #16181D;">
  <img src="https://www.flexhulp.be/flexhulp-logo.png" alt="Flexhulp" height="32" style="height: 32px; width: auto; margin: 0 0 20px; display: block;" />
  <h2 style="font-size: 18px; margin: 0 0 12px;">${title}</h2>
  <div style="font-size: 15px; line-height: 1.6;">${bodyHtml}</div>
  <p style="font-size: 12px; color: #5B5F66; margin-top: 32px;">Klussen &amp; opdrachten voor studenten.</p>
</div>`;

export function newApplicationClientEmail(task: Task, studentName: string) {
  return {
    subject: `${studentName} wil je taak uitvoeren`,
    html: wrapper(
      "Een student heeft interesse getoond",
      `<p><strong>${studentName}</strong> wil je taak '<strong>${task.title}</strong>' op
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong> uitvoeren.</p>
       <p>Log in op Flexhulp om te kiezen wie je de taak toewijst.</p>`
    ),
  };
}

export function studentChosenEmail(task: Task) {
  return {
    subject: `Je bent gekozen voor '${task.title}'`,
    html: wrapper(
      "Je bent gekozen!",
      `<p>Goed nieuws! <strong>${task.client_name}</strong> heeft je gekozen voor
       '<strong>${task.title}</strong>' op
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong>.</p>
       <p>Locatie: ${task.location}</p>`
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
      `<p><strong>${task.client_name}</strong> (${task.client_email}) heeft een tijdstip geboekt.</p>
       <p>Categorie: <strong>${task.category}</strong><br/>
       Gepland op: <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong><br/>
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
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong> (${task.category}) ingetrokken.</p>
       <p>Dit tijdstip staat weer open voor andere klanten.</p>`
    ),
  };
}

export function paymentRequestEmail(task: Task, checkoutUrl: string) {
  const amount = formatEuro(task.hours * task.rate_at_creation);
  return {
    subject: `Betaalverzoek: ${task.category} — ${amount}`,
    html: wrapper(
      "Je taak is voltooid",
      `<p>Bedankt! <strong>${task.category}</strong> op
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong> is uitgevoerd.</p>
       <p>Te betalen: <strong>${amount}</strong> (${task.hours} u × ${formatEuro(task.rate_at_creation)})</p>
       <p style="margin-top: 20px;">
         <a href="${checkoutUrl}" style="display: inline-block; background: #16181D; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
           Betaal nu
         </a>
       </p>`
    ),
  };
}

export function newRequestAdminEmail(request: HourRequest) {
  return {
    subject: `Nieuwe aanvraag: ${request.category} — ±${request.estimated_hours} u`,
    html: wrapper(
      "Nieuwe aanvraag voor extra uren",
      `<p><strong>${request.client_name}</strong> (${request.client_email}
       ${request.client_phone ? `· ${request.client_phone}` : ""}) heeft een aanvraag ingediend.</p>
       <p>Categorie: <strong>${request.category}</strong><br/>
       Geschatte uren: <strong>±${request.estimated_hours} u</strong><br/>
       Gewenste periode: <strong>${request.preferred_period}</strong></p>
       ${request.description ? `<p>Toelichting: ${request.description}</p>` : ""}
       <p>Dit is enkel een aanvraag — er is nog niets geboekt. Geef zelf een
       tijdvenster vrij als je hierop wil ingaan.</p>`
    ),
  };
}

export function welcomeEmail(name: string, role: "client" | "student") {
  const roleText =
    role === "client"
      ? "Je kan meteen een taak plaatsen."
      : "Je kan meteen openstaande taken bekijken en je aanmelden voor wat bij je past.";
  return {
    subject: "Welkom bij Flexhulp",
    html: wrapper(
      `Welkom, ${name}!`,
      `<p>Je account is bevestigd. ${roleText}</p>`
    ),
  };
}
