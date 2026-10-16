import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PHOTO_BUCKET } from "@/lib/photos";

/**
 * Levert de profielfoto van een student, maar enkel aan wie ze mag zien:
 * de student zelf, de admin, en een klant bij wie die student zich heeft
 * aangemeld of aan wie die student is toegewezen. Voor klanten bovendien enkel
 * een door de admin goedgekeurde foto.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new NextResponse("Niet gevonden", { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Niet ingelogd", { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = me?.role;

  const admin = createAdminClient();
  const { data: student } = await admin
    .from("profiles")
    .select("photo_path, photo_status")
    .eq("id", id)
    .eq("role", "student")
    .maybeSingle();
  if (!student?.photo_path) return new NextResponse("Niet gevonden", { status: 404 });

  let allowed = false;
  if (role === "admin" || user.id === id) {
    allowed = true;
  } else if (role === "client" && student.photo_status === "approved") {
    // RLS beperkt deze opzoekingen tot de eigen taken en aanmeldingen van de klant.
    const [{ data: apps }, { data: tasks }] = await Promise.all([
      supabase.from("task_applications").select("id").eq("student_id", id).limit(1),
      supabase.from("tasks").select("id").eq("student_id", id).limit(1),
    ]);
    allowed = (apps?.length ?? 0) > 0 || (tasks?.length ?? 0) > 0;
  }
  if (!allowed) return new NextResponse("Geen toegang", { status: 403 });

  const { data: file, error } = await admin.storage
    .from(PHOTO_BUCKET)
    .download(student.photo_path);
  if (error || !file) return new NextResponse("Niet gevonden", { status: 404 });

  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      "Content-Type": file.type || "image/jpeg",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
