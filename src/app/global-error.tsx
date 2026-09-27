"use client";

import { useEffect } from "react";
import { ensureSentryClient, Sentry } from "@/lib/sentry-client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    ensureSentryClient();
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#F5F3EE" }}>
        <div style={{ maxWidth: 420, margin: "80px auto", padding: 24, textAlign: "center" }}>
          <h1 style={{ color: "#1E2A44" }}>Er ging iets mis</h1>
          <p style={{ color: "#5B5F66" }}>
            Probeer de pagina te vernieuwen. We zijn automatisch op de hoogte
            gebracht.
          </p>
        </div>
      </body>
    </html>
  );
}
