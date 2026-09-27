"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    })
    .eq("client_id", user.id);

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(user.id);

  await supabase.auth.signOut();
  redirect("/");
}
