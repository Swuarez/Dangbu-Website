import { BadgeCheck, CalendarCheck, Clock, ShieldCheck } from "lucide-react";
import * as React from "react";
import { ReservationConfirmation } from "@/components/ReservationConfirmation";
import { ReservationForm } from "@/components/ReservationForm";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { reservationConfig } from "@/data/reservationConfig";
import type { Reservation } from "@/services/reservationService";

const ASSURANCES = [
  { icon: CalendarCheck, label: "Instant reservation reference" },
  { icon: Clock, label: `${reservationConfig.tableHoldMinutes} minute table hold` },
  { icon: ShieldCheck, label: "No prepayment required" },
];

export function ReservationSection() {
  const [confirmation, setConfirmation] = React.useState<Reservation | null>(null);

  const handleNewReservation = () => {
    const target = document.getElementById("reservation-fullName");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => target?.focus({ preventScroll: true }), 420);
  };

  return (
    <section
      id="reservation"
      tabIndex={-1}
      aria-labelledby="reservation-title"
      className="section-pad relative isolate scroll-mt-20 overflow-hidden border-b border-bone/6 bg-[linear-gradient(180deg,rgba(11,8,6,1)_0%,rgba(20,14,12,1)_40%,rgba(11,8,6,1)_100%)] focus:outline-none"
    >
      <div
        aria-hidden="true"
        className="grain pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-24 -z-10 h-96 w-96 animate-glow-pulse rounded-full bg-[radial-gradient(circle,rgba(225,34,31,0.28),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-10 -z-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(231,178,76,0.2),transparent_70%)]"
      />

      <div className="shell flex flex-col gap-9 lg:gap-11">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Reservations"
            headingId="reservation-title"
            title={
              <>
                Reserve your <span className="foil-text">table</span>
              </>
            }
            description="Make your next Korean BBQ experience unforgettable."
            className="lg:max-w-2xl"
          />

          <Reveal delay={0.1}>
            <ul className="flex flex-wrap gap-2.5">
              {ASSURANCES.map((item) => (
                <li key={item.label}>
                  <Badge variant="outline" className="gap-2 py-1.5 normal-case tracking-[0.1em]">
                    <item.icon className="size-3.5 text-brass" aria-hidden="true" />
                    {item.label}
                  </Badge>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal amount={0.05}>
          <ReservationForm onSubmitted={setConfirmation} />
        </Reveal>

        <p className="flex items-start gap-2 text-[0.78rem] leading-relaxed text-ash-text">
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brass/80" aria-hidden="true" />
          Walk-ins are always welcome, but reserved tables are seated first. For groups larger than{" "}
          {reservationConfig.maxGuestsPerReservation} guests or full-venue bookings, please call
          0945 673 2698.
        </p>
      </div>

      <ReservationConfirmation
        reservation={confirmation}
        onClose={() => setConfirmation(null)}
        onNewReservation={handleNewReservation}
      />
    </section>
  );
}
