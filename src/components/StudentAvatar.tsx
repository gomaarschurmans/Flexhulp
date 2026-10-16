"use client";

import { useState } from "react";
import { photoUrl } from "@/lib/studentProfile";

/** Profielfoto van een student, met initialen als de foto ontbreekt of niet laadt. */
export function StudentAvatar({
  studentId,
  name,
  hasPhoto,
  size = 48,
  version,
}: {
  studentId: string;
  name: string;
  hasPhoto: boolean;
  size?: number;
  version?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const style = { width: size, height: size };

  if (hasPhoto && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl(studentId, version)}
        alt={`Foto van ${name}`}
        style={style}
        className="shrink-0 rounded-full border border-line bg-card object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: size * 0.38 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-teal-soft font-semibold text-teal"
    >
      {initials || "?"}
    </span>
  );
}
