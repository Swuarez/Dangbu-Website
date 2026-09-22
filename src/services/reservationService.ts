import { differenceInCalendarDays, format, isValid, parse, startOfToday } from "date-fns";
import { isBranchId } from "@/data/branches";
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

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

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
}

export interface Reservation extends ReservationDraft {
  id: string;
  reference: string;
  status: ReservationStatus;
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
  | "STORAGE_ERROR"
  | "UNKNOWN";
/* ============================================================
   Storage seam — swap this adapter for Firebase / Supabase /
   Express + PostgreSQL without touching the reservation UI.
   ============================================================ */

export interface ReservationStore {
  all(): Reservation[];
  insert(reservation: Reservation): void;
  findByReference(reference: string): Reservation | null;
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

  const insert = (reservation: Reservation): void => {
    const next = [...safeParse(available ? window.localStorage.getItem(key) : null), reservation];

    if (!available) {
      memory.push(reservation);
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      throw new ReservationError(
        "STORAGE_ERROR",
        "We could not save your reservation on this device. Please call us at 0945 673 2698.",
      );
    }
  };

  const all = (): Reservation[] =>
    available ? safeParse(window.localStorage.getItem(key)) : [...memory];

  return {
    all,
    insert,
    findByReference(reference) {
      const target = reference.trim().toUpperCase();
      return all().find((item) => item.reference.toUpperCase() === target) ?? null;
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

/** e.g. DANGBU-2026-K7QW4 */
export function generateReference(dateKey: string): string {
  const year = parseDateKey(dateKey)?.getFullYear() ?? new Date().getFullYear();
  return `DANGBU-${year}-${referenceAlphabetRandom(5)}`;
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

export function createReservationService(
  store: ReservationStore = createLocalStorageStore(),
): ReservationService {
  const seatsBooked = (branchId: string, dateKey: string, time: string): number =>
    store
      .all()
      .filter(
        (item) =>
          item.status !== "cancelled" &&
          item.branchId === branchId &&
          item.date === dateKey &&
          item.time === time,
      )
      .reduce((total, item) => total + item.guests, 0);

  const buildSlots = (query: SlotQuery): TimeSlot[] => {
    const partySize = Math.max(query.guests || reservationConfig.minGuestsPerReservation, 1);

    return buildSlotTimes().map((time) => {
      const period = getSlotPeriod(time);
      const past = isSlotInThePast(query.date, time);
      const spotsLeft = Math.max(
        reservationConfig.maxGuestsPerSlot - seatsBooked(query.branchId, query.date, time),
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
    await sleep(Math.round(reservationConfig.simulatedLatencyMs / 2));
    return buildSlots(query);
  };

  const createReservation = async (draft: ReservationDraft): Promise<Reservation> => {
    await sleep(reservationConfig.simulatedLatencyMs);

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

    const slot = buildSlots({
      branchId: draft.branchId,
      date: draft.date,
      guests: draft.guests,
    }).find((item) => item.time === draft.time);

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

    store.insert(reservation);
    return reservation;
  };

  return {
    getAvailableSlots,
    getDateAvailability,
    createReservation,
    async getReservation(reference: string) {
      await sleep(Math.round(reservationConfig.simulatedLatencyMs / 3));
      return store.findByReference(reference);
    },
    async listReservations() {
      await sleep(Math.round(reservationConfig.simulatedLatencyMs / 3));
      return store
        .all()
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
  };
}

/** App-wide singleton. Swap the store argument to plug in a real backend. */
export const reservationService: ReservationService = createReservationService();



/** Typed, user-presentable booking failure. */
export class ReservationError extends Error {
  readonly code: ReservationErrorCode;

  constructor(code: ReservationErrorCode, message: string) {
    super(message);
    this.name = "ReservationError";
    this.code = code;
  }
}
