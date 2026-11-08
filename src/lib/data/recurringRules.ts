import { getSupabase } from "./client";
import { RecurringRule } from "@/types/database";

export async function listRecurringRules(userId?: string): Promise<{ data: RecurringRule[]; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("recurring_rules").select("*").order("created_at", { ascending: true });
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as RecurringRule[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch recurring rules" };
  }
}

export async function createRecurringRule(
  rule: Omit<RecurringRule, "id"> & { id?: string },
  userId?: string
): Promise<{ data: RecurringRule | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    const id = rule.id && rule.id.trim() ? rule.id : crypto.randomUUID();
    const record: Record<string, unknown> = {
      ...rule,
      id,
      created_at: rule.created_at || new Date().toISOString(),
    };
    if (userId) record.user_id = userId;

    const { data, error } = await supabase
      .from("recurring_rules")
      .insert(record)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: (data as RecurringRule) || (record as unknown as RecurringRule), error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to create recurring rule" };
  }
}

export async function updateRecurringRule(
  id: string,
  updates: Partial<RecurringRule>,
  userId?: string
): Promise<{ data: RecurringRule | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("recurring_rules").update(updates).eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query.select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as RecurringRule, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update recurring rule" };
  }
}

export async function deleteRecurringRule(
  id: string,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("recurring_rules").delete().eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { error } = await query;
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to delete recurring rule" };
  }
}
