import { Resend } from "resend";

let _resend: Resend | null = null;

// Lazy singleton: instantiating Resend eagerly at module load time throws
// when RESEND_API_KEY is unset, which breaks `next build`'s page-data
// collection step (it imports every route module) even though the key is
// only actually needed once an email is sent at request time.
export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Flexhulp <noreply@flexhulp.be>";
