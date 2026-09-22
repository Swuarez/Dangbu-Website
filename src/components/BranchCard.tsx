import { CalendarCheck, Clock, MapPin, Navigation, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReservationIntent } from "@/context/ReservationIntentContext";
import { getDirectionsUrl, type Branch } from "@/data/branches";

/** One physical branch with directions + one-tap reservation prefill. */
export function BranchCard({ branch, index }: { branch: Branch; index: number }) {
  const { requestReservation } = useReservationIntent();

  return (
    <article className="panel panel-hover group relative flex h-full flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="relative h-28 overflow-hidden border-b border-bone/10 bg-[radial-gradient(120%_140%_at_20%_0%,rgba(225,34,31,0.32),rgba(18,13,10,0.9)_70%)] sm:h-32"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(231,178,76,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(231,178,76,0.16)_1px,transparent_1px)] [background-size:26px_26px]"
        />
        <span className="absolute left-4 top-4 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-brass/85">
          Branch {String(index + 1).padStart(2, "0")}
        </span>

        <span className="absolute bottom-4 left-4 grid size-11 place-items-center rounded-xl border border-brass/40 bg-ink/75 text-brass shadow-lg backdrop-blur transition-transform duration-500 group-hover:-translate-y-1">
          <MapPin className="size-5" aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <h3 className="display-md text-bone">{branch.name}</h3>

        <p className="flex items-start gap-2 text-[0.92rem] leading-snug text-bone-dim">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brass/80" aria-hidden="true" />
          {branch.address}
        </p>

        <p className="copy-sm">{branch.landmark}</p>

        <ul className="mt-1 grid gap-2">
          <li className="flex items-center gap-2 text-[0.78rem] text-ash-text">
            <Clock className="size-3.5 shrink-0 text-brass/70" aria-hidden="true" />
            {branch.hours}
          </li>
          <li className="flex items-center gap-2 text-[0.78rem] text-ash-text">
            <Users className="size-3.5 shrink-0 text-brass/70" aria-hidden="true" />
            {branch.seating}
          </li>
        </ul>

        <div className="mt-auto flex flex-col gap-2.5 pt-4">
          <Button variant="outline" asChild className="w-full">
            <a
              href={getDirectionsUrl(branch)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Get directions to ${branch.name} on Google Maps`}
            >
              <Navigation className="size-4" aria-hidden="true" />
              Get Directions
            </a>
          </Button>

          <Button
            variant="ember"
            className="w-full"
            onClick={() => requestReservation({ branchId: branch.id })}
            aria-label={`Reserve a table at ${branch.name}`}
          >
            <CalendarCheck className="size-4" aria-hidden="true" />
            Reserve Here
          </Button>
        </div>
      </div>
    </article>
  );
}
