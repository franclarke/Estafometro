"use client";

import { createClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/config/env";

export function createBrowserSupabaseClient() {
  const env = getPublicEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
