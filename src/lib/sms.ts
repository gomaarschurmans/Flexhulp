import twilio from "twilio";

export const ADMIN_NOTIFICATION_PHONE = process.env.ADMIN_NOTIFICATION_PHONE ?? null;

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  if (!client) client = twilio(sid, token);
  return client;
}

/**
 * Verstuurt een sms als Twilio geconfigureerd is en het nummer gekend is.
 * Faalt altijd stil (loggen, geen exception) zodat sms nooit een
 * belangrijkere actie (boeking, e-mail) kan laten mislukken.
 */
export async function sendSms(to: string | null | undefined, body: string) {
  if (!to) return;
  const c = getClient();
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!c || !from) return;

  try {
    await c.messages.create({ to, from, body });
  } catch (e) {
    console.error("Sms versturen mislukt", e);
  }
}
