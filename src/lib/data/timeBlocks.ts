import { getSupabase } from "./client";
import { TimeBlock } from "@/types/database";
import { formatDateKey, extractBaseBlockId, getOverrideBlockId } from "@/lib/scheduleResolver";

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
    const cleanDate = block.override_date ? formatDateKey(block.override_date) : null;

    // Override rows MUST get their own deterministic id `${baseBlockId}__${YYYY-MM-DD}`
    // and NEVER reuse the base template block's id.
    let finalId = id;
    if (cleanDate) {
      const baseId = extractBaseBlockId(id, cleanDate);
      finalId = getOverrideBlockId(baseId || id, cleanDate);
    }

    // Sanitize record to only include valid columns on public.time_blocks
    const record: Record<string, unknown> = {
      id: finalId,
      weekday: block.weekday,
      start_time: block.start_time,
      end_time: block.end_time,
      type: block.type,
      label: block.label,
      default_category: block.default_category || null,
      is_fixed: Boolean(block.is_fixed),
      is_active: block.is_active !== undefined ? block.is_active : true,
      override_date: cleanDate,
      created_at: block.created_at || new Date().toISOString(),
    };
    if (userId || block.user_id) {
      record.user_id = userId || block.user_id;
    }

    const { data, error } = await supabase
      .from("time_blocks")
      .upsert(record, { onConflict: "id" })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as TimeBlock, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to create time block" };
  }
}

export const upsertTimeBlock = createTimeBlock;

export async function updateTimeBlock(
  id: string,
  updates: Partial<TimeBlock>,
  userId?: string
): Promise<{ data: TimeBlock | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    // Sanitize updates to valid columns
    const sanitized: Record<string, unknown> = {};
    if (updates.weekday !== undefined) sanitized.weekday = updates.weekday;
    if (updates.start_time !== undefined) sanitized.start_time = updates.start_time;
    if (updates.end_time !== undefined) sanitized.end_time = updates.end_time;
    if (updates.type !== undefined) sanitized.type = updates.type;
    if (updates.label !== undefined) sanitized.label = updates.label;
    if (updates.default_category !== undefined) sanitized.default_category = updates.default_category;
    if (updates.is_fixed !== undefined) sanitized.is_fixed = updates.is_fixed;
    if (updates.is_active !== undefined) sanitized.is_active = updates.is_active;
    if (updates.override_date !== undefined) {
      sanitized.override_date = updates.override_date ? formatDateKey(updates.override_date) : null;
    }

    let query = supabase.from("time_blocks").update(sanitized).eq("id", id);
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
