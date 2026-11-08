import { getSupabase } from "./client";
import { TimeBlock } from "@/types/database";

export async function listTimeBlocks(userId?: string): Promise<{ data: TimeBlock[]; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("time_blocks").select("*").order("start_time", { ascending: true });
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as TimeBlock[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch time blocks" };
  }
}

export async function createTimeBlock(
  block: Omit<TimeBlock, "id"> & { id?: string },
  userId?: string
): Promise<{ data: TimeBlock | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    const id = block.id && block.id.trim() ? block.id : crypto.randomUUID();
    const record: Record<string, unknown> = {
      ...block,
      id,
      created_at: block.created_at || new Date().toISOString(),
    };
    if (userId) record.user_id = userId;

    const { data, error } = await supabase
      .from("time_blocks")
      .insert(record)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as TimeBlock, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to create time block" };
  }
}

export async function updateTimeBlock(
  id: string,
  updates: Partial<TimeBlock>,
  userId?: string
): Promise<{ data: TimeBlock | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("time_blocks").update(updates).eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query.select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as TimeBlock, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update time block" };
  }
}

export async function deleteTimeBlock(
  id: string,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("time_blocks").delete().eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { error } = await query;
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to delete time block" };
  }
}

export async function replaceTuitionBlocks(
  newTuitionBlocks: TimeBlock[],
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    let delQuery = supabase
      .from("time_blocks")
      .delete()
      .eq("type", "tuition")
      .is("override_date", null);
    if (userId) {
      delQuery = delQuery.eq("user_id", userId);
    }
    const { error: delErr } = await delQuery;
    if (delErr) return { error: delErr.message };

    if (newTuitionBlocks.length > 0) {
      const records = newTuitionBlocks.map((b) => ({
        ...b,
        user_id: userId || b.user_id,
      }));
      const { error: insErr } = await supabase.from("time_blocks").insert(records);
      if (insErr) return { error: insErr.message };
    }
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to replace tuition blocks" };
  }
}
