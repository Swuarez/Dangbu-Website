import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AlertCircle, CalendarCheck, Loader2, Mail, Phone, User } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { CalendarPicker } from "@/components/CalendarPicker";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReservationIntent } from "@/context/ReservationIntentContext";
import { branches, getBranch } from "@/data/branches";
import { packageOptions, getPackageLabel, getPackagePrice, UNDECIDED_PACKAGE_ID } from "@/data/menu";
import { guestCountOptions, parseGuestValue } from "@/data/reservationConfig";
import { site } from "@/data/site";
import {
  createDefaultValues,
  reservationErrorCodeOf,
  reservationSchema,
  sanitizeMobileInput,
  toReservationDraft,
  type ReservationFormValues,
} from "@/schemas/reservationSchema";
import {
  reservationService,
  formatSlotLabel,
  newId,
  parseDateKey,
  type Reservation,
} from "@/services/reservationService";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + inline validation message. */
function Field({ id, label, required, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-ember" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="font-normal normal-case tracking-normal text-ash-text">(optional)</span>
        )}
      </Label>

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-[0.76rem] leading-snug text-[#ff9d92]"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[0.74rem] leading-snug text-ash-text">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface ReservationFormProps {
  onSubmitted: (reservation: Reservation) => void;
}

export function ReservationForm({ onSubmitted }: ReservationFormProps) {
  const { intent, clearIntent } = useReservationIntent();

  // Idempotency key: stable for every retry of THIS form session, so a
  // double click or network retry can never create two bookings.
  const clientRequestId = React.useRef<string>(newId());

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: createDefaultValues(),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const values = watch();

  // Adopt branch/package pre-selected by a "Reserve Here" CTA.
  React.useEffect(() => {
    if (!intent) return;

    if (intent.branchId) setValue("branchId", intent.branchId);
    if (intent.packageId) setValue("packageId", intent.packageId);
    clearIntent();

    const focusTimer = window.setTimeout(() => {
      document.getElementById("reservation-fullName")?.focus({ preventScroll: true });
    }, 420);

    return () => window.clearTimeout(focusTimer);
  }, [intent, clearIntent, setValue]);

  const guests = parseGuestValue(values.guests);
  const safeGuests = Number.isFinite(guests) ? guests : 1;
  const selectedBranch = getBranch(values.branchId);
  const selectedDate = values.date ? parseDateKey(values.date) : null;
  const packagePrice = getPackagePrice(values.packageId);
  const estimatedTotal = packagePrice ? packagePrice * safeGuests : null;

  const summaryRows: { label: string; value: string; filled: boolean }[] = [
    {
      label: "Guest",
      value: values.fullName.trim() || "Not provided yet",
      filled: values.fullName.trim().length > 1,
    },
    {
      label: "Branch",
      value: selectedBranch ? selectedBranch.name : "Choose a branch",
      filled: Boolean(selectedBranch),
    },
    {
      label: "Date",
      value: selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : "Choose a date",
      filled: Boolean(selectedDate),
    },
    {
      label: "Time",
      value: values.time ? formatSlotLabel(values.time) : "Choose a time",
      filled: Boolean(values.time),
    },
    {
      label: "Guests",
      value: `${safeGuests}${safeGuests >= 10 ? "+" : ""} ${safeGuests === 1 ? "guest" : "guests"}`,
      filled: true,
    },
    {
      label: "Package",
      value: getPackageLabel(values.packageId),
      filled: values.packageId !== UNDECIDED_PACKAGE_ID,
    },
  ];

  const submit = async (formValues: ReservationFormValues) => {
    try {
      const reservation = await reservationService.createReservation({
        ...toReservationDraft(formValues),
        clientRequestId: clientRequestId.current,
      });

      onSubmitted(reservation);
      toast.success("Reservation request received", {
        description: `Reference ${reservation.reference} — we will confirm your table shortly.`,
      });

      reset(createDefaultValues({ branchId: formValues.branchId }));
      // New key for the next, unrelated booking.
      clientRequestId.current = newId();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not complete your reservation. Please try again.";

      const code = reservationErrorCodeOf(error);

      switch (code) {
        case "SLOT_FULL":
        case "SLOT_UNAVAILABLE":
        case "INVALID_SLOT":
          setError("time", { type: "manual", message });
          break;
        case "DATE_IN_PAST":
        case "DATE_BEYOND_WINDOW":
        case "BRANCH_CLOSED":
          setError("date", { type: "manual", message });
          break;
        default:
          break;
      }

      toast.error("Reservation not completed", { description: message });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.75fr)] lg:items-start xl:gap-10">
      <form
        noValidate
        onSubmit={handleSubmit(submit)}
        aria-label="Table reservation form"
        className="panel flex flex-col gap-8 p-5 sm:p-7 lg:p-8"
      >
        {/* ---- 01 · Your details ---- */}
        <fieldset className="flex flex-col gap-5">
          <legend className="mb-1 flex items-center gap-3 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-brass">
            <span className="grid size-6 place-items-center rounded-full border border-brass/40 text-[0.58rem]">
              01
            </span>
            Your details
          </legend>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="reservation-fullName"
              label="Full name"
              required
              error={errors.fullName?.message}
              hint="As it should appear on your reservation."
              className="sm:col-span-2"
            >
              <div className="relative">
                <User
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brass/60"
                />
                <Input
                  id="reservation-fullName"
                  autoComplete="name"
                  placeholder="Juan Dela Cruz"
                  className="pl-10"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={
                    errors.fullName ? "reservation-fullName-error" : "reservation-fullName-hint"
                  }
                  {...register("fullName")}
                />
              </div>
            </Field>

            <Field
              id="reservation-mobile"
              label="Mobile number"
              required
              error={errors.mobile?.message}
              hint="Format: 09XXXXXXXXX or +639XXXXXXXXX"
            >
              <div className="relative">
                <Phone
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brass/60"
                />
                <Input
                  id="reservation-mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0945 673 2698"
                  className="pl-10"
                  aria-invalid={Boolean(errors.mobile)}
                  aria-describedby={
                    errors.mobile ? "reservation-mobile-error" : "reservation-mobile-hint"
                  }
                  {...register("mobile", {
                    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                      event.target.value = sanitizeMobileInput(event.target.value);
                    },
                  })}
                />
              </div>
            </Field>

            <Field
              id="reservation-email"
              label="Email address"
              error={errors.email?.message}
              hint="We send the confirmation copy here."
            >
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brass/60"
                />
                <Input
                  id="reservation-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  className="pl-10"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "reservation-email-error" : "reservation-email-hint"
                  }
                  {...register("email")}
                />
              </div>
            </Field>
          </div>
        </fieldset>

        {/* ---- 02 · Your visit ---- */}
        <fieldset className="flex flex-col gap-5 border-t border-bone/10 pt-7">
          <legend className="mb-1 flex items-center gap-3 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-brass">
            <span className="grid size-6 place-items-center rounded-full border border-brass/40 text-[0.58rem]">
              02
            </span>
            Your visit
          </legend>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="reservation-branch"
              label="Select branch"
              required
              error={errors.branchId?.message}
              className="sm:col-span-2"
            >
              <Controller
                name="branchId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(next) => {
                      field.onChange(next);
                      setValue("time", "");
                    }}
                  >
                    <SelectTrigger
                      id="reservation-branch"
                      aria-invalid={Boolean(errors.branchId)}
                      aria-describedby={errors.branchId ? "reservation-branch-error" : undefined}
                    >
                      <SelectValue placeholder="Choose a Dangbu branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <span className="flex flex-col gap-0.5 py-0.5">
                            <span className="font-semibold text-bone">{branch.name}</span>
                            <span className="text-[0.72rem] leading-snug text-ash-text">
                              {branch.address}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              id="reservation-guests"
              label="Number of guests"
              required
              error={errors.guests?.message}
              hint="Groups of 10+ are confirmed by phone."
            >
              <Controller
                name="guests"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(next) => {
                      field.onChange(next);
                      setValue("time", "");
                    }}
                  >
                    <SelectTrigger
                      id="reservation-guests"
                      aria-invalid={Boolean(errors.guests)}
                      aria-describedby={
                        errors.guests ? "reservation-guests-error" : "reservation-guests-hint"
                      }
                    >
                      <SelectValue placeholder="How many are dining?" />
                    </SelectTrigger>
                    <SelectContent>
                      {guestCountOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              id="reservation-package"
              label="Package"
              required
              error={errors.packageId?.message}
              hint="Not sure yet? Decide when you arrive."
            >
              <Controller
                name="packageId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="reservation-package"
                      aria-invalid={Boolean(errors.packageId)}
                      aria-describedby={
                        errors.packageId ? "reservation-package-error" : "reservation-package-hint"
                      }
                    >
                      <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packageOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
        </fieldset>

        {/* ---- 03 · Schedule ---- */}
        <fieldset className="flex flex-col gap-5 border-t border-bone/10 pt-7">
          <legend className="mb-1 flex items-center gap-3 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-brass">
            <span className="grid size-6 place-items-center rounded-full border border-brass/40 text-[0.58rem]">
              03
            </span>
            Schedule
          </legend>

          <div className="grid gap-5 xl:grid-cols-2">
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <CalendarPicker value={field.value} onChange={field.onChange} />
                  {errors.date ? (
                    <p
                      id="reservation-date-error"
                      role="alert"
                      className="flex items-start gap-1.5 text-[0.76rem] leading-snug text-[#ff9d92]"
                    >
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      {errors.date.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <Controller
              name="time"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <TimeSlotPicker
                    branchId={values.branchId}
                    date={values.date}
                    guests={safeGuests}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {errors.time ? (
                    <p
                      id="reservation-time-error"
                      role="alert"
                      className="flex items-start gap-1.5 text-[0.76rem] leading-snug text-[#ff9d92]"
                    >
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      {errors.time.message}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>
        </fieldset>

        {/* ---- 04 · Special request ---- */}
        <fieldset className="flex flex-col gap-5 border-t border-bone/10 pt-7">
          <legend className="mb-1 flex items-center gap-3 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-brass">
            <span className="grid size-6 place-items-center rounded-full border border-brass/40 text-[0.58rem]">
              04
            </span>
            Special request
          </legend>

          <Field
            id="reservation-specialRequest"
            label="Anything we should prepare?"
            error={errors.specialRequest?.message}
            hint={`${values.specialRequest.length}/500 characters`}
          >
            <Textarea
              id="reservation-specialRequest"
              placeholder="Birthday celebration, preferred seating, special request, etc."
              aria-invalid={Boolean(errors.specialRequest)}
              aria-describedby={
                errors.specialRequest
                  ? "reservation-specialRequest-error"
                  : "reservation-specialRequest-hint"
              }
              {...register("specialRequest")}
            />
          </Field>
        </fieldset>

        <div className="flex flex-col gap-4 border-t border-bone/10 pt-6">
          <Button type="submit" variant="ember" size="xl" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Reserving your table…
              </>
            ) : (
              <>
                <CalendarCheck className="size-4" aria-hidden="true" />
                Confirm Reservation
              </>
            )}
          </Button>

          <p className="text-[0.74rem] leading-relaxed text-ash-text">
            You will receive a reservation reference right away. Our team confirms every booking by
            SMS or call — tables are held for 15 minutes past the reserved time.
          </p>
        </div>
      </form>

      <aside
        aria-label="Live reservation summary"
        className="flex flex-col gap-4 lg:sticky lg:top-24 xl:gap-5"
      >
        <div className="panel overflow-hidden p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow text-[0.56rem]">Your booking</p>
            <span className="rounded-full border border-brass/30 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-brass">
              Live
            </span>
          </div>

          <h3 className="display-md mt-2">Reservation summary</h3>

          <dl className="mt-4 grid gap-3">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4 border-b border-bone/8 pb-2.5 last:border-b-0">
                <dt className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ash-text">
                  {row.label}
                </dt>
                <dd
                  className={cn(
                    "max-w-[62%] text-right text-[0.86rem] leading-snug",
                    row.filled ? "text-bone" : "text-ash-text",
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex items-end justify-between gap-3 rounded-xl border border-brass/25 bg-brass/8 px-3.5 py-3">
            <span className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-brass">
              Estimated total
            </span>
            <span className="font-display text-2xl tabular-nums text-bone">
              {estimatedTotal ? `₱${estimatedTotal.toLocaleString("en-PH")}` : "—"}
            </span>
          </div>

          <p className="mt-3 text-[0.72rem] leading-relaxed text-ash-text">
            Estimates only — payable on site. No prepayment needed to hold your table.
          </p>
        </div>

        <div className="panel flex flex-col gap-2.5 p-5">
          <p className="eyebrow text-[0.56rem]">Need help booking?</p>
          <p className="copy-sm">
            Call us and we will arrange your table, big groups and celebration requests included.
          </p>
          <ul className="mt-1 flex flex-col gap-1.5">
            {site.phones.map((phone) => (
              <li key={phone.href}>
                <a
                  href={phone.href}
                  className="inline-flex items-center gap-2 font-display text-base tracking-[0.04em] text-bone transition-colors hover:text-brass"
                >
                  <Phone className="size-3.5 text-brass/80" aria-hidden="true" />
                  {phone.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-[0.72rem] text-ash-text">{site.hours}</p>
        </div>
      </aside>
    </div>
  );
}
