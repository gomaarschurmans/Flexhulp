import type { PhotoStatus } from "@/lib/types/domain";

/** Karaktereigenschappen waaruit een student er 1 tot 3 kiest. */
export const TRAITS = [
  "Betrouwbaar",
  "Stipt",
  "Handig",
  "Vriendelijk",
  "Zelfstandig",
  "Sterk",
  "Zorgzaam",
  "Nauwkeurig",
  "Rustig",
  "Enthousiast",
  "Creatief",
  "Leergierig",
] as const;

export const MAX_TRAITS = 3;
export const MIN_BIO_LENGTH = 40;
export const MAX_BIO_LENGTH = 400;

export const PHOTO_REJECT_REASONS = [
  "Je gezicht is niet duidelijk zichtbaar",
  "De foto is niet verzorgd of passend genoeg",
  "Er staan meerdere personen op de foto",
  "De foto is te donker, onscherp of te klein",
  "Zonnebril, pet of masker bedekt je gezicht",
] as const;

export interface StudentProfileLike {
  bio: string | null;
  traits: string[] | null;
  photo_path: string | null;
  photo_status: PhotoStatus | null;
}

/** Heeft de student alle verplichte profielgegevens ingevuld (foto mag nog in behandeling zijn)? */
export function isStudentProfileComplete(p: StudentProfileLike): boolean {
  return (
    Boolean(p.photo_path) &&
    p.photo_status !== "rejected" &&
    (p.bio ?? "").trim().length >= MIN_BIO_LENGTH &&
    (p.traits ?? []).length >= 1
  );
}

/** URL waarlangs een geautoriseerde gebruiker de foto van een student ziet. */
export function photoUrl(studentId: string, version?: string | null): string {
  return `/api/photo/${studentId}${version ? `?v=${encodeURIComponent(version)}` : ""}`;
}
