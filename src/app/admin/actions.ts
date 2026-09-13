"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateRate(formData: FormData) {
  const rate = parseFloat(String(formData.get("hourly_rate") ?? ""));
  if (!rate || rate <= 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("platform_settings")
    .update({
      hourly_rate: rate,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", 1);

  revalidatePath("/admin");
}

export async function addAvailability(formData: FormData) {
  const slotDate = String(formData.get("slot_date") ?? "");
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  if (!slotDate || !start || !end) return;
  if (start >= end) return;

  const supabase = await createClient();
  await supabase.from("availability").insert({
    slot_date: slotDate,
    start_time: start,
    end_time: end,
  });

  revalidatePath("/admin");
}

export async function removeAvailability(id: string) {
  const supabase = await createClient();
  const { data: slot } = await supabase
    .from("availability")
    .select("status")
    .eq("id", id)
    .single();
  if (slot?.status === "booked") return;

  await supabase.from("availability").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function adminDeleteTask(id: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/admin");
}
