import type { Reservation, ReservationStatus } from "@/services/reservationService";

/* ============================================================
   Supabase row shapes (snake_case) + mappers to the camelCase
   domain models used across the UI.
   ============================================================ */

export type StaffRole = "owner" | "staff";

export interface DbStaffProfile {
  id: string;
  full_name: string | null;
  role: StaffRole;
  created_at: string;
}

export interface DbReservation {
  id: string;
  reference: string;
  full_name: string;
  mobile: string;
  email: string | null;
  branch_id: string;
  package_id: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  special_request: string | null;
  status: ReservationStatus;
  internal_notes: string | null;
  client_request_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Columns a guest may write when booking online (anon INSERT policy). */
export interface DbReservationInsert {
  id: string;
  reference: string;
  full_name: string;
  mobile: string;
  email: string | null;
  branch_id: string;
  package_id: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  special_request: string | null;
  client_request_id: string | null;
  status: "pending";
}

/** Aggregate per-slot seat usage — exposed to anon via the slot_usage view. */
export interface DbSlotUsage {
  branch_id: string;
  reservation_date: string;
  reservation_time: string;
  booked_guests: number;
}

export type AnnouncementType = "info" | "promo" | "warning" | "closure";

export interface DbAnnouncement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  button_text: string | null;
  button_url: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAnnouncementInsert {
  title: string;
  message: string;
  type: AnnouncementType;
  button_text?: string | null;
  button_url?: string | null;
  starts_at: string;
  ends_at?: string | null;
  is_active: boolean;
}

export function dbToReservation(row: DbReservation): Reservation {
  return {
    id: row.id,
    reference: row.reference,
    fullName: row.full_name,
    mobile: row.mobile,
    email: row.email ?? undefined,
    branchId: row.branch_id,
    packageId: row.package_id,
    date: row.reservation_date,
    time: row.reservation_time.slice(0, 5),
    guests: row.guests,
    specialRequest: row.special_request ?? undefined,
    status: row.status,
    internalNotes: row.internal_notes ?? undefined,
    clientRequestId: row.client_request_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function reservationToDb(reservation: Reservation): DbReservationInsert {
  return {
    id: reservation.id,
    reference: reservation.reference,
    full_name: reservation.fullName,
    mobile: reservation.mobile,
    email: reservation.email ?? null,
    branch_id: reservation.branchId,
    package_id: reservation.packageId,
    reservation_date: reservation.date,
    reservation_time: reservation.time,
    guests: reservation.guests,
    special_request: reservation.specialRequest ?? null,
    client_request_id: reservation.clientRequestId ?? null,
    status: "pending",
  };
}
