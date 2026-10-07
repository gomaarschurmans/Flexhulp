"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useToast } from "@/components/Toast";

type Confirm = {
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
};

/**
 * Knop die een server action uitvoert, optioneel met een bevestigingsvenster
 * vooraf, en nadien een korte melding toont. Vervangt kale
 * <form action={...}>-knoppen die onomkeerbare dingen deden zonder
 * bevestiging of feedback.
 */
export function ConfirmAction({
  action,
  label,
  className = "btn btn-ghost px-3.5 py-2 text-xs",
  confirm,
  successMessage,
}: {
  action: () => Promise<void | { error?: string }>;
  label: string;
  className?: string;
  confirm?: Confirm;
  successMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function run() {
    setOpen(false);
    startTransition(async () => {
      try {
        const result = await action();
        if (result && result.error) {
          toast(result.error, "error");
        } else if (successMessage) {
          toast(successMessage);
        }
      } catch (e) {
        // Een redirect() in de action (bv. "te laat om te annuleren") is geen fout.
        const digest = (e as { digest?: unknown } | null)?.digest;
        if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) return;
        toast("Er ging iets mis. Probeer opnieuw.", "error");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => (confirm ? setOpen(true) : run())}
        className={className}
      >
        {pending ? "Bezig..." : label}
      </button>

      {confirm && (
        <dialog
          ref={dialogRef}
          onClose={() => setOpen(false)}
          className="w-[min(92vw,420px)] rounded-xl border border-line bg-card p-6 text-ink backdrop:bg-black/40"
        >
          <h3 className="mb-2 text-lg font-semibold">{confirm.title}</h3>
          <p className="mb-5 text-sm text-ink-soft">{confirm.text}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost px-4 py-2 text-sm"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={run}
              className={`btn px-4 py-2 text-sm ${
                confirm.danger ? "bg-danger text-white" : "btn-navy"
              }`}
            >
              {confirm.confirmLabel}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
