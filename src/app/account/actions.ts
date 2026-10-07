"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProfileState = {
  error: string | null;
  saved?: boolean;
  values?: { phone: string; address: string; bio: string };
};

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  // Het "over mij"-veld bestaat enkel in het formulier van studenten.
  const hasBio = formData.has("bio");
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 400);
  // React wist uncontrolled velden na een actie: stuur de waarden terug.
  const values = { phone, address, bio };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je bent niet ingelogd.", values };

  const { error } = await supabase
    .from("profiles")
    .update({
      phone: phone || null,
      address: address || null,
      ...(hasBio ? { bio: bio || null } : {}),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Opslaan is mislukt. Probeer opnieuw.", values };
  }

  if (hasBio) {
    // Lopende aanmeldingen tonen de nieuwe tekst meteen aan de klant.
    await createAdminClient()
      .from("task_applications")
      .update({ student_bio: bio || null })
      .eq("student_id", user.id);
  }

  revalidatePath("/account");
  return { error: null, saved: true, values };
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
  await admin.auth.admin.deleteUser(user.id);

  await supabase.auth.signOut();
  redirect("/");
}
