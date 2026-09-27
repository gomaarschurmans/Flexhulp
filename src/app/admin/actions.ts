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
  revalidatePath("/klant");
}

export async function updateCancellationPolicy(formData: FormData) {
  const hours = parseInt(String(formData.get("cancellation_notice_hours") ?? ""), 10);
  if (isNaN(hours) || hours < 0) return;

  const supabase = await createClient();
  await supabase
    .from("platform_settings")
    .update({ cancellation_notice_hours: hours })
    .eq("id", 1);

  revalidatePath("/admin");
  revalidatePath("/klant");
}

export async function addAvailability(formData: FormData) {
  const slotDate = String(formData.get("slot_date") ?? "");
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const repeatWeeks = Math.max(
    0,
    Math.min(52, parseInt(String(formData.get("repeat_weeks") ?? "0"), 10) || 0)
  );
  if (!slotDate || !start || !end) return;
  if (start >= end) return;

  const supabase = await createClient();
  const rows = [];
  const base = new Date(slotDate + "T00:00:00");
  for (let week = 0; week <= repeatWeeks; week++) {
    const d = new Date(base);
    d.setDate(d.getDate() + week * 7);
    rows.push({
      slot_date: d.toISOString().slice(0, 10),
      start_time: start,
      end_time: end,
    });
  }

  await supabase.from("availability").insert(rows);
  revalidatePath("/admin");
  revalidatePath("/klant");
}

export async function removeAvailability(id: string) {
  const supabase = await createClient();
  await supabase.from("availability").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/klant");
}

export async function adminDeleteTask(id: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function setClientBanned(id: string, banned: boolean) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ banned }).eq("id", id);
  revalidatePath("/admin");
}
