import { getSupabase } from "./client";
import { TuitionException } from "@/types/database";

export async function listTuitionExceptions(
  userId?: string
): Promise<{ data: TuitionException[]; error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from("tuition_exceptions")
      .select("*")
      .order("date", { ascending: true });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) {
      // If table does not exist yet in Supabase (before SQL migration runs), fail gracefully
      if (
        error.code === "42P01" ||
        error.message?.includes("tuition_exceptions") ||
        error.message?.includes("does not exist")
      ) {
        console.warn("[listTuitionExceptions] Table tuition_exceptions not found:", error.message);
        return { data: [], error: null };
      }
      return { data: [], error: error.message };
    }
    return { data: (data as TuitionException[]) || [], error: null };
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch tuition exceptions",
    };
  }
}

export async function createTuitionException(
  exception: Omit<TuitionException, "id"> & { id?: string },
  userId?: string
): Promise<{ data: TuitionException | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    const id = exception.id && exception.id.trim() ? exception.id : crypto.randomUUID();
    const record: Record<string, unknown> = {
      ...exception,
      id,
      created_at: exception.created_at || new Date().toISOString(),
    };
    if (userId) record.user_id = userId;

    const { data, error } = await supabase
      .from("tuition_exceptions")
      .upsert(record, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return {
      data: (data as TuitionException) || (record as unknown as TuitionException),
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create tuition exception",
    };
  }
}

export async function createTuitionExceptionsBatch(
  exceptions: (Omit<TuitionException, "id"> & { id?: string })[],
  userId?: string
): Promise<{ data: TuitionException[]; error: string | null }> {
  try {
    const supabase = getSupabase();
    const records = exceptions.map((ex) => {
      const id = ex.id && ex.id.trim() ? ex.id : crypto.randomUUID();
      const rec: Record<string, unknown> = {
        ...ex,
        id,
        created_at: ex.created_at || new Date().toISOString(),
      };
      if (userId) rec.user_id = userId;
      return rec;
    });

    const { data, error } = await supabase
      .from("tuition_exceptions")
      .upsert(records, { onConflict: "id" })
      .select();

    if (error) {
      return { data: [], error: error.message };
    }
    return {
      data: (data as TuitionException[]) || (records as unknown as TuitionException[]),
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to create batch tuition exceptions",
    };
  }
}

export async function deleteTuitionException(
  id: string,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("tuition_exceptions").delete().eq("id", id);
    if (userId) query = query.eq("user_id", userId);
    const { error } = await query;
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete tuition exception",
    };
  }
}

export async function deleteTuitionExceptionByDate(
  date: string,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("tuition_exceptions").delete().eq("date", date);
    if (userId) query = query.eq("user_id", userId);
    const { error } = await query;
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete tuition exception for date",
    };
  }
}

