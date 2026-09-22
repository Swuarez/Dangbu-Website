import { Check, Flame, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReservationIntent } from "@/context/ReservationIntentContext";
import type { MenuPackage } from "@/data/menu";
import { cn } from "@/lib/utils";

/** One unlimited package card: poster art, price, includes and both CTAs. */
export function MenuCard({
  pkg,
  index,
  onView,
  className,
}: {
  pkg: MenuPackage;
  index: number;
  onView: () => void;
  className?: string;
}) {
  const { requestReservation } = useReservationIntent();

  return (
    <article
      className={cn(
        "panel panel-hover group relative flex h-full flex-col overflow-hidden",
        "hover:-translate-y-1.5",
        pkg.featured && "border-brass/45 shadow-[0_30px_80px_-40px_rgba(231,178,76,0.65)]",
        className,
      )}
    >
      {pkg.featured ? (
        <span className="absolute right-0 top-4 z-20 bg-[linear-gradient(180deg,var(--color-brass-light),var(--color-brass-deep))] px-3 py-1 font-sans text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[#1b1306] shadow-lg">
          Best Seller
        </span>
      ) : null}

      <button
        type="button"
        onClick={onView}
        aria-label={`Open the full ${pkg.price} ${pkg.name} menu`}
        className="relative block w-full cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brass"
      >
        <img
          src={pkg.image}
          alt={pkg.imageAlt}
          width={1078}
          height={1440}
          loading="lazy"
          decoding="async"
          className="aspect-[3/4] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
        />

        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,8,6,0.05)_0%,rgba(11,8,6,0.35)_58%,rgba(11,8,6,0.92)_100%)]"
        />

        <span className="absolute left-3 top-3 rounded-full border border-bone/20 bg-ink/70 px-2.5 py-1 font-sans text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-bone-dim backdrop-blur">
          Set {String(index + 1).padStart(2, "0")}
        </span>

        <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
          <Badge variant="unlimited">
            <Flame className="size-3" aria-hidden="true" />
            Unlimited
          </Badge>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-ink/75 px-2.5 py-1 font-sans text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-brass-light opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
            <Maximize2 className="size-3" aria-hidden="true" />
            View
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-end justify-between gap-3">
          <span className="display-price foil-text">{pkg.price}</span>
          <span className="pb-1 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ash-text">
            per head
          </span>
        </div>

        <h3 className="display-md text-bone">{pkg.name}</h3>

        <p className="font-sans text-[0.7rem] uppercase tracking-[0.16em] text-brass/80">
          {pkg.tagline}
        </p>

        <ul className="mt-1 grid gap-1.5">
          {pkg.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2 text-[0.84rem] leading-snug text-bone-dim">
              <Check className="mt-0.5 size-3.5 shrink-0 text-brass/80" aria-hidden="true" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-2.5 pt-3">
          <Button variant="outline" onClick={onView} className="w-full">
            View Menu
          </Button>
          <Button
            variant="ember"
            onClick={() => requestReservation({ packageId: pkg.id })}
            className="w-full"
          >
            Reserve This Package
          </Button>
        </div>
      </div>
    </article>
  );
}
