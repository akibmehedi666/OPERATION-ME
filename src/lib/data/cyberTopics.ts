import { getSupabaseClient } from "./client";
import type { CyberTopic } from "@/types/database";

export async function listCyberTopics(userId?: string): Promise<{ data: CyberTopic[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from("cyber_topics").select("*").order("order_index", { ascending: true });
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as CyberTopic[]) || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : "Failed to fetch cyber topics" };
  }
}

export async function createCyberTopic(
  topic: Partial<CyberTopic>,
  userId?: string
): Promise<{ data: CyberTopic | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const id = topic.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ct-${Date.now()}`);
    const record: Record<string, unknown> = {
      id,
      section: topic.section || "General",
      title: topic.title || "Untitled Topic",
      status: topic.status || "not_started",
      goal: topic.goal || null,
      learning_links: topic.learning_links || [],
      hands_on_task: topic.hands_on_task || null,
      hands_on_url: topic.hands_on_url || null,
      hands_on_platform: topic.hands_on_platform || null,
      hands_on_completed: topic.hands_on_completed || false,
      takeaway: topic.takeaway || null,
      resources: topic.resources || [],
      notes: topic.notes || null,
      time_spent_minutes: topic.time_spent_minutes || 0,
      order_index: topic.order_index ?? 0,
      completed_at: topic.completed_at || null,
    };
    if (userId) record.user_id = userId;

    const { data, error } = await supabase.from("cyber_topics").insert([record]).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as CyberTopic, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to create cyber topic" };
  }
}

export async function updateCyberTopic(
  id: string,
  updates: Partial<CyberTopic>
): Promise<{ data: CyberTopic | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = { ...updates };
    delete payload.id;
    delete payload.created_at;

    const { data, error } = await supabase
      .from("cyber_topics")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CyberTopic, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to update cyber topic" };
  }
}

