import { differenceInCalendarDays, format, isValid, parse, startOfToday } from "date-fns";
import { isBranchId } from "@/data/branches";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { createSupabaseReservationStore } from "@/services/supabaseReservationStore";
import {
  buildSlotTimes,
  getSlotPeriod,
  isSlotTime,
  reservationConfig,
  type SlotPeriod,
} from "@/data/reservationConfig";

/* ============================================================
   Domain types — the contract shared by the UI and any backend.
   ============================================================ */

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

/** Statuses that still hold seats at the branch. */
const ACTIVE_STATUSES: readonly ReservationStatus[] = ["pending", "confirmed"];

export interface ReservationDraft {
  fullName: string;
  mobile: string;
  email?: string;
  branchId: string;
  /** Local calendar date, "yyyy-MM-dd". */
  date: string;
  /** Reservation time, 24h "HH:mm". */
  time: string;
  guests: number;
  packageId: string;
  specialRequest?: string;
  /**
   * Idempotency key: generated once per form session and re-sent on
   * every retry, so a double submit can never create two bookings.
   */
  clientRequestId?: string;
}

export interface Reservation extends ReservationDraft {
  id: string;
  reference: string;
  status: ReservationStatus;
  /** Staff-only note, never shown to guests. */
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SlotUnavailableReason = "past" | "full";

export interface TimeSlot {
  time: string;
  label: string;
  period: string;
  periodId: SlotPeriod["id"];
  available: boolean;
  spotsLeft: number;
  reason?: SlotUnavailableReason;
}

export type DateUnavailableReason = "past" | "tooFar" | "closed" | "blackout";

export interface DateAvailability {
  date: string;
  available: boolean;
  reason?: DateUnavailableReason;
}

export interface SlotQuery {
  branchId: string;
  date: string;
  guests: number;
}

export type ReservationErrorCode =
  | "INVALID_INPUT"
  | "DATE_IN_PAST"
  | "DATE_BEYOND_WINDOW"
  | "BRANCH_CLOSED"
  | "INVALID_SLOT"
  | "SLOT_UNAVAILABLE"
  | "SLOT_FULL"
  | "BOOKING_LIMIT"
  | "RATE_LIMITED"
  | "STORAGE_ERROR"
  | "UNKNOWN";
/* ============================================================
   Storage seam — localStorage for offline/dev, Supabase for
   production. Swap adapters without touching reservation UI.
   ============================================================ */

/** Seat occupancy for one slot (already filtered to active bookings). */
export interface SlotOccupancy {
  time: string;
  guests: number;
}

export interface ReservationStore {
  /** Active reservations for one branch+date — used for slot availability. */
  forBranchDate(branchId: string, date: string): Promise<SlotOccupancy[]>;
  insert(reservation: Reservation): Promise<void>;
  /** Cancel a guest's own booking by reference. Returns false if not cancellable. */
  cancelByReference(reference: string): Promise<boolean>;
  findByReference(reference: string): Promise<Reservation | null>;
  all(): Promise<Reservation[]>;
}

function safeParse(value: string | null): Reservation[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as Reservation[]) : [];
  } catch {
    return [];
  }
}

/** Default development adapter: browser localStorage with in-memory fallback. */
export function createLocalStorageStore(
  key: string = reservationConfig.storageKey,
): ReservationStore {
  const memory: Reservation[] = [];

  const available = (() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return false;
      const probe = `${key}.probe`;
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  })();

  const all = async (): Promise<Reservation[]> =>
    available ? safeParse(window.localStorage.getItem(key)) : [...memory];

  const persist = (items: Reservation[]): void => {
    if (!available) {
      memory.length = 0;
      memory.push(...items);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(items));
  };

  const insert = async (reservation: Reservation): Promise<void> => {
    const current = await all();

    // Idempotency: retrying the same form submission must not duplicate the booking.
    if (
      reservation.clientRequestId &&
      current.some((item) => item.clientRequestId === reservation.clientRequestId)
    ) {
      return;
    }

    try {
      persist([...current, reservation]);
    } catch {
      throw new ReservationError(
        "STORAGE_ERROR",
        "We could not save your reservation on this device. Please call us at 0945 673 2698.",
      );
    }
  };

  return {
    all,
    insert,
    async forBranchDate(branchId, date) {
      const items = await all();
      return items
        .filter(
          (item) =>
            ACTIVE_STATUSES.includes(item.status) &&
            item.branchId === branchId &&
            item.date === date,
        )
        .map((item) => ({ time: item.time, guests: item.guests }));
    },
    async findByReference(reference) {
      const target = reference.trim().toUpperCase();
      const items = await all();
      return items.find((item) => item.reference.toUpperCase() === target) ?? null;
    },
    async cancelByReference(reference) {
      const target = reference.trim().toUpperCase();
      const todayKey = format(startOfToday(), "yyyy-MM-dd");
      const items = await all();
      const index = items.findIndex((item) => item.reference.toUpperCase() === target);
      if (index < 0) return false;

      const item = items[index];
      if (!ACTIVE_STATUSES.includes(item.status) || item.date < todayKey) return false;

      items[index] = { ...item, status: "cancelled", updatedAt: new Date().toISOString() };
      try {
        persist(items);
      } catch {
        throw new ReservationError(
          "STORAGE_ERROR",
          "We could not update your reservation on this device. Please call us at 0945 673 2698.",
        );
      }
      return true;
    },
  };
}

/* ============================================================
   Date helpers
   ============================================================ */

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(dateKey: string): Date | null {
  const parsed = parse(dateKey, "yyyy-MM-dd", new Date());
  return isValid(parsed) && toDateKey(parsed) === dateKey ? parsed : null;
}

export function formatSlotLabel(time: string): string {
  const parsed = parse(time, "HH:mm", new Date());
  return isValid(parsed) ? format(parsed, "h:mm a") : time;
}

export function getDateAvailability(dateKey: string): DateAvailability {
  const date = parseDateKey(dateKey);

  if (!date) return { date: dateKey, available: false, reason: "past" };

  if (reservationConfig.blackoutDates.includes(dateKey)) {
    return { date: dateKey, available: false, reason: "blackout" };
  }

  if (reservationConfig.closedWeekdays.includes(date.getDay())) {
    return { date: dateKey, available: false, reason: "closed" };
  }

  const daysFromToday = differenceInCalendarDays(date, startOfToday());
  if (daysFromToday < 0) return { date: dateKey, available: false, reason: "past" };
  if (daysFromToday > reservationConfig.advanceBookingDays) {
    return { date: dateKey, available: false, reason: "tooFar" };
  }

  return { date: dateKey, available: true };
}

function minimumBookableTime(): number {
  return Date.now() + reservationConfig.minimumLeadTimeMinutes * 60_000;
}

function isSlotInThePast(dateKey: string, time: string): boolean {
  const start = parse(`${dateKey} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  if (!isValid(start)) return true;
  return start.getTime() <= minimumBookableTime();
}

function referenceAlphabetRandom(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

/** e.g. DANGBU-2026-K7QW4X2P — 8-char suffix ≈ 31^8 ≈ 8.5e11 combos (unguessable). */
export function generateReference(dateKey: string): string {
  const year = parseDateKey(dateKey)?.getFullYear() ?? new Date().getFullYear();
  return `DANGBU-${year}-${referenceAlphabetRandom(8)}`;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `res_${Date.now().toString(36)}_${referenceAlphabetRandom(6).toLowerCase()}`;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* ============================================================
   SERVICE API
   ============================================================ */

export interface ReservationService {
  /** Bookable time slots for a branch/date, flagged with availability. */
  getAvailableSlots(query: SlotQuery): Promise<TimeSlot[]>;
  /** Synchronous helper used by the date picker to disable dates. */
  getDateAvailability(dateKey: string): DateAvailability;
  /** Persist a reservation after re-checking availability server-side style. */
  createReservation(draft: ReservationDraft): Promise<Reservation>;
  /** Guest self-service: cancel an upcoming booking by reference. */
  cancelReservation(reference: string): Promise<boolean>;
  /** Look up a reservation by its DANGBU reference number. */
  getReservation(reference: string): Promise<Reservation | null>;
  /** All stored reservations (newest first) — handy for a future admin view. */
  listReservations(): Promise<Reservation[]>;
}

function dateError(reason: DateUnavailableReason | undefined): ReservationError {
  switch (reason) {
    case "past":
      return new ReservationError(
        "DATE_IN_PAST",
        "That date has already passed. Please choose an upcoming date.",
      );
    case "tooFar":
      return new ReservationError(
        "DATE_BEYOND_WINDOW",
        `We accept bookings up to ${reservationConfig.advanceBookingDays} days ahead. Please choose an earlier date.`,
      );
    case "closed":
    case "blackout":
      return new ReservationError(
        "BRANCH_CLOSED",
        "We are closed on that date. Please choose another day.",
      );
    default:
      return new ReservationError("INVALID_INPUT", "Please choose a valid reservation date.");
  }
}

export interface ReservationServiceOptions {
  /** Adds a small artificial delay so offline dev still exercises UI states. */
  simulateLatency?: boolean;
}

export function createReservationService(
  store: ReservationStore = createLocalStorageStore(),
  options: ReservationServiceOptions = {},
): ReservationService {
  const simulateLatency = options.simulateLatency ?? true;
  const latency = (ms: number) => (simulateLatency ? sleep(ms) : Promise.resolve());

  const buildSlots = async (query: SlotQuery): Promise<TimeSlot[]> => {
    const partySize = Math.max(query.guests || reservationConfig.minGuestsPerReservation, 1);
    const occupancy = await store.forBranchDate(query.branchId, query.date);
    const bookedByTime = new Map<string, number>();
    for (const item of occupancy) {
      bookedByTime.set(item.time, (bookedByTime.get(item.time) ?? 0) + item.guests);
    }

    return buildSlotTimes().map((time) => {
      const period = getSlotPeriod(time);
      const past = isSlotInThePast(query.date, time);
      const spotsLeft = Math.max(
        reservationConfig.maxGuestsPerSlot - (bookedByTime.get(time) ?? 0),
        0,
      );
      const fits = spotsLeft >= partySize;

      return {
        time,
        label: formatSlotLabel(time),
        period: period.label,
        periodId: period.id,
        spotsLeft,
        available: !past && fits,
        reason: past ? ("past" as const) : fits ? undefined : ("full" as const),
      };
    });
  };

  const getAvailableSlots = async (query: SlotQuery): Promise<TimeSlot[]> => {
    await latency(Math.round(reservationConfig.simulatedLatencyMs / 2));
    return buildSlots(query);
  };

  const createReservation = async (draft: ReservationDraft): Promise<Reservation> => {
    await latency(reservationConfig.simulatedLatencyMs);

    if (!isBranchId(draft.branchId)) {
      throw new ReservationError("INVALID_INPUT", "Please select a branch for your reservation.");
    }

    if (
      !Number.isFinite(draft.guests) ||
      draft.guests < reservationConfig.minGuestsPerReservation ||
      draft.guests > reservationConfig.maxGuestsPerReservation
    ) {
      throw new ReservationError(
        "INVALID_INPUT",
        `We can reserve tables for ${reservationConfig.minGuestsPerReservation}–${reservationConfig.maxGuestsPerReservation} guests online. For bigger groups, please call 0945 673 2698.`,
      );
    }

    const availability = getDateAvailability(draft.date);
    if (!availability.available) {
      throw dateError(availability.reason);
    }

    if (!isSlotTime(draft.time)) {
      throw new ReservationError(
        "INVALID_SLOT",
        "That reservation time is outside our service hours. Please pick another time.",
      );
    }

    const slot = (
      await buildSlots({
        branchId: draft.branchId,
        date: draft.date,
        guests: draft.guests,
      })
    ).find((item) => item.time === draft.time);

    if (!slot || !slot.available) {
      if (slot?.reason === "past") {
        throw new ReservationError(
          "SLOT_UNAVAILABLE",
          "That time has already passed. Please choose a later time.",
        );
      }
      throw new ReservationError(
        "SLOT_FULL",
        "No available tables for this time. Please choose another schedule.",
      );
    }

    const now = new Date().toISOString();
    const reservation: Reservation = {
      ...draft,
      fullName: draft.fullName.trim(),
      mobile: draft.mobile.trim(),
      email: draft.email?.trim() || undefined,
      specialRequest: draft.specialRequest?.trim() || undefined,
      id: newId(),
      reference: generateReference(draft.date),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await store.insert(reservation);
    return reservation;
  };

  return {
    getAvailableSlots,
    getDateAvailability,
    createReservation,
    async cancelReservation(reference: string) {
      await latency(Math.round(reservationConfig.simulatedLatencyMs / 3));
      return store.cancelByReference(reference);
    },
    async getReservation(reference: string) {
      await latency(Math.round(reservationConfig.simulatedLatencyMs / 3));
      return store.findByReference(reference);
    },
    async listReservations() {
      await latency(Math.round(reservationConfig.simulatedLatencyMs / 3));
      const items = await store.all();
      return items.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
  };
}

/* ============================================================
    Singleton — Supabase when env vars are present, otherwise
    the offline localStorage adapter (UI code never changes).
    ============================================================ */

function createDefaultStore(): ReservationStore {
  if (isSupabaseConfigured) {
    return createSupabaseReservationStore();
  }
  return createLocalStorageStore();
}

/** App-wide singleton. Backed by Supabase in production, localStorage offline. */
export const reservationService: ReservationService = createReservationService(
  createDefaultStore(),
  { simulateLatency: !isSupabaseConfigured },
);



/** Typed, user-presentable booking failure. */
export class ReservationError extends Error {
  readonly code: ReservationErrorCode;

  constructor(code: ReservationErrorCode, message: string) {
    super(message);
    this.name = "ReservationError";
    this.code = code;
  }
}
