"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface TurnstileApi {
  render: (el: HTMLElement, options: { sitekey: string }) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Cloudflare Turnstile. Rendert enkel als NEXT_PUBLIC_TURNSTILE_SITE_KEY is
 * ingesteld, zodat de app blijft werken zolang die sleutel nog niet is toegevoegd.
 *
 * Het widget wordt zelf getekend (explicit) in plaats van via het script: het
 * script tekent anders enkel bij een volledige paginalading en niet wanneer je
 * via een link naar de pagina navigeert. Elke code is bovendien eenmalig: geef
 * `resetKey` mee (bv. de uitkomst van het formulier) om na elke poging een
 * nieuwe code te vragen.
 */
export function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const mount = () => {
      if (cancelled || widgetId.current || !container.current || !window.turnstile) {
        return Boolean(widgetId.current);
      }
      widgetId.current = window.turnstile.render(container.current, { sitekey: siteKey });
      return true;
    };

    // Het script kan nog aan het laden zijn: probeer tot het klaar is.
    if (!mount()) {
      timer = setInterval(() => {
        if (mount()) clearInterval(timer);
      }, 200);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          // widget bestaat al niet meer
        }
      }
      widgetId.current = null;
    };
  }, [siteKey]);

  // Een gebruikte code is niet opnieuw geldig: vraag een nieuwe na elke poging.
  useEffect(() => {
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, [resetKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={container} className="mb-3" />
    </>
  );
}
