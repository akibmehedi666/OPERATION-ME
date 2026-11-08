import { getSupabaseClient } from "./client";
import type { SideProject } from "@/types/database";

export async function listSideProjects(userId?: string): Promise<{ data: SideProject[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from("side_projects").select("*").order("created_at", { ascending: false });
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as SideProject[]) || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch side projects" };
  }
}

export async function createSideProject(
  project: Partial<SideProject>,
  userId?: string
): Promise<{ data: SideProject | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const id = project.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `proj-${Date.now()}`);
    const record: Record<string, unknown> = {
      id,
      name: project.name || "Untitled Project",
      description: project.description || null,
      status: project.status || "active",
      next_step: project.next_step || null,
      last_worked_at: project.last_worked_at || null,
      repo_url: project.repo_url || null,
      live_url: project.live_url || null,
    };
    if (userId) record.user_id = userId;

    const { data, error } = await supabase.from("side_projects").insert([record]).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as SideProject, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to create side project" };
  }
}

export async function updateSideProject(
  id: string,
  updates: Partial<SideProject>
): Promise<{ data: SideProject | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = { ...updates };
    delete payload.id;
    delete payload.created_at;

    const { data, error } = await supabase
      .from("side_projects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as SideProject, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update side project" };
  }
}

export async function deleteSideProject(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("side_projects").delete().eq("id", id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete side project" };
  }
}

