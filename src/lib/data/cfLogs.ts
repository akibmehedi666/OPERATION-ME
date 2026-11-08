import { getSupabaseClient } from "./client";
import type { CodeforcesLog } from "@/types/database";

export async function listCfLogs(userId: string): Promise<{ data: CodeforcesLog[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("cf_log")
      .select("*")
      .eq("user_id", userId)
      .order("solved_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data as CodeforcesLog[]) || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch cf logs" };
  }
}

export async function createCfLog(
  log: Partial<CodeforcesLog>,
  userId: string
): Promise<{ data: CodeforcesLog | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const id = log.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cf-${Date.now()}`);
    const record: Record<string, unknown> = {
      id,
      user_id: userId,
      problem_key: log.problem_key || null,
      handle: log.handle || null,
      problem_name: log.problem_name || "Unknown Problem",
      problem_url: log.problem_url || null,
      rating: log.rating ?? null,
      verdict: log.verdict || null,
      tags: log.tags || [],
      status: log.status || "solved",
      time_taken_minutes: log.time_taken_minutes ?? null,
      date: log.date || new Date().toISOString().split("T")[0],
      notes: log.notes || null,
      solved_at: log.solved_at || new Date().toISOString(),
      xp: log.xp ?? 0,
    };

    const { data, error } = await supabase
      .from("cf_log")
      .insert([record])
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CodeforcesLog, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to create cf log" };
  }
}

export async function upsertCfLogs(
  logs: Partial<CodeforcesLog>[],
  userId: string
): Promise<{ data: CodeforcesLog[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!logs || logs.length === 0) return { data: [], error: null };

    const records = logs.map((log) => ({
      id: log.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cf-${Date.now()}-${Math.random()}`),
      user_id: userId,
      problem_key: log.problem_key || null,
      handle: log.handle || null,
      problem_name: log.problem_name || "Unknown Problem",
      problem_url: log.problem_url || null,
      rating: log.rating ?? null,
      verdict: log.verdict || null,
      tags: log.tags || [],
      status: log.status || "solved",
      time_taken_minutes: log.time_taken_minutes ?? null,
      date: log.date || new Date().toISOString().split("T")[0],
      notes: log.notes || null,
      solved_at: log.solved_at || new Date().toISOString(),
      xp: log.xp ?? 0,
    }));

    // If problem_key is available, we can upsert with onConflict on (user_id, problem_key) or id
    const { data, error } = await supabase
      .from("cf_log")
      .upsert(records, { onConflict: "id" })
      .select();

    if (error) return { data: [], error: error.message };
    return { data: (data as CodeforcesLog[]) || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to upsert cf logs" };
  }
}

export async function updateCfLog(
  id: string,
  updates: Partial<CodeforcesLog>
): Promise<{ data: CodeforcesLog | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = { ...updates };
    delete payload.id;
    delete payload.created_at;

    const { data, error } = await supabase
      .from("cf_log")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CodeforcesLog, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update cf log" };
  }
}

export async function deleteCfLog(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("cf_log").delete().eq("id", id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete cf log" };
  }
}

export async function deleteCfLogs(ids: string[]): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!ids || ids.length === 0) return { error: null };
    const { error } = await supabase.from("cf_log").delete().in("id", ids);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete cf logs" };
  }
}

