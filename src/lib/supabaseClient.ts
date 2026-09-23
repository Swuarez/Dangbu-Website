import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Public Supabase client — loaded on demand.
 *
 * Uses ONLY the anon public key — safe to ship to the browser because every
 * table is protected by Row Level Security (see supabase/migrations).
 * The service-role key must NEVER appear in this codebase.
 *
 * The SDK (~60 KB) is imported dynamically so it never lands in the entry
 * bundle (Lighthouse flagged it on the critical path): the first feature that
 * actually talks to the backend pulls it in as an async chunk.
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

let clientPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Resolve the shared client, loading @supabase/supabase-js on first use.
 * Returns null when env vars are missing (or the import fails) — always
 * guard with isSupabaseConfigured when the null case matters.
 */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js")
      .then(({ createClient }) =>
        createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
          realtime: {
            params: { eventsPerSecond: 5 },
          },
        }),
      )
      .catch(() => null);
  }
  return clientPromise;
}

/** Display-safe project host for the settings page (no keys). */
export const supabaseProjectHost: string | null = (() => {
  if (!isSupabaseConfigured) return null;
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return null;
  }
})();
