import { getSupabase } from "./client";
import { ClassScheduleItem } from "@/types/database";

export async function listClassSchedule(userId?: string): Promise<{ data: ClassScheduleItem[]; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("class_schedule").select("*").order("start_time", { ascending: true });
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as ClassScheduleItem[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch class schedule" };
  }
}

export async function replaceTuitionSchedule(
  newTuitionItems: ClassScheduleItem[],
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    let delQuery = supabase.from("class_schedule").delete().eq("type", "tuition");
    if (userId) {
      delQuery = delQuery.eq("user_id", userId);
    }
    const { error: delErr } = await delQuery;
    if (delErr) return { error: delErr.message };

    if (newTuitionItems.length > 0) {
      const records = newTuitionItems.map((item) => ({
        ...item,
        user_id: userId || item.user_id,
      }));
      const { error: insErr } = await supabase.from("class_schedule").insert(records);
      if (insErr) return { error: insErr.message };
    }
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to replace tuition schedule" };
  }
}
