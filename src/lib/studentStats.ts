import { createAdminClient } from "@/lib/supabase/admin";

export interface StudentStats {
  jobsDone: number;
  avgRating: number | null;
  ratingCount: number;
}

/**
 * Voltooide klussen en gemiddelde beoordeling van een student. Via de
 * service-role client: klanten mogen de taken van een student niet lezen
 * (privacy), maar mogen wel deze samenvatting zien bij een aanmelding.
 */
export async function getStudentStats(studentId: string): Promise<StudentStats> {
  const { data } = await createAdminClient()
    .from("tasks")
    .select("rating")
    .eq("student_id", studentId)
    .eq("status", "done");

  const rows = data ?? [];
  const ratings = rows
    .map((r) => r.rating as number | null)
    .filter((r): r is number => r !== null);
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
    : null;

  return { jobsDone: rows.length, avgRating, ratingCount: ratings.length };
}
