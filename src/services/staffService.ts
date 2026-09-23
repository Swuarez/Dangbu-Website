import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabaseClient";
import type { Reservation, ReservationStatus } from "@/services/reservationService";
import {
  dbToReservation,
  type DbReservation,
  type DbStaffProfile,
  type StaffRole,
} from "@/types/database";

/* ============================================================
   Staff-only data layer. Every function requires an
   authenticated staff session — enforced by RLS policies,
   not just hidden UI. Queries are paginated and select only
   the columns the dashboard renders.
   ============================================================ */

export const RESERVATIONS_PAGE_SIZE = 15;

export interface ReservationQuery {
  status?: ReservationStatus | "all";
  branchId?: string | "all";
  /** "yyyy-MM-dd" or undefined for any date. */
  date?: string;
  /** Free text matched against reference, name or mobile. */
  search?: string;
  page: number;
  pageSize?: number;
}

export interface ReservationPage {
  rows: Reservation[];
  total: number;
  page: number;
  pageSize: number;
}

async function assertClient() {
  const client = await getSupabase();
  if (!client) throw new Error("Supabase is not configured.");
  return client;
}

export async function fetchReservations(query: ReservationQuery): Promise<ReservationPage> {
  const pageSize = query.pageSize ?? RESERVATIONS_PAGE_SIZE;
  const from = query.page * pageSize;
  const to = from + pageSize - 1;

  let builder = (await assertClient())
    .from("reservations")
    .select(
      "id, reference, full_name, mobile, email, branch_id, package_id, reservation_date, reservation_time, guests, special_request, status, internal_notes, created_at, updated_at",
      { count: "exact" },
    )
    .order("reservation_date", { ascending: false })
    .order("reservation_time", { ascending: false })
    .range(from, to);

  if (query.status && query.status !== "all") builder = builder.eq("status", query.status);
  if (query.branchId && query.branchId !== "all") builder = builder.eq("branch_id", query.branchId);
  if (query.date) builder = builder.eq("reservation_date", query.date);

  const search = query.search?.trim();
  if (search) {
    const escaped = search.replace(/[%,()]/g, " ");
    builder = builder.or(
      `reference.ilike.%${escaped}%,full_name.ilike.%${escaped}%,mobile.ilike.%${escaped}%`,
    );
  }

  const { data, count, error } = await builder;
  if (error) throw new Error(friendly(error.message));

  return {
    rows: ((data ?? []) as DbReservation[]).map(dbToReservation),
    total: count ?? 0,
    page: query.page,
    pageSize,
  };
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<void> {
  const { error } = await (await assertClient()).from("reservations").update({ status }).eq("id", id);
  if (error) throw new Error(friendly(error.message));
}

export async function updateReservationNotes(id: string, internalNotes: string): Promise<void> {
  const { error } = await (await assertClient())
    .from("reservations")
    .update({ internal_notes: internalNotes.trim() || null })
    .eq("id", id);
  if (error) throw new Error(friendly(error.message));
}

export interface DashboardStats {
  todayTotal: number;
  todayPending: number;
  todayConfirmed: number;
  upcoming: number;
}

/** Cheap COUNT queries (head-only, no rows transferred). */
export async function fetchDashboardStats(todayKey: string): Promise<DashboardStats> {
  const client = await assertClient();
  const count = async (build: () => PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count: value, error } = await build();
    if (error) throw new Error("Could not load dashboard numbers.");
    return value ?? 0;
  };

  const base = () => client.from("reservations").select("id", { count: "exact", head: true });

  const [todayTotal, todayPending, todayConfirmed, upcoming] = await Promise.all([
    count(() => base().eq("reservation_date", todayKey).in("status", ["pending", "confirmed"])),
    count(() => base().eq("reservation_date", todayKey).eq("status", "pending")),
    count(() => base().eq("reservation_date", todayKey).eq("status", "confirmed")),
    count(() => base().gt("reservation_date", todayKey).in("status", ["pending", "confirmed"])),
  ]);

  return { todayTotal, todayPending, todayConfirmed, upcoming };
}

/* ------------------------- Staff ------------------------- */

export async function fetchStaff(): Promise<DbStaffProfile[]> {
  const { data, error } = await (await assertClient())
    .from("staff_profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(friendly(error.message));
  return (data ?? []) as DbStaffProfile[];
}

export async function updateStaffRole(id: string, role: StaffRole): Promise<void> {
  const { error } = await (await assertClient()).from("staff_profiles").update({ role }).eq("id", id);
  if (error) throw new Error(friendly(error.message));
}

export async function removeStaff(id: string): Promise<void> {
  const { error } = await (await assertClient()).from("staff_profiles").delete().eq("id", id);
  if (error) throw new Error(friendly(error.message));
}

/* ------------------------ Realtime ------------------------ */

/**
 * One realtime channel for reservation changes (dashboard).
 * Returns an unsubscribe function — always call it on unmount.
 */
export function subscribeToReservations(onChange: () => void): () => void {
  // Synchronous unsubscribe API while the SDK loads asynchronously.
  let active = true;
  let teardown: (() => void) | undefined;

  void getSupabase().then((client) => {
    if (!client || !active) return;

    const channel: RealtimeChannel = client
      .channel("staff-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, onChange)
      .subscribe();

    teardown = () => {
      void client.removeChannel(channel);
    };
  });

  return () => {
    active = false;
    teardown?.();
  };
}

function friendly(message: string): string {
  if (/row-level security/i.test(message)) {
    return "Your session is not authorized for that action. Please sign in again.";
  }
  if (/jwt|token|session/i.test(message)) {
    return "Your session expired. Please sign in again.";
  }
  return message || "Something went wrong. Please try again.";
}
