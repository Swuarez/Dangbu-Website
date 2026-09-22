import { Flame } from "lucide-react";
import { menuPackages } from "@/data/menu";

/**
 * Price ribbon directly under the hero: an infinite marquee of the four
 * unlimited packages (pauses on hover/focus) plus the "unlimited Korean BBQ"
 * ticker line. Marquee content is duplicated for a seamless loop and the
 * clone is hidden from assistive tech.
 */
export function PriceStrip() {
  return (
    <section
      aria-label="Unlimited package prices"
      className="group relative border-y border-brass/25 bg-[linear-gradient(180deg,rgba(34,26,22,0.92)_0%,rgba(11,8,6,0.96)_100%)] py-4 sm:py-5"
    >
      <div
        aria-hidden="true"
        className="grill-slats pointer-events-none absolute inset-0 opacity-[0.12]"
      />

      <div className="marquee-mask relative overflow-hidden">
        <div className="marquee-track animate-marquee-slow group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {[...menuPackages, ...menuPackages].map((pkg, index) => (
            <span
              key={`${pkg.id}-${index}`}
              aria-hidden={index >= menuPackages.length ? "true" : undefined}
              className="flex items-center gap-3 whitespace-nowrap px-5 sm:gap-4 sm:px-7"
            >
              <span className="font-display text-[clamp(1.35rem,3.6vw,2.1rem)] leading-none text-bone">
                {pkg.price}
              </span>
              <span className="hidden text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-ash-text sm:inline">
                {pkg.shortName}
              </span>
              <Flame className="size-3 shrink-0 text-ember/80 sm:size-3.5" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>

      <div className="shell relative mt-3 flex items-center gap-3 sm:gap-5">
        <span aria-hidden="true" className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(231,178,76,0.5))]" />
        <p className="eyebrow whitespace-nowrap text-center text-[0.58rem] sm:text-[0.68rem]">
          Unlimited Korean BBQ
        </p>
        <span aria-hidden="true" className="h-px flex-1 bg-[linear-gradient(270deg,transparent,rgba(231,178,76,0.5))]" />
      </div>
    </section>
  );
}
