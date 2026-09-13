"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";

const bookSlotSchema = z.object({
  slot_id: z.string().uuid("Kies een tijdslot."),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(1, "Geef een beschrijving van de klus."),
  location: z.string().trim().min(1, "Geef een locatie op."),
  extra_info: z.string().trim().default(""),
});

export type BookSlotState = { error: string | null };

export async function bookSlot(
  _prevState: BookSlotState,
  formData: FormData
): Promise<BookSlotState> {
  const parsed = bookSlotSchema.safeParse({
    slot_id: formData.get("slot_id"),
    category: formData.get("category"),
    description: formData.get("description"),
    location: formData.get("location"),
    extra_info: formData.get("extra_info"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("book_slot", {
    p_slot_id: parsed.data.slot_id,
    p_category: parsed.data.category,
    p_description: parsed.data.description,
    p_location: parsed.data.location,
    p_extra_info: parsed.data.extra_info,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/klant");
  return { error: null };
}

export async function cancelTask(id: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id).eq("status", "open");
  revalidatePath("/klant");
}
