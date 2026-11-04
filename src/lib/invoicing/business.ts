export const SELLER = {
  name: "Gomar Schurmans",
  tradeName: "Flexhulp",
  address: "Nielstraat 73, 3840 Borgloon, België",
  vatNumber: "BE 1031.198.882",
  email: "gomaar.schurmans@gmail.com",
  /**
   * Rekeningnummer voor overschrijvingen, in te stellen via
   * NEXT_PUBLIC_BUSINESS_IBAN. Staat dit leeg, dan tonen factuur en mail geen
   * overschrijvingsgegevens (enkel de online betaallink).
   */
  iban: (process.env.NEXT_PUBLIC_BUSINESS_IBAN ?? "").trim(),
};

/** Contactadres voor klanten en studenten (voorwaarden, privacy, klachten). */
export const CONTACT_EMAIL = SELLER.email;

/** Aantal dagen waarbinnen een factuur betaald moet zijn. */
export const PAYMENT_TERM_DAYS = 14;

export const VAT_EXEMPTION_TEXT =
  "Bijzondere vrijstellingsregeling kleine ondernemingen van toepassing (art. 56bis W.BTW) — BTW niet aangerekend.";

export function formatInvoiceNumber(n: number): string {
  return `FH-${String(n).padStart(6, "0")}`;
}

/** Vervaldatum van een factuur: de factuurdatum plus de betalingstermijn. */
export function invoiceDueDate(issuedAt: string): Date {
  const due = new Date(issuedAt);
  due.setDate(due.getDate() + PAYMENT_TERM_DAYS);
  return due;
}

/** "BE12 3456 7890 1234": IBAN in groepjes van vier. */
export function formatIban(iban: string): string {
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}
