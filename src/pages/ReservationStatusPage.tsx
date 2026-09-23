import { format } from "date-fns";
import { ArrowLeft, Ban, Hourglass, Loader2, Search, TriangleAlert } from "lucide-react";
import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ReservationTicket } from "@/components/ReservationConfirmation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { site } from "@/data/site";
import { reservationService, type Reservation } from "@/services/reservationService";

type LookupState =
  | { status: "loading" }
  | { status: "found"; reservation: Reservation }
  | { status: "missing" }
  | { status: "error" };

/** Shareable status page: /reservation/DANGBU-2026-XXXXX */
export default function ReservationStatusPage() {
  const { reference = "" } = useParams();
  const navigate = useNavigate();
  const [state, setState] = React.useState<LookupState>({ status: "loading" });
  const [query, setQuery] = React.useState(reference);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    reservationService
      .getReservation(reference)
      .then((reservation) => {
        if (cancelled) return;
        setState(reservation ? { status: "found", reservation } : { status: "missing" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  /** Guest self-service cancellation (cancel_reservation_by_reference RPC). */
  const cancelBooking = async () => {
    setCancelling(true);
    try {
      const cancelled = await reservationService.cancelReservation(reference);
      if (!cancelled) {
        toast.error("Could not cancel online", {
          description: "This booking can no longer be cancelled online. Please call us.",
        });
        return;
      }
      toast.success("Booking cancelled", {
        description: `Reservation ${reference.toUpperCase()} has been cancelled.`,
      });
      const fresh = await reservationService.getReservation(reference);
      if (fresh) setState({ status: "found", reservation: fresh });
    } catch (cause) {
      toast.error("Could not cancel booking", {
        description: cause instanceof Error ? cause.message : "Please try again in a moment.",
      });
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  return (
    <div className="shell flex flex-col gap-8 pb-16 pt-24 sm:pt-28 lg:pt-32">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-2 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-brass transition-colors hover:text-brass-light"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to Dangbu
      </Link>

      <header className="flex flex-col gap-3">
        <p className="eyebrow">Reservation status</p>
        <h1 className="display-lg text-bone">
          Your <span className="foil-text">booking</span> reference
        </h1>
        <p className="copy max-w-[60ch]">
          Look up any Dangbu reservation request with the reference number we issued, for example{" "}
          <span className="font-semibold text-brass">DANGBU-2026-K7QW4X2P</span>.
        </p>
      </header>

      <form
        className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const next = query.trim().toUpperCase();
          if (next) navigate(`/reservation/${encodeURIComponent(next)}`);
        }}
      >
        <div className="flex flex-1 flex-col gap-2">
          <label
            htmlFor="reference-lookup"
            className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-bone-dim"
          >
            Reservation reference
          </label>
          <Input
            id="reference-lookup"
            value={query}
            onChange={(event) => setQuery(event.target.value.toUpperCase())}
            placeholder="DANGBU-2026-XXXXX"
            className="uppercase tracking-[0.08em]"
          />
        </div>
        <Button type="submit" variant="brass" size="lg" className="w-full sm:w-auto">
          <Search className="size-4" aria-hidden="true" />
          Look up
        </Button>
      </form>

      {state.status === "loading" ? (
        <div className="panel flex flex-col gap-4 p-6" aria-busy="true">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <span className="sr-only">Loading reservation…</span>
        </div>
      ) : null}

      {state.status === "found" ? (
        <section className="panel p-5 sm:p-7" aria-label="Reservation details">
          <ReservationTicket reservation={state.reservation} />

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Button variant="ember" size="lg" asChild className="flex-1">
              <a href={site.phones[0].href}>Call to amend booking</a>
            </Button>
            <Button variant="outline" size="lg" asChild className="flex-1">
              <Link to="/#reservation">Book another table</Link>
            </Button>
          </div>

          {["pending", "confirmed"].includes(state.reservation.status) &&
          state.reservation.date >= format(new Date(), "yyyy-MM-dd") ? (
            <div className="mt-5 flex flex-col gap-3 border-t border-bone/10 pt-4">
              {confirmCancel ? (
                <>
                  <p className="copy-sm">
                    Cancel this booking? This cannot be undone — you would need to book again.
                  </p>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 border-ember/40 text-ember-light hover:bg-ember/10"
                      disabled={cancelling}
                      onClick={() => void cancelBooking()}
                    >
                      {cancelling ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Ban className="size-4" aria-hidden="true" />
                      )}
                      {cancelling ? "Cancelling…" : "Yes, cancel this booking"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      disabled={cancelling}
                      onClick={() => setConfirmCancel(false)}
                    >
                      Keep my booking
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit text-ash-text hover:text-ember-light"
                  onClick={() => setConfirmCancel(true)}
                >
                  <Ban className="size-3.5" aria-hidden="true" />
                  Need to cancel this booking?
                </Button>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {state.status === "missing" ? (
        <section
          role="status"
          className="panel flex flex-col gap-3 p-6"
          aria-label="Reservation not found"
        >
          <span className="grid size-11 place-items-center rounded-xl border border-brass/35 bg-brass/10 text-brass">
            <Hourglass className="size-5" aria-hidden="true" />
          </span>
          <h2 className="display-md text-bone">We could not find that reference</h2>
          <p className="copy-sm max-w-[62ch]">
            Double-check the reference printed on your confirmation, or call us at{" "}
            <a
              href={site.phones[0].href}
              className="text-brass underline-offset-4 hover:underline"
            >
              {site.phones[0].label}
            </a>{" "}
            and we will locate your booking. Reservations are stored on the device that created them
            while Dangbu runs in preview mode.
          </p>
          <Button variant="outline" size="lg" asChild className="w-fit">
            <Link to="/#reservation">Make a new reservation</Link>
          </Button>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section role="alert" className="panel flex flex-col gap-3 p-6">
          <span className="grid size-11 place-items-center rounded-xl border border-destructive/40 bg-destructive/10 text-destructive">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <h2 className="display-md text-bone">Something went wrong</h2>
          <p className="copy-sm max-w-[62ch]">
            We could not read your reservation just now. Please refresh the page or call{" "}
            {site.phones[0].label}.
          </p>
        </section>
      ) : null}
    </div>
  );
}
