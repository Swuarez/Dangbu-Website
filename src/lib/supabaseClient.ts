import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Public Supabase client.
 *
 * Uses ONLY the anon public key — safe to ship to the browser because every
 * table is protected by Row Level Security (see supabase/migrations).
 * The service-role key must NEVER appear in this codebase.
 *
 * When the env vars are absent the site still works: reservations fall back
 * to the localStorage adapter and staff features show a setup notice.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const isSupabaseConfigured: boolean =
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes("your-project-ref");

/** null when env vars are missing — always guard with isSupabaseConfigured. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 5 },
      },
    })
  : null;

/** Display-safe project host for the settings page (no keys). */
export const supabaseProjectHost: string | null = (() => {
  if (!isSupabaseConfigured) return null;
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return null;
  }
})();
