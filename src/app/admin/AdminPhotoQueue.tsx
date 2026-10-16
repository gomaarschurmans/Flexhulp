"use client";

import { useState } from "react";
import { reviewPhoto } from "@/app/admin/actions";
import { ConfirmAction } from "@/components/ConfirmAction";
import { StudentAvatar } from "@/components/StudentAvatar";
import { PHOTO_REJECT_REASONS } from "@/lib/studentProfile";
import type { Profile } from "@/lib/types/domain";

/** Studenten wier foto wacht op goedkeuring, met een grote foto om te beoordelen. */
export function AdminPhotoQueue({ students }: { students: Profile[] }) {
  if (students.length === 0) {
    return (
      <p className="rounded border border-dashed border-line p-5 text-center text-sm text-ink-soft">
        Geen foto's om goed te keuren.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {students.map((s) => (
        <PhotoReviewCard key={s.id} student={s} />
      ))}
    </div>
  );
}

function PhotoReviewCard({ student }: { student: Profile }) {
  const [reason, setReason] = useState<string>(PHOTO_REJECT_REASONS[0]);
  const [extra, setExtra] = useState("");
  const fullReason = extra.trim() ? `${reason}. ${extra.trim()}` : reason;

  return (
    <div className="card">
      <div className="mb-3 flex items-start gap-4">
        <StudentAvatar
          studentId={student.id}
          name={student.name}
          hasPhoto
          size={120}
          version={student.photo_updated_at}
        />
        <div className="min-w-0 flex-1 text-sm">
          <strong className="block text-base">{student.name}</strong>
          <span className="block text-xs text-ink-soft">{student.email}</span>
          {student.traits?.length > 0 && (
            <p className="mt-1.5 text-xs text-teal">{student.traits.join(" · ")}</p>
          )}
          {student.bio && <p className="mt-1.5 text-ink-soft">{student.bio}</p>}
        </div>
      </div>
      <p className="mb-3 text-xs text-ink-soft">
        Goedkeuren als het gezicht duidelijk zichtbaar is, de foto verzorgd oogt en alleen deze
        student erop staat.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <ConfirmAction
          action={() => reviewPhoto(student.id, true, "")}
          label="Goedkeuren"
          className="btn btn-teal px-3.5 py-2 text-xs"
          successMessage={`Foto van ${student.name} goedgekeurd.`}
        />
      </div>

      <details className="rounded border border-line p-3 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
          Afkeuren met reden
        </summary>
        <div className="field mt-3">
          <label htmlFor={`reason-${student.id}`}>Reden</label>
          <select
            id={`reason-${student.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {PHOTO_REJECT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="field mb-3">
          <label htmlFor={`extra-${student.id}`}>Toelichting (optioneel)</label>
          <input
            id={`extra-${student.id}`}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            maxLength={200}
          />
        </div>
        <ConfirmAction
          action={() => reviewPhoto(student.id, false, fullReason)}
          label="Foto afkeuren"
          className="btn btn-ghost px-3.5 py-2 text-xs"
          successMessage="Foto afgekeurd. De student krijgt een mail."
          confirm={{
            title: "Foto afkeuren?",
            text: `${student.name} krijgt een mail met de reden en kan een nieuwe foto uploaden.`,
            confirmLabel: "Ja, afkeuren",
            danger: true,
          }}
        />
      </details>
    </div>
  );
}
