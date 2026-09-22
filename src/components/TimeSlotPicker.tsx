import { AlertCircle, Clock, RefreshCw, Users } from "lucide-react";
import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { slotPeriods } from "@/data/reservationConfig";
import { reservationService, type TimeSlot } from "@/services/reservationService";
import { cn } from "@/lib/utils";

const NO_AVAILABILITY_MESSAGE =
  "No available tables for this time. Please choose another schedule.";

interface TimeSlotPickerProps {
  branchId: string;
  date: string;
  guests: number;
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}

/** Availability-aware time grid powered by the reservation service. */
export function TimeSlotPicker({
  branchId,
  date,
  guests,
  value,
  onChange,
  disabled,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = React.useState<TimeSlot[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  const partySize = Math.max(guests, 1);
  const hasQuery = Boolean(branchId && date);

  React.useEffect(() => {
    if (!branchId || !date) {
      setSlots(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    reservationService
      .getAvailableSlots({ branchId, date, guests: partySize })
      .then((next) => {
        if (!cancelled) setSlots(next);
      })
      .catch(() => {
        if (!cancelled) {
          setSlots(null);
          setError("We could not load availability. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [branchId, date, partySize, reloadToken]);

  const grouped = React.useMemo(() => {
    if (!slots) return [];
    return slotPeriods
      .map((period) => ({
        id: period.id,
        label: period.label,
        items: slots.filter((slot) => slot.periodId === period.id),
      }))
      .filter((period) => period.items.length > 0);
  }, [slots]);

  const availableCount = slots?.filter((slot) => slot.available).length ?? 0;
  const selectedSlot = slots?.find((slot) => slot.time === value);

  if (!hasQuery) {
    return (
      <div className="rounded-[var(--radius-brand)] border border-bone/10 bg-ink/45 p-4">
        <p className="flex items-center gap-2 text-[0.82rem] text-ash-text">
          <Clock className="size-4 shrink-0 text-brass/70" aria-hidden="true" />
          Select a branch and a date to see available seating times.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-brand)] border border-bone/10 bg-ink/45 p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-brass">
          <Clock className="size-3.5" aria-hidden="true" />
          Available seating
        </span>
        <span className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-ash-text">
          <Users className="size-3.5" aria-hidden="true" />
          {partySize} {partySize === 1 ? "guest" : "guests"}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5" aria-busy="true">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-10 rounded-lg" />
          ))}
          <span className="sr-only">Loading available seating times…</span>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3"
        >
          <p className="flex items-start gap-2 text-[0.84rem] text-bone">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            {error}
          </p>
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-bone/15 px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-bone-dim transition-colors hover:border-brass/50 hover:text-brass"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : availableCount === 0 ? (
        <div role="status" className="mt-4 rounded-xl border border-brass/30 bg-brass/8 p-3.5">
          <p className="flex items-start gap-2 text-[0.88rem] text-bone">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden="true" />
            {NO_AVAILABILITY_MESSAGE}
          </p>
          <p className="mt-1.5 pl-6 text-[0.78rem] text-ash-text">
            Try another date, a smaller party, or call us at 0945 673 2698 and we will find you a
            table.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {grouped.map((period) => (
            <div key={period.id}>
              <p className="mb-2 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ash-text">
                {period.label}
              </p>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {period.items.map((slot) => {
                  const isSelected = value === slot.time;

                  return (
                    <li key={slot.time}>
                      <button
                        type="button"
                        onClick={() => onChange(slot.time)}
                        disabled={disabled || !slot.available}
                        aria-pressed={isSelected}
                        aria-label={
                          slot.available
                            ? `${slot.label}, ${slot.spotsLeft} seats left`
                            : `${slot.label}, ${slot.reason === "past" ? "no longer available" : "fully booked"}`
                        }
                        className={cn(
                          "w-full rounded-lg border px-2 py-2.5 font-sans text-[0.78rem] font-semibold tabular-nums transition-colors",
                          slot.available
                            ? "border-bone/12 bg-ink-soft/60 text-bone-dim hover:border-brass/60 hover:bg-brass/12 hover:text-bone"
                            : "cursor-not-allowed border-transparent bg-bone/[0.03] text-ash-text/45 line-through",
                          isSelected &&
                            "border-brass bg-[linear-gradient(180deg,var(--color-brass-light),var(--color-brass-deep))] text-[#1b1306] hover:bg-[linear-gradient(180deg,var(--color-brass-light),var(--color-brass-deep))] hover:text-[#1b1306]",
                        )}
                      >
                        {slot.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <p aria-live="polite" className="text-[0.74rem] text-ash-text">
            {selectedSlot
              ? `${selectedSlot.spotsLeft} seats left for ${selectedSlot.label} — selected.`
              : `${availableCount} seating times available on this date.`}
          </p>
        </div>
      )}
    </div>
  );
}

export { NO_AVAILABILITY_MESSAGE };
