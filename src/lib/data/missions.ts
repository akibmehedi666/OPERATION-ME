import { getSupabase } from "./client";
import { Mission } from "@/types/database";

export async function listMissions(userId?: string): Promise<{ data: Mission[]; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("missions").select("*").order("created_at", { ascending: false });
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as Mission[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch missions" };
  }
}

export async function createMission(
  mission: Partial<Mission>,
  userId?: string
): Promise<{ data: Mission | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    const id = mission.id && mission.id.trim() ? mission.id : crypto.randomUUID();
    const record: Record<string, unknown> = {
      ...mission,
      id,
      created_at: mission.created_at || new Date().toISOString(),
    };
    if (userId) record.user_id = userId;

    const { data, error } = await supabase
      .from("missions")
      .insert(record)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: (data as Mission) || (record as unknown as Mission), error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to create mission" };
  }
}

export async function updateMission(
  id: string,
  updates: Partial<Mission>,
  userId?: string
): Promise<{ data: Mission | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    const cleanUpdates: Record<string, unknown> = { ...updates };
    delete cleanUpdates.id;
    delete cleanUpdates.created_at;

    let query = supabase.from("missions").update(cleanUpdates).eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Mission, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update mission" };
  }
}

export async function deleteMission(
  id: string,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("missions").delete().eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { error } = await query;
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to delete mission" };
  }
}

export async function deleteMissions(
  ids: string[],
  userId?: string
): Promise<{ error: string | null }> {
  try {
    if (!ids || ids.length === 0) return { error: null };
    const supabase = getSupabase();
    let query = supabase.from("missions").delete().in("id", ids);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { error } = await query;
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to delete missions" };
  }
}
