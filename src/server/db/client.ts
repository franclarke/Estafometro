import { createClient } from "@supabase/supabase-js";

import { getPublicEnv, getServerEnv } from "@/lib/config/env";
import type { Database } from "@/server/db/supabase.types";

/**
 * Server-side Supabase client using the service_role key.
 * Bypasses RLS — gate access in the backend, never expose to client.
 */
export function createServerSupabaseClient() {
  const env = getServerEnv();

  return createClient<Database>(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Browser-safe Supabase client using the anon (publishable) key.
 * Respects RLS policies.
 */
export function createBrowserSupabaseClient() {
  const env = getPublicEnv();

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
