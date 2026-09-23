import { Flame } from "lucide-react";
import { menuPackages } from "@/data/menu";

/**
 * Price ribbon directly under the hero — a night-market signboard ticker.
 * Brass-foil prices in display type, flickering ember flames (staggered so
 * they never pulse in sync), diamond separators, and a slow sheen sweep that
 * travels the ribbon like light catching lacquer. The flat border is replaced
 * by brass hairlines that glow toward the centre. Marquee content is
 * duplicated for a seamless loop (clone hidden from assistive tech) and the
 * whole track pauses on hover/focus.
 */
export function PriceStrip() {
  return (
    <section
      aria-label="Unlimited package prices"
      className="group relative overflow-hidden bg-[linear-gradient(180deg,rgba(48,36,32,0.9)_0%,rgba(18,13,10,0.97)_55%,rgba(11,8,6,0.98)_100%)] py-5 sm:py-6"
    >
      {/* Brass hairlines that bloom toward the middle — replaces the flat border-y */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(231,178,76,0.5)_32%,rgba(248,221,160,0.8)_50%,rgba(231,178,76,0.5)_68%,transparent)]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(231,178,76,0.4)_32%,rgba(231,178,76,0.6)_50%,rgba(231,178,76,0.4)_68%,transparent)]"
      />

      <div
        aria-hidden="true"
        className="grill-slats pointer-events-none absolute inset-0 opacity-[0.12]"
      />
      <div
        aria-hidden="true"
        className="grain pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
      />

      {/* Slow light sweep across the ribbon, like sheen on lacquered wood */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-sheen bg-[linear-gradient(105deg,transparent_42%,rgba(248,221,160,0.08)_50%,transparent_58%)] bg-[length:220%_100%]"
        style={{ animationDuration: "7s" }}
      />

      <div className="marquee-mask relative overflow-hidden">
        <div className="marquee-track animate-marquee-slow group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {[...menuPackages, ...menuPackages].map((pkg, index) => (
            <span
              key={`${pkg.id}-${index}`}
              aria-hidden={index >= menuPackages.length ? "true" : undefined}
              className="flex items-center gap-3 whitespace-nowrap px-6 sm:gap-5 sm:px-9"
            >
              <Flame
                className="size-3.5 shrink-0 animate-flicker text-ember/85 sm:size-4"
                style={{
                  animationDelay: `${(index % menuPackages.length) * 0.9}s`,
                  animationDuration: "3.6s",
                }}
                aria-hidden="true"
              />
              <span className="foil-text font-display text-[clamp(1.5rem,4vw,2.4rem)] leading-none transition-[filter] duration-500 group-hover:brightness-110">
                {pkg.price}
              </span>
              <span aria-hidden="true" className="size-1 shrink-0 rotate-45 bg-brass/50" />
              <span className="hidden text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-bone-dim/80 sm:inline">
                {pkg.shortName}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="shell relative mt-3.5 flex items-center gap-3 sm:gap-5">
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(231,178,76,0.5))]"
        />
        <span aria-hidden="true" className="size-1 shrink-0 rotate-45 bg-brass/60" />
        <p className="eyebrow whitespace-nowrap text-center text-[0.58rem] text-brass/90 sm:text-[0.68rem]">
          Unlimited Korean BBQ
        </p>
        <span aria-hidden="true" className="size-1 shrink-0 rotate-45 bg-brass/60" />
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-[linear-gradient(270deg,transparent,rgba(231,178,76,0.5))]"
        />
      </div>
    </section>
  );
}
