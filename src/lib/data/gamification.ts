import { getSupabaseClient } from "./client";

export async function fetchTotalXp(userId: string): Promise<{ data: number; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("xp_events")
      .select("amount")
      .eq("user_id", userId);

    if (error) return { data: 0, error: error.message };
    const total = (data || []).reduce((sum: number, row: { amount?: number | null }) => sum + (row.amount || 0), 0);
    return { data: total, error: null };
  } catch (err) {
    return { data: 0, error: err instanceof Error ? err.message : "Failed to fetch total xp" };
  }
}

export async function logXpEvent(
  userId: string,
  amount: number,
  reason: string,
  sourceId?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `xp-${Date.now()}`;
    const { error } = await supabase.from("xp_events").insert([
      {
        id,
        user_id: userId,
        amount,
        reason,
        source_id: sourceId || null,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to log xp event" };
  }
}

export async function fetchStreak(userId: string): Promise<{
  data: { current_streak: number; longest_streak: number; last_activity_date?: string | null };
  error: string | null;
}> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("streaks")
      .select("current_streak, longest_streak, last_activity_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return { data: { current_streak: 0, longest_streak: 0 }, error: error.message };
    if (!data) return { data: { current_streak: 0, longest_streak: 0 }, error: null };
    return {
      data: {
        current_streak: data.current_streak || 0,
        longest_streak: data.longest_streak || 0,
        last_activity_date: data.last_activity_date || null,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: { current_streak: 0, longest_streak: 0 },
      error: err instanceof Error ? err.message : "Failed to fetch streak",
    };
  }
}

export async function updateStreak(
  userId: string,
  currentStreak: number,
  longestStreak: number,
  lastActivityDate?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const record: Record<string, unknown> = {
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      updated_at: new Date().toISOString(),
    };
    if (lastActivityDate) {
      record.last_activity_date = lastActivityDate;
    }

    const { error } = await supabase
      .from("streaks")
      .upsert(record, { onConflict: "user_id" });

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update streak" };
  }
}

