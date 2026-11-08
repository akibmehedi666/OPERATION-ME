import { getSupabase } from "./client";
import { Course } from "@/types/database";

export async function listCourses(userId?: string): Promise<{ data: Course[]; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("courses").select("*").order("code", { ascending: true });
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as Course[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch courses" };
  }
}

export async function updateCourse(
  courseOrId: string | Course,
  updatesOrUserId?: Partial<Course> | string,
  maybeUserId?: string
): Promise<{ data: Course | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    let id: string;
    let payload: Partial<Course>;
    let userId: string | undefined;

    if (typeof courseOrId === "object") {
      id = courseOrId.id;
      payload = courseOrId;
      userId = typeof updatesOrUserId === "string" ? updatesOrUserId : undefined;
    } else {
      id = courseOrId;
      payload = (updatesOrUserId as Partial<Course>) || {};
      userId = maybeUserId;
    }

    const cleanPayload: Record<string, unknown> = { ...payload };
    delete cleanPayload.id;
    delete cleanPayload.created_at;

    let query = supabase.from("courses").update(cleanPayload).eq("id", id);
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    const { data, error } = await query.select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Course, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update course" };
  }
}
