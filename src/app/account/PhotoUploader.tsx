"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { uploadPhoto, type PhotoState } from "@/app/account/actions";
import { useToast } from "@/components/Toast";
import { StudentAvatar } from "@/components/StudentAvatar";
import type { PhotoStatus } from "@/lib/types/domain";

const initialState: PhotoState = { error: null };
const OUTPUT_SIZE = 640;

export function PhotoUploader({
  studentId,
  name,
  status,
  rejectReason,
  version,
}: {
  studentId: string;
  name: string;
  status: PhotoStatus | null;
  rejectReason: string | null;
  version: string | null;
}) {
  const [state, formAction] = useActionState(uploadPhoto, initialState);
  const [pending, startTransition] = useTransition();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (state.saved) {
      toast("Foto opgeslagen. We controleren ze zo snel mogelijk.");
      setBlob(null);
      setPreview(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }, [state, toast]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Verkleint en snijdt de foto vierkant bij vóór het uploaden: sneller en veel kleiner.
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const side = Math.min(bitmap.width, bitmap.height);
      if (side < 300) {
        setLocalError("Deze foto is te klein. Kies een foto van minstens 300 × 300 pixels.");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(
        bitmap,
        (bitmap.width - side) / 2,
        (bitmap.height - side) / 2,
        side,
        side,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );
      const out = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.88)
      );
      if (!out) throw new Error("blob");
      setBlob(out);
      setPreview(URL.createObjectURL(out));
    } catch {
      setLocalError("Deze foto kan niet gelezen worden. Probeer een JPG- of PNG-foto.");
    }
  }

  function save() {
    if (!blob) return;
    const fd = new FormData();
    fd.append("photo", new File([blob], "foto.jpg", { type: "image/jpeg" }));
    startTransition(() => formAction(fd));
  }

  const error = localError ?? state.error;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Voorbeeld van je nieuwe foto"
            className="h-24 w-24 shrink-0 rounded-full border border-line object-cover"
          />
        ) : (
          <StudentAvatar
            studentId={studentId}
            name={name}
            hasPhoto={status !== null}
            size={96}
            version={version}
          />
        )}
        <div className="text-sm">
          {preview ? (
            <p className="font-medium">Zo zien klanten je foto.</p>
          ) : status === "approved" ? (
            <span className="rounded-full bg-teal-soft px-2.5 py-1 text-xs font-semibold text-teal">
              Goedgekeurd
            </span>
          ) : status === "pending" ? (
            <span className="rounded-full bg-[#FCEFD8] px-2.5 py-1 text-xs font-semibold text-amber-deep">
              Wordt gecontroleerd
            </span>
          ) : status === "rejected" ? (
            <span className="rounded-full bg-[#FBEAE6] px-2.5 py-1 text-xs font-semibold text-danger">
              Afgekeurd
            </span>
          ) : (
            <span className="text-ink-soft">Nog geen foto</span>
          )}
          {!preview && status === "rejected" && rejectReason && (
            <p className="mt-1.5 text-danger">{rejectReason}</p>
          )}
          {!preview && status === "pending" && (
            <p className="mt-1.5 text-ink-soft">
              Je kan je aanmelden voor klussen zodra de foto goedgekeurd is.
            </p>
          )}
        </div>
      </div>

      <ul className="mb-4 list-disc space-y-0.5 pl-5 text-xs text-ink-soft">
        <li>Een recente, verzorgde foto waarop je gezicht duidelijk zichtbaar is</li>
        <li>Alleen jezelf, goed belicht en scherp</li>
        <li>Geen zonnebril, pet of masker</li>
      </ul>

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFile}
        className="mb-3 block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-card file:px-3.5 file:py-2 file:text-sm file:font-semibold"
        aria-label="Kies een foto"
      />
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={!blob || pending}
        className="btn btn-navy px-3.5 py-2 text-sm"
      >
        {pending ? "Bezig..." : status ? "Nieuwe foto opslaan" : "Foto opslaan"}
      </button>
    </div>
  );
}
