import { createClient } from "@/lib/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";

export function getSupabase(): SupabaseClient {
  const client = createClient();
  if (!client) {
    throw new Error("Supabase client is not configured. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return client;
}

export const getSupabaseClient = getSupabase;
