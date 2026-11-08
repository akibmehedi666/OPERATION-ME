import { getSupabase } from "./client";
import { Category } from "@/types/database";

export async function listCategories(userId?: string): Promise<{ data: Category[]; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("categories").select("*").order("id", { ascending: true });
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as Category[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch categories" };
  }
}
