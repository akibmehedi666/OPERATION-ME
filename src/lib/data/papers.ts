import { getSupabaseClient } from "./client";
import type { ResearchPaper } from "@/types/database";

export async function listPapers(userId?: string): Promise<{ data: ResearchPaper[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from("papers").select("*").order("created_at", { ascending: false });
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as ResearchPaper[]) || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch papers" };
  }
}

export async function createPaper(
  paper: Partial<ResearchPaper>,
  userId?: string
): Promise<{ data: ResearchPaper | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const id = paper.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `paper-${Date.now()}`);
    const record: Record<string, unknown> = {
      id,
      title: paper.title || "Untitled Paper",
      authors: paper.authors || null,
      venue: paper.venue || null,
      status: paper.status || "to-read",
      notes: paper.notes || null,
      url: paper.url || null,
      tags: paper.tags || [],
      summary: paper.summary || null,
      takeaway: paper.takeaway || null,
      date_read: paper.date_read || null,
    };
    if (userId) record.user_id = userId;

    const { data, error } = await supabase.from("papers").insert([record]).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as ResearchPaper, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to create paper" };
  }
}

export async function updatePaper(
  id: string,
  updates: Partial<ResearchPaper>
): Promise<{ data: ResearchPaper | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = { ...updates };
    delete payload.id;
    delete payload.created_at;

    const { data, error } = await supabase
      .from("papers")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as ResearchPaper, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update paper" };
  }
}

export async function deletePaper(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("papers").delete().eq("id", id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete paper" };
  }
}

