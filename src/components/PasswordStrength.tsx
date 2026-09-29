"use client";

const LEVELS = [
  { label: "Zwak", color: "bg-danger", width: "w-1/4" },
  { label: "Redelijk", color: "bg-amber", width: "w-2/4" },
  { label: "Goed", color: "bg-teal", width: "w-3/4" },
  { label: "Sterk", color: "bg-teal", width: "w-full" },
];

function scorePassword(password: string): number {
  if (!password) return -1;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score - 1, 3);
}

export function PasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);
  if (score < 0) return null;
  const level = LEVELS[Math.max(score, 0)];

  return (
    <div className="mb-3 -mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-all ${level.color} ${level.width}`}
        />
      </div>
      <p className="mt-1 text-xs text-ink-soft">Wachtwoordsterkte: {level.label}</p>
    </div>
  );
}
