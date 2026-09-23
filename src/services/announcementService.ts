import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { DbAnnouncement, DbAnnouncementInsert } from "@/types/database";

/* ============================================================
   Announcements — public reads are filtered by RLS (active and
   within the date window); staff CRUD requires authentication.
   Realtime: ONE channel per mounted consumer, always removed
   on cleanup. No polling.
   ============================================================ */

const ANNOUNCEMENT_COLUMNS =
  "id, title, message, type, button_text, button_url, starts_at, ends_at, is_active, created_at, updated_at";

/** Active announcements for the public website (anon-safe, RLS-filtered). */
export async function fetchActiveAnnouncements(): Promise<DbAnnouncement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return [];
  return (data ?? []) as DbAnnouncement[];
}

/** Full list for the dashboard (requires staff session). */
export async function fetchAllAnnouncements(): Promise<DbAnnouncement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(friendly(error.message));
  return (data ?? []) as DbAnnouncement[];
}

export async function createAnnouncement(input: DbAnnouncementInsert): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("announcements").insert(input);
  if (error) throw new Error(friendly(error.message));
}

export async function updateAnnouncement(
  id: string,
  input: Partial<DbAnnouncementInsert>,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("announcements").update(input).eq("id", id);
  if (error) throw new Error(friendly(error.message));
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw new Error(friendly(error.message));
}

/**
 * Subscribe to announcement changes. Returns an unsubscribe function.
 * Caller MUST invoke it on unmount to free the realtime connection.
 */
export function subscribeToAnnouncements(onChange: () => void): () => void {
  const client = supabase;
  if (!client) return () => undefined;

  const channel: RealtimeChannel = client
    .channel("public-announcements")
    .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, onChange)
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

function friendly(message: string): string {
  if (/row-level security/i.test(message)) {
    return "Your account is not allowed to do that. Please sign in again.";
  }
  return message || "Something went wrong. Please try again.";
}
