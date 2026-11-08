import { getSupabase } from "./client";
import { AcademicEvent } from "@/types/database";

export async function listAcademicEvents(userId?: string): Promise<{ data: AcademicEvent[]; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("academic_events").select("*").order("date", { ascending: true });
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as AcademicEvent[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch academic events" };
  }
}

export async function createAcademicEvent(
  event: Omit<AcademicEvent, "id"> & { id?: string },
  userId?: string
): Promise<{ data: AcademicEvent | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    const id = event.id && event.id.trim() ? event.id : crypto.randomUUID();
    const record: Record<string, unknown> = {
      ...event,
      id,
      created_at: event.created_at || new Date().toISOString(),
    };
    if (userId) record.user_id = userId;

    const { data, error } = await supabase
      .from("academic_events")
      .insert(record)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: (data as AcademicEvent) || (record as unknown as AcademicEvent), error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to create academic event" };
  }
}

export async function updateAcademicEvent(
  id: string,
  updates: Partial<AcademicEvent>,
  userId?: string
): Promise<{ data: AcademicEvent | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("academic_events").update(updates).eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query.select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as AcademicEvent, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update academic event" };
  }
}

export async function deleteAcademicEvent(
  id: string,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("academic_events").delete().eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { error } = await query;
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to delete academic event" };
  }
}
