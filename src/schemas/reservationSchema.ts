import { z } from "zod";
import { isBranchId } from "@/data/branches";
import { UNDECIDED_PACKAGE_ID, menuPackages } from "@/data/menu";
import {
  guestCountOptions,
  isSlotTime,
  parseGuestValue,
  reservationConfig,
} from "@/data/reservationConfig";
import {
  getDateAvailability,
  type ReservationDraft,
  type ReservationErrorCode,
} from "@/services/reservationService";

/* ============================================================
   Reservation validation — React Hook Form + Zod
   ============================================================ */

/** Accepts 09XXXXXXXXX and +639XXXXXXXXX (optionally spaced/hyphenated before sanitising). */
export const PH_MOBILE_PATTERN = /^(?:\+639|09)\d{9}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
export const NAME_PATTERN = /^[A-Za-z\u00C0-\u024F' .-]+$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Keeps only digits and a single leading "+" so the regex can validate cleanly. */
export function sanitizeMobileInput(value: string): string {
  return value
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "")
    .slice(0, 13);
}

/** Human-friendly reason for an unavailable date. */
export function dateErrorMessage(dateKey: string): string {
  const { reason } = getDateAvailability(dateKey);
  switch (reason) {
    case "past":
      return "That date has already passed. Please choose an upcoming date.";
    case "tooFar":
      return `Reservations open up to ${reservationConfig.advanceBookingDays} days ahead.`;
    case "closed":
    case "blackout":
      return "We are closed on that date. Please choose another day.";
    default:
      return "Please choose a valid reservation date.";
  }
}

export const reservationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(80, "Name is too long (80 characters max).")
    .regex(NAME_PATTERN, "Use letters, spaces, hyphens and apostrophes only."),

  mobile: z
    .string()
    .trim()
    .min(1, "Please enter your mobile number.")
    .refine(
      (value) => PH_MOBILE_PATTERN.test(value),
      "Enter a valid PH mobile number, e.g. 09456732698 or +639456732698.",
    ),

  email: z
    .string()
    .trim()
    .max(120, "Email is too long (120 characters max).")
    .refine(
      (value) => value === "" || EMAIL_PATTERN.test(value),
      "Enter a valid email address, e.g. you@email.com.",
    ),

  branchId: z.string().refine(isBranchId, "Please select a branch."),

  date: z
    .string()
    .min(1, "Please choose a reservation date.")
    .refine((value) => DATE_PATTERN.test(value), "Please choose a reservation date.")
    .refine((value) => getDateAvailability(value).available, (value) => ({
      message: dateErrorMessage(value),
    })),

  time: z
    .string()
    .min(1, "Please select a time for your table.")
    .refine(isSlotTime, "That time is outside our service hours. Please pick another time."),

  guests: z.string().refine(
    (value) => {
      const guests = parseGuestValue(value);
      return (
        guestCountOptions.some((option) => option.value === value) &&
        Number.isFinite(guests) &&
        guests >= reservationConfig.minGuestsPerReservation &&
        guests <= reservationConfig.maxGuestsPerReservation
      );
    },
    `Choose between ${reservationConfig.minGuestsPerReservation} and ${reservationConfig.maxGuestsPerReservation} guests.`,
  ),

  packageId: z
    .string()
    .refine(
      (value) => value === UNDECIDED_PACKAGE_ID || menuPackages.some((pkg) => pkg.id === value),
      "Please select a package.",
    ),

  specialRequest: z
    .string()
    .trim()
    .max(500, "Please keep special requests under 500 characters."),
});

export type ReservationFormValues = z.infer<typeof reservationSchema>;

export function createDefaultValues(
  overrides: Partial<ReservationFormValues> = {},
): ReservationFormValues {
  return {
    fullName: "",
    mobile: "",
    email: "",
    branchId: "",
    date: "",
    time: "",
    guests: "2",
    packageId: UNDECIDED_PACKAGE_ID,
    specialRequest: "",
    ...overrides,
  };
}

/** Maps validated form values onto the service-layer payload. */
export function toReservationDraft(values: ReservationFormValues): ReservationDraft {
  return {
    fullName: values.fullName.trim(),
    mobile: values.mobile.trim(),
    email: values.email.trim() || undefined,
    branchId: values.branchId,
    date: values.date,
    time: values.time,
    guests: parseGuestValue(values.guests),
    packageId: values.packageId,
    specialRequest: values.specialRequest.trim() || undefined,
  };
}

/** Friendly copy for service failures surfaced outside of field errors. */
export function reservationErrorCodeOf(error: unknown): ReservationErrorCode {
  if (error && typeof error === "object" && "code" in error) {
    return (error as { code: ReservationErrorCode }).code;
  }
  return "UNKNOWN";
}
