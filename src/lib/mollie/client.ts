import createMollieClient, { type MollieClient } from "@mollie/api-client";

let _mollie: MollieClient | null = null;

/**
 * Lazy singleton, en geeft null terug als er geen sleutel is ingesteld
 * (i.p.v. te gooien) zodat online betalen optioneel blijft — precies zoals
 * Twilio/Turnstile elders in dit project.
 */
export function getMollie(): MollieClient | null {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return null;
  if (!_mollie) {
    _mollie = createMollieClient({ apiKey });
  }
  return _mollie;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.flexhulp.be";

/**
 * Adres waarmee Mollie ons terug bereikt (webhook en terugkeerpagina). Altijd
 * het definitieve adres met "www": flexhulp.be stuurt door naar www.flexhulp.be
 * en Mollie volgt zo'n omleiding niet altijd bij een webhook.
 */
export const CANONICAL_URL = SITE_URL.replace(/^(https?://)flexhulp.be/, "$1www.flexhulp.be");
