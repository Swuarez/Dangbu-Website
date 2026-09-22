/**
 * ============================================================
 * RESERVATION CONFIGURATION
 * ============================================================
 * Every reservation rule lives here — service hours, slot spacing,
 * party-size limits, blackout dates and simulated latency.
 * Change these values to re-configure the booking engine; no component
 * contains hard-coded scheduling logic.
 */

export interface SlotPeriod {
  id: string;
  label: string;
  from: string;
  to: string;
}

export interface ReservationConfig {
  /** First seating of the day (24h "HH:mm"). */
  readonly openingTime: string;
  /** Closing time used to derive the last seating (24h "HH:mm"). */
  readonly closingTime: string;
  /** Spacing between selectable reservation times, in minutes. */
  readonly slotIntervalMinutes: number;
  /** A reservation cannot be created for more guests than this (walk-in groups are handled by phone). */
  readonly maxGuestsPerReservation: number;
  /** Smallest party size accepted by the form. */
  readonly minGuestsPerReservation: number;
  /** No new seating is offered this many minutes before closing. */
  readonly lastSeatingBeforeCloseMinutes: number;
  /** How far ahead guests may book. */
  readonly advanceBookingDays: number;
  /** Reserved time must be at least this far in the future. */
  readonly minimumLeadTimeMinutes: number;
  /** Guests (sum of all reservations) that fit in one branch per time slot. */
  readonly maxGuestsPerSlot: number;
  /** Minutes a table is held for a late party. */
  readonly tableHoldMinutes: number;
  /** 0 = Sunday … 6 = Saturday. Empty array = open every day. */
  readonly closedWeekdays: readonly number[];
  /** Specific "yyyy-MM-dd" dates the restaurant is closed (holidays, maintenance). */
  readonly blackoutDates: readonly string[];
  /** Artificial latency (ms) so loading states behave like a real backend call. */
  readonly simulatedLatencyMs: number;
  /** localStorage key used by the default (mock) storage adapter. */
  readonly storageKey: string;
}

export const reservationConfig: ReservationConfig = {
  openingTime: "11:00",
  closingTime: "22:00",
  slotIntervalMinutes: 30,
  maxGuestsPerReservation: 20,
  minGuestsPerReservation: 1,
  lastSeatingBeforeCloseMinutes: 60,
  advanceBookingDays: 60,
  minimumLeadTimeMinutes: 60,
  maxGuestsPerSlot: 44,
  tableHoldMinutes: 15,
  closedWeekdays: [],
  blackoutDates: [],
  simulatedLatencyMs: 700,
  storageKey: "dangbu.reservations.v1",
};

/** Service periods used to group the time-slot grid in the UI. */
export const slotPeriods: readonly SlotPeriod[] = [
  { id: "lunch", label: "Lunch", from: "11:00", to: "15:00" },
  { id: "afternoon", label: "Afternoon", from: "15:00", to: "17:00" },
  { id: "dinner", label: "Dinner", from: "17:00", to: "21:30" },
];

/** "HH:mm" -> minutes after midnight. */
export function minutesFromTime(time: string): number {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/** minutes after midnight -> "HH:mm". */
export function timeFromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** All bookable times for a standard service day, e.g. 11:00 … 21:00. */
export function buildSlotTimes(): string[] {
  const start = minutesFromTime(reservationConfig.openingTime);
  const end =
    minutesFromTime(reservationConfig.closingTime) -
    reservationConfig.lastSeatingBeforeCloseMinutes;
  const times: string[] = [];

  for (let minute = start; minute <= end; minute += reservationConfig.slotIntervalMinutes) {
    times.push(timeFromMinutes(minute));
  }

  return times;
}

export const slotTimes: readonly string[] = buildSlotTimes();

export function isSlotTime(value: string | null | undefined): boolean {
  return Boolean(value) && slotTimes.includes(String(value));
}

export function getSlotPeriod(time: string): SlotPeriod {
  const minute = minutesFromTime(time);
  const match = slotPeriods.find(
    (period) => minute >= minutesFromTime(period.from) && minute < minutesFromTime(period.to),
  );
  return match ?? slotPeriods[slotPeriods.length - 1];
}

export interface GuestOption {
  value: string;
  label: string;
  guests: number;
}

/** Party-size selector options ("10+" maps to the minimum group size of 10). */
export const guestCountOptions: GuestOption[] = [
  ...Array.from({ length: 9 }, (_, index) => {
    const guests = index + 1;
    return {
      value: String(guests),
      label: guests === 1 ? "1 guest" : `${guests} guests`,
      guests,
    };
  }),
  { value: "10", label: "10+ guests", guests: 10 },
];

export function parseGuestValue(value: string): number {
  if (value === "10") return 10;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
