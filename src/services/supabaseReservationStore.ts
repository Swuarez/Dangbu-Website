import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  ReservationError,
  type Reservation,
  type ReservationStore,
  type SlotOccupancy,
} from "@/services/reservationService";
import {
  dbToReservation,
  reservationToDb,
  type DbReservation,
  type DbSlotUsage,
} from "@/types/database";

/**
 * Production reservation store backed by Supabase (PostgreSQL + RLS).
 *
 * Guest-facing reads are deliberately narrow and PII-free:
 *  - slot availability comes from the `slot_usage_for_branch_date` RPC
 *    (aggregate only: times + seats for one branch+date, no PII)
 *  - booking lookup goes through the `reservation_by_reference` RPC
 * Writes are plain INSERTs allowed by the anon policy (status='pending').
 * Staff reads/updates happen in staffService with an authenticated session.
 */
export function createSupabaseReservationStore(): ReservationStore {
  const client = async () => {
    const supabase = await getSupabase();
    if (!supabase) {
      throw new ReservationError(
        "STORAGE_ERROR",
        "Online booking is not configured yet. Please call us at 0945 673 2698.",
      );
    }
    return supabase;
  };

  return {
    async forBranchDate(branchId, date): Promise<SlotOccupancy[]> {
      const { data, error } = await (await client()).rpc("slot_usage_for_branch_date", {
        p_branch_id: branchId,
        p_date: date,
      });

      if (error) {
        throw new ReservationError(
          "UNKNOWN",
          "We could not check table availability. Please try again in a moment.",
        );
      }

      return ((data ?? []) as Pick<DbSlotUsage, "reservation_time" | "booked_guests">[]).map(
        (row) => ({
          time: String(row.reservation_time).slice(0, 5),
          guests: Number(row.booked_guests) || 0,
        }),
      );
    },

    async insert(reservation) {
      const { error } = await (await client()).from("reservations").insert(reservationToDb(reservation));

      if (error) {
        if (error.code === "23505") {
          // Idempotent retry: this exact submission (same client_request_id)
          // is already stored — treat as success so no duplicate is created.
          if (error.message.includes("client_request_id")) return;
          // Reference collision — astronomically unlikely, but recoverable:
          // surface a typed error so the guest can simply retry.
          throw new ReservationError(
            "UNKNOWN",
            "That booking reference was just taken. Please submit once more.",
          );
        }
        // Throttle trigger from migration 0003 (per-mobile abuse limits).
        if (error.message.includes("reservation_limit_reached")) {
          throw new ReservationError(
            "BOOKING_LIMIT",
            "You already have several active bookings for this date. Please call us at 0945 673 2698 to arrange more.",
          );
        }
        if (error.message.includes("reservation_rate_limited")) {
          throw new ReservationError(
            "RATE_LIMITED",
            "Too many booking requests from this number today. Please try again tomorrow or call us at 0945 673 2698.",
          );
        }
        throw new ReservationError(
          "STORAGE_ERROR",
          "We could not save your reservation online. Please call us at 0945 673 2698.",
        );
      }
    },

    async cancelByReference(reference) {
      const target = reference.trim().toUpperCase();
      if (!target) return false;

      const { data, error } = await (await client()).rpc("cancel_reservation_by_reference", {
        p_reference: target,
      });

      if (error) {
        throw new ReservationError(
          "UNKNOWN",
          "We could not cancel that booking right now. Please call us at 0945 673 2698.",
        );
      }

      return Boolean(data);
    },

    async findByReference(reference) {
      const target = reference.trim().toUpperCase();
      if (!target) return null;

      const { data, error } = await (await client()).rpc("reservation_by_reference", {
        p_reference: target,
      });

      if (error) {
        throw new ReservationError(
          "UNKNOWN",
          "We could not look up that booking right now. Please try again.",
        );
      }

      const row = (Array.isArray(data) ? data[0] : data) as DbReservation | undefined;
      return row ? dbToReservation(row) : null;
    },

    // The public UI never lists all reservations; staff use staffService with
    // filters + pagination instead. Keep this a safe empty implementation.
    async all(): Promise<Reservation[]> {
      return [];
    },
  };
}

export { isSupabaseConfigured };
