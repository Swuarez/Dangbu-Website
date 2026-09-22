import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { reservationConfig, slotTimes } from "@/data/reservationConfig";
import {
  formatSlotLabel,
  getDateAvailability,
  parseDateKey,
  toDateKey,
} from "@/services/reservationService";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LAST_SEATING_LABEL = formatSlotLabel(
  slotTimes[slotTimes.length - 1] ?? reservationConfig.closingTime,
);
const FIRST_SEATING_LABEL = formatSlotLabel(slotTimes[0] ?? reservationConfig.openingTime);

const iconButton =
  "inline-flex size-9 items-center justify-center rounded-lg border border-bone/12 bg-ink-soft/70 text-bone-dim transition-colors hover:border-brass/55 hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-bone/12 disabled:hover:text-bone-dim";

/** Inline month calendar that only enables dates the kitchen can accept. */
export function CalendarPicker({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (dateKey: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const today = React.useMemo(() => new Date(), []);
  const [cursor, setCursor] = React.useState<Date>(() => parseDateKey(value) ?? today);
  const gridRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const parsed = parseDateKey(value);
    if (parsed) setCursor(parsed);
  }, [value]);

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const lastBookableDate = addDays(today, reservationConfig.advanceBookingDays);
  const canGoPrev = isBefore(startOfMonth(today), startOfMonth(cursor));
  const canGoNext = isBefore(endOfMonth(cursor), lastBookableDate);

  const focusDay = (fromKey: string | undefined, offsetDays: number) => {
    if (!fromKey) return;
    const from = parseDateKey(fromKey);
    if (!from) return;
    const targetKey = toDateKey(addDays(from, offsetDays));
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${targetKey}"]`)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-day]");
    const dayKey = button?.dataset.day;
    const from = dayKey ? parseDateKey(dayKey) : null;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        focusDay(dayKey, -1);
        break;
      case "ArrowRight":
        event.preventDefault();
        focusDay(dayKey, 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusDay(dayKey, -7);
        break;
      case "ArrowDown":
        event.preventDefault();
        focusDay(dayKey, 7);
        break;
      case "Home":
        if (from) {
          event.preventDefault();
          focusDay(dayKey, -from.getDay());
        }
        break;
      case "End":
        if (from) {
          event.preventDefault();
          focusDay(dayKey, 6 - from.getDay());
        }
        break;
      case "PageUp":
        if (canGoPrev) {
          event.preventDefault();
          setCursor((current) => subMonths(current, 1));
        }
        break;
      case "PageDown":
        if (canGoNext) {
          event.preventDefault();
          setCursor((current) => addMonths(current, 1));
        }
        break;
      default:
        break;
    }
  };

  const shortcuts = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "In 7 days", date: addDays(today, 7) },
  ];

  return (
    <div
      className={cn(
        "rounded-[var(--radius-brand)] border border-bone/10 bg-ink/45 p-3.5 sm:p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-brass">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Pick a date
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={iconButton}
            aria-label="Previous month"
            disabled={!canGoPrev || disabled}
            onClick={() => setCursor((current) => subMonths(current, 1))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label="Next month"
            disabled={!canGoNext || disabled}
            onClick={() => setCursor((current) => addMonths(current, 1))}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p
        aria-live="polite"
        className="mt-3 font-display text-lg uppercase tracking-[0.06em] text-bone"
      >
        {format(cursor, "MMMM yyyy")}
      </p>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            aria-hidden="true"
            className="grid h-7 place-items-center font-sans text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-ash-text"
          >
            {label}
          </span>
        ))}
      </div>

      <div
        ref={gridRef}
        role="group"
        aria-label="Choose a reservation date"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-7 gap-1"
      >
        {days.map((day) => {
          const dayKey = toDateKey(day);
          const availability = getDateAvailability(dayKey);
          const selected = value === dayKey;
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={dayKey}
              type="button"
              data-day={dayKey}
              aria-label={format(day, "EEEE, MMMM d, yyyy")}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={selected}
              disabled={disabled || !availability.available}
              onClick={() => onChange(dayKey)}
              className={cn(
                "grid aspect-square place-items-center rounded-lg border border-transparent font-sans text-[0.82rem] font-medium tabular-nums transition-colors",
                !inMonth && "opacity-30",
                availability.available
                  ? "text-bone-dim hover:border-brass/55 hover:bg-brass/12 hover:text-bone"
                  : "cursor-not-allowed text-ash-text/45",
                selected &&
                  "border-brass bg-[linear-gradient(180deg,var(--color-brass-light),var(--color-brass-deep))] font-bold text-[#1b1306] hover:bg-[linear-gradient(180deg,var(--color-brass-light),var(--color-brass-deep))] hover:text-[#1b1306]",
                isToday && !selected && "ring-1 ring-brass/40",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {shortcuts.map((shortcut) => {
          const shortcutKey = toDateKey(shortcut.date);
          const available = getDateAvailability(shortcutKey).available;

          return (
            <button
              key={shortcut.label}
              type="button"
              disabled={disabled || !available}
              onClick={() => onChange(shortcutKey)}
              className={cn(
                "rounded-full border border-bone/12 px-3 py-1.5 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-bone-dim transition-colors hover:border-brass/50 hover:text-brass",
                "disabled:cursor-not-allowed disabled:opacity-35",
              )}
            >
              {shortcut.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[0.72rem] leading-relaxed text-ash-text">
        Seatings from {FIRST_SEATING_LABEL} to {LAST_SEATING_LABEL} · bookings open up to{" "}
        {reservationConfig.advanceBookingDays} days ahead.
      </p>
    </div>
  );
}
