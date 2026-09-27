"use client";

import Script from "next/script";

/**
 * Rendert enkel als NEXT_PUBLIC_TURNSTILE_SITE_KEY is ingesteld, zodat de
 * app blijft werken zolang die sleutel nog niet is toegevoegd.
 */
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <div className="cf-turnstile mb-3" data-sitekey={siteKey} />
    </>
  );
}
