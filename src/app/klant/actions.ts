"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Geef de taak een titel."),
  category: z.enum(CATEGORIES),
  description: z.string().trim().default(""),
  date: z.string().min(1, "Kies een datum."),
  time: z.string().min(1, "Kies een tijdstip."),
  location: z.string().trim().min(1, "Geef een locatie op."),
  hours: z.coerce.number().positive("Geef het aantal uren op."),
});

export type CreateTaskState = { error: string | null };

export async function createTask(
  _prevState: CreateTaskState,
  formData: FormData
): Promise<CreateTaskState> {
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description"),
    date: formData.get("date"),
    time: formData.get("time"),
    location: formData.get("location"),
    hours: formData.get("hours"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Je bent niet ingelogd." };

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("name, email").eq("id", user.id).single(),
    supabase.from("platform_settings").select("hourly_rate").eq("id", 1).single(),
  ]);
  if (!profile || !settings) return { error: "Kon je profiel niet laden." };

  const { error } = await supabase.from("tasks").insert({
    ...parsed.data,
    rate_at_creation: settings.hourly_rate,
    client_id: user.id,
    client_name: profile.name,
    client_email: profile.email,
  });

  if (error) return { error: "Taak plaatsen is mislukt. Probeer opnieuw." };

  revalidatePath("/klant");
  return { error: null };
}

export async function cancelTask(id: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id).eq("status", "open");
  revalidatePath("/klant");
}
