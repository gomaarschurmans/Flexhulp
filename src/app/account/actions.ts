"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, FROM_EMAIL, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend/client";
import { newPhotoAdminEmail } from "@/lib/resend/templates";
import { MAX_PHOTO_BYTES, PHOTO_BUCKET, sniffImageType } from "@/lib/photos";
import { MAX_BIO_LENGTH, MAX_TRAITS, MIN_BIO_LENGTH, TRAITS } from "@/lib/studentProfile";

export type ProfileState = {
  error: string | null;
  saved?: boolean;
  values?: { phone: string; address: string; bio: string; notify: boolean; traits: string[] };
};

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  // Het "over mij"-veld bestaat enkel in het formulier van studenten.
  const hasBio = formData.has("bio");
  const bio = String(formData.get("bio") ?? "").trim().slice(0, MAX_BIO_LENGTH);
  const traits = formData
    .getAll("traits")
    .map(String)
    .filter((t, i, all) => (TRAITS as readonly string[]).includes(t) && all.indexOf(t) === i)
    .slice(0, MAX_TRAITS);
  // Meldingen over nieuwe klussen (enkel in het formulier van studenten).
  const notify = formData.get("notify_new_tasks") === "on";
  // React wist uncontrolled velden na een actie: stuur de waarden terug.
  const values = { phone, address, bio, notify, traits };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je bent niet ingelogd.", values };

  if (hasBio) {
    if (bio.length < MIN_BIO_LENGTH) {
      return {
        error: `Vertel iets meer over jezelf (minstens ${MIN_BIO_LENGTH} tekens). Klanten lezen dit bij je aanmelding.`,
        values,
      };
    }
    if (traits.length < 1) {
      return { error: "Kies minstens één eigenschap die bij je past.", values };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      phone: phone || null,
      address: address || null,
      ...(hasBio ? { bio, traits, notify_new_tasks: notify } : {}),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Opslaan is mislukt. Probeer opnieuw.", values };
  }

  if (hasBio) {
    // Lopende aanmeldingen tonen de nieuwe tekst meteen aan de klant.
    await createAdminClient()
      .from("task_applications")
      .update({ student_bio: bio, student_traits: traits })
      .eq("student_id", user.id);
  }

  revalidatePath("/account");
  revalidatePath("/profiel-afmaken");
  return { error: null, saved: true, values };
}

export type PhotoState = { error: string | null; saved?: boolean };

/** Slaat een nieuwe profielfoto op (privé) en zet ze in de wachtrij voor goedkeuring. */
export async function uploadPhoto(
  _prevState: PhotoState,
  formData: FormData
): Promise<PhotoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je bent niet ingelogd." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "student") {
    return { error: "Enkel studenten hebben een profielfoto." };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Kies eerst een foto." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: "Deze foto is te groot (maximaal 3 MB). Kies een kleinere foto." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) return { error: "Gebruik een JPG-, PNG- of WebP-foto." };

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("profiles")
    .select("photo_path")
    .eq("id", user.id)
    .single();

  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType: type, upsert: false });
  if (uploadError) {
    console.error("Foto uploaden mislukt", uploadError);
    return { error: "Uploaden is mislukt. Probeer opnieuw." };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      photo_path: path,
      photo_status: "pending",
      photo_reject_reason: null,
      photo_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (updateError) {
    await admin.storage.from(PHOTO_BUCKET).remove([path]);
    return { error: "Opslaan is mislukt. Probeer opnieuw." };
  }

  if (before?.photo_path) {
    await admin.storage.from(PHOTO_BUCKET).remove([before.photo_path]);
  }
  // Een nieuwe foto moet eerst opnieuw goedgekeurd worden voor klanten ze zien.
  await admin
    .from("task_applications")
    .update({ student_has_photo: false })
    .eq("student_id", user.id);

  try {
    const { subject, html } = newPhotoAdminEmail(profile.name);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject,
      html,
    });
  } catch (e) {
    console.error("Adminmelding over nieuwe foto mislukt", e);
  }

  revalidatePath("/account");
  revalidatePath("/profiel-afmaken");
  revalidatePath("/student");
  revalidatePath("/admin");
  return { error: null, saved: true };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Taken blijven bestaan (nodig voor de boekhouding en voor de andere
  // partij in een reeds geboekte klus), maar worden ontdaan van
  // persoonsgegevens — zie de privacyverklaring.
  await supabase
    .from("tasks")
    .update({
      client_name: "Verwijderde gebruiker",
      client_email: "verwijderd@flexhulp.be",
      client_phone: null,
      description: "",
      extra_info: "",
      location: "",
      city: "",
    })
    .eq("client_id", user.id);

  const admin = createAdminClient();

  // Profielfoto verwijderen en de naam van een student op afgeronde klussen
  // anonimiseren (de klus zelf blijft bestaan voor de boekhouding).
  const { data: own } = await admin
    .from("profiles")
    .select("photo_path")
    .eq("id", user.id)
    .maybeSingle();
  if (own?.photo_path) {
    await admin.storage.from(PHOTO_BUCKET).remove([own.photo_path]);
  }
  await admin
    .from("tasks")
    .update({ student_name: "Verwijderde student", student_email: null })
    .eq("student_id", user.id);

  await admin.auth.admin.deleteUser(user.id);

  await supabase.auth.signOut();
  redirect("/");
}
