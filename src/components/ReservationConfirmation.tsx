import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, CalendarDays, Clock, Copy, Download, MapPin, Ticket, Users } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getBranchName } from "@/data/branches";
import { getPackageLabel, getPackagePrice } from "@/data/menu";
import { formatSlotLabel, parseDateKey, type Reservation } from "@/services/reservationService";
import { cn } from "@/lib/utils";

/** Deterministic faux-barcode derived from the reservation reference. */
function Barcode({ reference }: { reference: string }) {
  const bars = React.useMemo(() => {
    const source = `${reference}DANGBU`;
    return Array.from(source).map((character, index) => ({
      id: `${character}-${index}`,
      width: 1 + (character.charCodeAt(0) % 4),
      tall: index % 3 !== 0,
    }));
  }, [reference]);

  return (
    <div aria-hidden="true" className="flex h-9 items-end gap-[3px] overflow-hidden">
      {bars.map((bar) => (
        <span
          key={bar.id}
          className={cn("rounded-[1px] bg-bone/70", bar.tall ? "h-9" : "h-6")}
          style={{ width: `${bar.width}px` }}
        />
      ))}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-brass/30 bg-brass/8 text-brass">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-sans text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-ash-text">
          {label}
        </span>
        <span className="text-[0.92rem] leading-snug text-bone">{value}</span>
      </span>
    </div>
  );
}

/** Printable ticket stub shared by the confirmation dialog and the status page. */
export function ReservationTicket({
  reservation,
  className,
}: {
  reservation: Reservation;
  className?: string;
}) {
  const date = parseDateKey(reservation.date);
  const price = getPackagePrice(reservation.packageId);
  const total = price ? price * reservation.guests : null;

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reservation.reference);
      toast.success("Reference copied", { description: reservation.reference });
    } catch {
      toast.error("Copy failed", { description: `Your reference is ${reservation.reference}` });
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <BadgeCheck className="size-4 text-brass" aria-hidden="true" />
        <span className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-brass">
          Status · {reservation.status}
        </span>
      </div>

      <h3 className="display-lg mt-2 text-bone">Reservation request received</h3>

      <p className="copy-sm mt-2">
        Thank you, {reservation.fullName.split(" ")[0]}! Our team is checking the grill schedule
        and will confirm your table by SMS at {reservation.mobile}.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-brand)] border border-brass/30 bg-brass/8 px-4 py-3">
        <Ticket className="size-4 shrink-0 text-brass" aria-hidden="true" />
        <span className="flex flex-col">
          <span className="font-sans text-[0.56rem] font-semibold uppercase tracking-[0.24em] text-ash-text">
            Reservation ID
          </span>
          <span className="font-display text-xl tracking-[0.08em] text-bone tabular-nums">
            {reservation.reference}
          </span>
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={copyReference}
          aria-label={`Copy reservation reference ${reservation.reference}`}
        >
          <Copy className="size-3.5" aria-hidden="true" />
          Copy
        </Button>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <DetailRow icon={MapPin} label="Branch" value={getBranchName(reservation.branchId)} />
        <DetailRow
          icon={Users}
          label="Guests"
          value={`${reservation.guests}${reservation.guests >= 10 ? "+" : ""} ${
            reservation.guests === 1 ? "guest" : "guests"
          }`}
        />
        <DetailRow
          icon={CalendarDays}
          label="Date"
          value={date ? format(date, "EEEE, MMMM d, yyyy") : reservation.date}
        />
        <DetailRow icon={Clock} label="Time" value={formatSlotLabel(reservation.time)} />
      </dl>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-bone/10 bg-ink/40 p-3.5 sm:col-span-2">
          <dt className="font-sans text-[0.56rem] font-semibold uppercase tracking-[0.24em] text-ash-text">
            Package
          </dt>
          <dd className="mt-0.5 text-[0.92rem] text-bone">
            {getPackageLabel(reservation.packageId)}
          </dd>
          {total ? (
            <dd className="mt-1 font-display text-lg tabular-nums text-brass">
              ≈ ₱{total.toLocaleString("en-PH")} for {reservation.guests}{" "}
              {reservation.guests === 1 ? "guest" : "guests"}
            </dd>
          ) : null}
        </div>

        {reservation.specialRequest ? (
          <div className="rounded-xl border border-bone/10 bg-ink/40 p-3.5 sm:col-span-2">
            <dt className="font-sans text-[0.56rem] font-semibold uppercase tracking-[0.24em] text-ash-text">
              Special request
            </dt>
            <dd className="mt-0.5 text-[0.88rem] leading-relaxed text-bone-dim">
              {reservation.specialRequest}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-5 border-t border-dashed border-bone/20 pt-4">
        <Barcode reference={reservation.reference} />
        <p className="mt-2 font-sans text-[0.62rem] uppercase tracking-[0.28em] text-ash-text">
          {reservation.reference}
        </p>
      </div>

      <p className="mt-4 text-[0.74rem] leading-relaxed text-ash-text">
        Tables are held for 15 minutes past the reserved time. Please call{" "}
        <a href="tel:+639456732698" className="text-brass underline-offset-4 hover:underline">
          0945 673 2698
        </a>{" "}
        if your plans change.
      </p>
    </div>
  );
}

/** Modal shown right after a successful reservation request. */
export function ReservationConfirmation({
  reservation,
  onClose,
  onNewReservation,
}: {
  reservation: Reservation | null;
  onClose: () => void;
  onNewReservation: () => void;
}) {
  return (
    <Dialog open={Boolean(reservation)} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="max-w-[min(42rem,94vw)] p-0">
        {reservation ? (
          <div className="flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-y-auto overscroll-contain p-5 sm:p-7">
            <DialogTitle className="sr-only">Reservation request received</DialogTitle>
            <DialogDescription className="sr-only">
              Your reservation reference is {reservation.reference}.
            </DialogDescription>

            <ReservationTicket reservation={reservation} />

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Button variant="ember" size="lg" className="flex-1" onClick={onClose}>
                Done
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => {
                  onNewReservation();
                  onClose();
                }}
              >
                Make Another Reservation
              </Button>
            </div>

            <Link
              to={`/reservation/${reservation.reference}`}
              className="mt-3 inline-flex items-center justify-center gap-2 text-center font-sans text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-brass transition-colors hover:text-brass-light"
            >
              <Download className="size-3.5" aria-hidden="true" />
              View reservation status page
            </Link>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

