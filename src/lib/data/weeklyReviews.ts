import { getSupabaseClient } from "./client";
import type { WeeklyReview } from "@/types/database";

export async function listWeeklyReviews(userId: string): Promise<{ data: WeeklyReview[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("weekly_reviews")
      .select("*")
      .eq("user_id", userId)
      .order("week_start_date", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data as WeeklyReview[]) || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch weekly reviews" };
  }
}

export async function saveWeeklyReview(
  review: Partial<WeeklyReview>,
  userId: string
): Promise<{ data: WeeklyReview | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const id = review.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `review-${Date.now()}`);
    const record: Record<string, unknown> = {
      id,
      user_id: userId,
      week_start_date: review.week_start_date || new Date().toISOString().split("T")[0],
      completed_count: review.completed_count ?? 0,
      overdue_count: review.overdue_count ?? 0,
      time_spent_minutes: review.time_spent_minutes ?? 0,
      cf_solved_count: review.cf_solved_count ?? 0,
      papers_read_count: review.papers_read_count ?? 0,
      lectures_missed_count: review.lectures_missed_count ?? 0,
      what_went_well: review.what_went_well || null,
      what_to_fix: review.what_to_fix || null,
      next_week_focus: review.next_week_focus || null,
    };

    const { data, error } = await supabase
      .from("weekly_reviews")
      .upsert([record], { onConflict: "id" })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as WeeklyReview, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to save weekly review" };
  }
}

