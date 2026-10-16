import { formatDateTime, formatEuro, formatHours, formatTimeRange } from "@/lib/utils";
import { formatInvoiceNumber } from "@/lib/invoicing/business";
import type { HourRequest, Invoice, Task } from "@/lib/types/domain";

/** Escapet tekst van gebruikers voordat die in de HTML van een e-mail komt. */
export const esc = (value: string | null | undefined): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");

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
      `<p><strong>${esc(studentName)}</strong> wil je taak '<strong>${esc(task.title)}</strong>' op
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
      `<p>Goed nieuws! <strong>${esc(task.client_name)}</strong> heeft je gekozen voor
       '<strong>${esc(task.title)}</strong>' op
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong>.</p>
       <p>Locatie: ${esc(task.location)}</p>`
    ),
  };
}

export function taskCompletedEmail(task: Task) {
  const payout = formatEuro(task.hours * task.rate_at_creation);
  return {
    subject: `'${task.title}' is voltooid`,
    html: wrapper(
      "Opdracht voltooid",
      `<p><strong>${esc(task.student_name)}</strong> heeft '<strong>${esc(task.title)}</strong>' als voltooid gemarkeerd.</p>
       <p>Uitbetaling: <strong>${payout}</strong> (${formatHours(task.hours)} u × ${formatEuro(task.rate_at_creation)})</p>`
    ),
  };
}

export function newBookingAdminEmail(task: Task) {
  return {
    subject: `Nieuwe boeking: ${task.category} op ${formatDateTime(task.date, task.time)}`,
    html: wrapper(
      "Nieuwe boeking binnengekomen",
      `<p><strong>${esc(task.client_name)}</strong> (${esc(task.client_email)}) heeft een tijdstip geboekt.</p>
       <p>Categorie: <strong>${task.category}</strong><br/>
       Gepland op: <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong><br/>
       Locatie: ${esc(task.location)}</p>
       <p>Beschrijving: ${esc(task.description)}</p>
       ${task.extra_info ? `<p>Extra info: ${esc(task.extra_info)}</p>` : ""}`
    ),
  };
}

export function taskCancelledAdminEmail(task: Task) {
  return {
    subject: `Boeking ingetrokken: ${task.category} op ${formatDateTime(task.date, task.time)}`,
    html: wrapper(
      "Klant heeft een boeking ingetrokken",
      `<p><strong>${esc(task.client_name)}</strong> (${esc(task.client_email)}) heeft de boeking voor
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong> (${task.category}) ingetrokken.</p>
       <p>Dit tijdstip staat weer open voor andere klanten.</p>`
    ),
  };
}

export function paymentRequestEmail(
  task: Task,
  checkoutUrl: string | null,
  invoice: Invoice | null,
  invoiceUrl: string | null
) {
  const amount = formatEuro(task.hours * task.rate_at_creation);
  return {
    subject: checkoutUrl
      ? `Betaalverzoek: ${task.category}, ${amount}`
      : `Factuur: ${task.category}, ${amount}`,
    html: wrapper(
      "Je taak is voltooid",
      `<p>Bedankt! <strong>${task.category}</strong> op
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong> is uitgevoerd.</p>
       <p>Te betalen: <strong>${amount}</strong> (${formatHours(task.hours)} u × ${formatEuro(task.rate_at_creation)})</p>
       ${invoice ? `<p>Factuur: <strong>${formatInvoiceNumber(invoice.invoice_number)}</strong></p>` : ""}
       <p style="margin-top: 20px;">
         ${
           checkoutUrl
             ? `<a href="${checkoutUrl}" style="display: inline-block; background: #16181D; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                 Betaal nu
               </a>`
             : ""
         }
         ${
           invoiceUrl
             ? `<a href="${invoiceUrl}" style="display: inline-block; margin-left: ${checkoutUrl ? "10px" : "0"}; color: #16181D; padding: 12px 0; text-decoration: underline; font-weight: 600;">
                 Bekijk factuur
               </a>`
             : ""
         }
       </p>`
    ),
  };
}

export function reminderClientEmail(task: Task) {
  const when = formatTimeRange(task.date, task.time, task.end_time);
  return {
    subject: `Herinnering: morgen ${task.category}`,
    html: wrapper(
      "Tot morgen!",
      `<p>Een korte herinnering: <strong>${task.category}</strong> staat morgen gepland.</p>
       <p>Wanneer: <strong>${when}</strong><br/>
       Adres: ${esc(task.location)}<br/>
       ${task.student_name ? `Student: <strong>${esc(task.student_name)}</strong>` : "Er is nog geen student toegewezen."}</p>
       <p>Zorg dat de plek bereikbaar is en dat alles klaarligt wat nodig is.</p>`
    ),
  };
}

export function reminderStudentEmail(task: Task) {
  const when = formatTimeRange(task.date, task.time, task.end_time);
  return {
    subject: `Herinnering: morgen ${task.category}`,
    html: wrapper(
      "Je klus van morgen",
      `<p>Een korte herinnering: je hebt morgen een klus.</p>
       <p><strong>${task.category}</strong><br/>
       Wanneer: <strong>${when}</strong><br/>
       Adres: ${esc(task.location)}<br/>
       Klant: ${esc(task.client_name)}${task.client_phone ? ` (${esc(task.client_phone)})` : ""}</p>
       ${task.description ? `<p>Wat moet er gebeuren: ${esc(task.description)}</p>` : ""}
       ${task.extra_info ? `<p>Extra info: ${esc(task.extra_info)}</p>` : ""}`
    ),
  };
}

export function reminderAdminEmail(tasks: Task[]) {
  const rows = tasks
    .map(
      (t) =>
        `<li><strong>${t.time.slice(0, 5)} tot ${t.end_time.slice(0, 5)}</strong>, ${t.category}, ${esc(t.client_name)}, ${esc(t.location)}${
          t.student_name ? ` (student: ${esc(t.student_name)})` : ""
        }</li>`
    )
    .join("");
  return {
    subject: `Morgen op de planning: ${tasks.length} klus${tasks.length > 1 ? "sen" : ""}`,
    html: wrapper(
      "Planning van morgen",
      `<ul style="padding-left: 18px;">${rows}</ul>
       <p>Klanten en studenten hebben hun herinnering gekregen.</p>`
    ),
  };
}

export function newRequestAdminEmail(request: HourRequest) {
  return {
    subject: `Nieuwe aanvraag: ${request.category} — ±${request.estimated_hours} u`,
    html: wrapper(
      "Nieuwe aanvraag voor extra uren",
      `<p><strong>${esc(request.client_name)}</strong> (${esc(request.client_email)}
       ${request.client_phone ? `· ${esc(request.client_phone)}` : ""}) heeft een aanvraag ingediend.</p>
       <p>Categorie: <strong>${request.category}</strong><br/>
       Geschatte uren: <strong>±${request.estimated_hours} u</strong><br/>
       Gewenste periode: <strong>${esc(request.preferred_period)}</strong></p>
       ${request.description ? `<p>Toelichting: ${esc(request.description)}</p>` : ""}
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
      `Welkom, ${esc(name)}!`,
      `<p>Je account is bevestigd. ${roleText}</p>`
    ),
  };
}

const SITE_LINK = "https://www.flexhulp.be";

const button = (href: string, label: string) =>
  `<p style="margin-top: 20px;"><a href="${href}" style="display: inline-block; background: #16181D; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">${label}</a></p>`;

/**
 * Melding aan studenten over een nieuwe klus. Bevat bewust enkel wat ook op
 * het prikbord staat (geen naam, adres of contactgegevens van de klant).
 */
export function newTaskStudentEmail(task: Task) {
  const description =
    task.description.length > 200 ? `${task.description.slice(0, 197)}...` : task.description;
  return {
    subject: `Nieuwe klus: ${task.category} op ${formatDateTime(task.date, task.time)}`,
    html: wrapper(
      "Er staat een nieuwe klus voor je klaar",
      `<p><strong>${esc(task.category)}</strong> in <strong>${esc(task.city) || "onbekende gemeente"}</strong></p>
       <p>Wanneer: <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong><br/>
       Duur en vergoeding: <strong>${formatHours(task.hours)} u · ${formatEuro(task.hours * task.rate_at_creation)}</strong></p>
       ${description ? `<p>${esc(description)}</p>` : ""}
       ${button(`${SITE_LINK}/student`, "Bekijk de klus")}
       <p style="font-size: 12px; color: #5B5F66; margin-top: 24px;">Geen meldingen meer over nieuwe klussen? Zet ze uit in
       <a href="${SITE_LINK}/account" style="color: #5B5F66;">je accountinstellingen</a>.</p>`
    ),
  };
}

export function notChosenEmail(task: Task) {
  return {
    subject: `Update over de klus ${task.category} op ${formatDateTime(task.date, task.time)}`,
    html: wrapper(
      "De klant koos een andere student",
      `<p>Bedankt voor je aanmelding voor <strong>${esc(task.category)}</strong> op
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong>.
       De klant heeft deze keer voor een andere student gekozen.</p>
       <p>Geen zorgen: er komen regelmatig nieuwe klussen bij.</p>
       ${button(`${SITE_LINK}/student`, "Bekijk andere klussen")}`
    ),
  };
}

export function taskRemovedApplicantEmail(task: Task) {
  return {
    subject: `Klus ingetrokken: ${task.category} op ${formatDateTime(task.date, task.time)}`,
    html: wrapper(
      "De klus gaat niet door",
      `<p>De klant heeft de klus <strong>${esc(task.category)}</strong> op
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong> ingetrokken,
       waarvoor jij je had aangemeld.</p>
       ${button(`${SITE_LINK}/student`, "Bekijk andere klussen")}`
    ),
  };
}

export function completionReminderStudentEmail(task: Task) {
  return {
    subject: `Vergeet niet af te ronden: ${task.category} op ${formatDateTime(task.date, task.time)}`,
    html: wrapper(
      "Rond je klus af",
      `<p>Je klus <strong>${esc(task.category)}</strong> bij ${esc(task.client_name)} op
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong> staat nog niet als
       voltooid. Was alles klaar? Markeer hem dan af, zodat de klant de factuur krijgt en jij
       uitbetaald kan worden.</p>
       ${button(`${SITE_LINK}/student`, "Klus afronden")}`
    ),
  };
}

export function overdueAdminEmail(tasks: Task[]) {
  const rows = tasks
    .map(
      (t) =>
        `<li>${formatTimeRange(t.date, t.time, t.end_time)}, ${esc(t.category)}, ${esc(t.client_name)}${
          t.student_name ? ` (student: ${esc(t.student_name)})` : ""
        }</li>`
    )
    .join("");
  return {
    subject: `${tasks.length} klus${tasks.length > 1 ? "sen" : ""} nog niet afgerond`,
    html: wrapper(
      "Klussen die nog niet afgerond zijn",
      `<ul style="padding-left: 18px;">${rows}</ul>
       <p>De betrokken studenten hebben een herinnering gekregen. Zie je dat de klus wel
       uitgevoerd is, dan kan je hem zelf als voltooid markeren in het adminpaneel.</p>`
    ),
  };
}

export function studentPaidEmail(task: Task) {
  return {
    subject: `Je vergoeding is uitbetaald: ${task.category}`,
    html: wrapper(
      "Uitbetaling verstuurd",
      `<p>Je vergoeding van <strong>${formatEuro(task.hours * task.rate_at_creation)}</strong> voor
       <strong>${esc(task.category)}</strong> op
       <strong>${formatTimeRange(task.date, task.time, task.end_time)}</strong> is uitbetaald.</p>`
    ),
  };
}
