import { createAdminClient } from "@/lib/supabase/admin";
import type { StudentReview } from "@/lib/types/domain";

export interface StudentStats {
  jobsDone: number;
  avgRating: number | null;
  ratingCount: number;
  /** De laatste beoordelingen met een opmerking, anoniem (zonder klantnaam). */
  recentReviews: StudentReview[];
}

/**
 * Voltooide klussen, gemiddelde beoordeling en recente opmerkingen van een
 * student. Via de service-role client: klanten mogen de taken van een student
 * niet lezen (privacy), maar mogen wel deze samenvatting zien bij een
 * aanmelding.
 */
export async function getStudentStats(studentId: string): Promise<StudentStats> {
  const { data } = await createAdminClient()
    .from("tasks")
    .select("rating, review_comment, completed_at")
    .eq("student_id", studentId)
    .eq("status", "done")
    .order("completed_at", { ascending: false });

  const rows = data ?? [];
  const ratings = rows
    .map((r) => r.rating as number | null)
    .filter((r): r is number => r !== null);
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
    : null;

  const recentReviews = rows
    .filter((r) => r.rating !== null && (r.review_comment ?? "").trim().length > 0)
    .slice(0, 3)
    .map((r) => ({
      rating: r.rating as number,
      comment: String(r.review_comment).trim().slice(0, 240),
    }));

  return { jobsDone: rows.length, avgRating, ratingCount: ratings.length, recentReviews };
}
