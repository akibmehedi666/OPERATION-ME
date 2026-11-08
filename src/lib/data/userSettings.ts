import { getSupabaseClient } from "./client";
import type { UserSetting } from "@/types/database";

export async function fetchUserSettings(
  userId: string
): Promise<{ data: UserSetting | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    return { data: (data as UserSetting) || null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to fetch user settings" };
  }
}

export async function updateUserSettings(
  userId: string,
  updates: Partial<UserSetting>
): Promise<{ data: UserSetting | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const record: Record<string, unknown> = {
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    delete record.id;

    const { data, error } = await supabase
      .from("user_settings")
      .upsert(record, { onConflict: "user_id" })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as UserSetting, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update user settings" };
  }
}

