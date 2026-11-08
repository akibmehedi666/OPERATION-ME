import { getSupabase } from "./client";
import { LectureLog } from "@/types/database";

export async function listLectureLogs(userId?: string): Promise<{ data: LectureLog[]; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("lecture_logs").select("*").order("date", { ascending: false });
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as LectureLog[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch lecture logs" };
  }
}

export async function createLectureLog(
  log: Omit<LectureLog, "id"> & { id?: string },
  userId?: string
): Promise<{ data: LectureLog | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    const id = log.id && log.id.trim() ? log.id : crypto.randomUUID();
    const record: Record<string, unknown> = {
      ...log,
      id,
      created_at: log.created_at || new Date().toISOString(),
    };
    if (userId) record.user_id = userId;

    const { data, error } = await supabase
      .from("lecture_logs")
      .insert(record)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: (data as LectureLog) || (record as unknown as LectureLog), error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to create lecture log" };
  }
}

export async function updateLectureLog(
  id: string,
  updates: Partial<LectureLog>,
  userId?: string
): Promise<{ data: LectureLog | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("lecture_logs").update(updates).eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query.select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as LectureLog, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update lecture log" };
  }
}

export async function deleteLectureLog(
  id: string,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("lecture_logs").delete().eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { error } = await query;
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to delete lecture log" };
  }
}
