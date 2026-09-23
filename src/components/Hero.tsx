import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Beer, ChevronRight, Clock, Flame, Heart, MapPin, PartyPopper, Users, Utensils } from "lucide-react";
import { EmberField } from "@/components/EmberField";
import { PosterPicture } from "@/components/PosterPicture";
import { PriceStrip } from "@/components/PriceStrip";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { useMotionPreference } from "@/context/MotionPreferenceContext";
import { useReservationIntent } from "@/context/ReservationIntentContext";
import { menuPackages } from "@/data/menu";
import { site } from "@/data/site";
import { useScrollToSection } from "@/hooks/useScrollToSection";

/** Poster fan geometry — percentages of each poster's own width. */
const FAN_LAYOUT = [
  { x: -118, y: 8, rotate: -15 },
  { x: -40, y: -4, rotate: -5 },
  { x: 40, y: -4, rotate: 5 },
  { x: 118, y: 8, rotate: 15 },
];

const HERO_FACTS = [
  { icon: Clock, label: site.hours },
  { icon: MapPin, label: "2 branches in Quezon City" },
  { icon: Utensils, label: "4 unlimited packages · ₱299 – ₱499" },
];

/** Merged from the former standalone Occasions section — kept compact so the hero stays the star.
 *  Lucide stroke icons keep the brand's linework consistent (no emoji, no mixed weights). */
const OCCASIONS: { title: string; blurb: string; icon: LucideIcon }[] = [
  { title: "Family", blurb: "Big tables, unli refills", icon: Users },
  { title: "Friends", blurb: "Barkada nights done right", icon: Beer },
  { title: "Dates", blurb: "A cozy grill for two", icon: Heart },
  { title: "Celebrations", blurb: "Birthdays & milestones", icon: PartyPopper },
];

function SealBadge() {
  const { reduced: reduceMotion } = useMotionPreference();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-2 bottom-2 hidden size-24 lg:block xl:size-28"
    >
      <svg viewBox="0 0 200 200" className="size-full">
        <defs>
          <path
            id="dangbu-seal-path"
            d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"
            fill="none"
          />
        </defs>
        <circle cx="100" cy="100" r="92" fill="rgba(11,8,6,0.55)" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(231,178,76,0.45)" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(231,178,76,0.22)" />
        <g
          className={reduceMotion ? undefined : "animate-spin"}
          style={{
            animationDuration: "34s",
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
        >
          {/*
            One textPath stretched to the exact circumference of the r=74
            circle (2π · 74 ≈ 465) so the glyphs distribute evenly with no
            overlap or gap — two half-path segments never added up to 50%.
          */}
          <text fill="rgba(248,221,160,0.85)" fontSize="15" fontWeight="600">
            <textPath
              href="#dangbu-seal-path"
              startOffset="0"
              textLength="465"
              lengthAdjust="spacingAndGlyphs"
            >
              Come hungry · Leave satisfied · All-unlimited Korean BBQ ·
            </textPath>
          </text>
        </g>
        <text
          x="100"
          y="95"
          textAnchor="middle"
          fill="#f8f1e6"
          fontSize="30"
          fontWeight="700"
          letterSpacing="1"
        >
          ₱299
        </text>
        <text
          x="100"
          y="119"
          textAnchor="middle"
          fill="rgba(231,178,76,0.9)"
          fontSize="13"
          letterSpacing="2.5"
        >
          UP TO ₱499
        </text>
      </svg>
    </div>
  );
}

/**
 * Lightweight parallax: one passive scroll listener + rAF writes
 * --hero-shift (0 → 1 across the first 900 px). The atmosphere glow and the
 * poster fan read it from CSS `translate`, so JS runs at most one
 * custom-property write per frame (replaces motion/react's useScroll).
 */
function useHeroShift(active: boolean) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!active) {
      element.style.setProperty("--hero-shift", "0");
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / 900));
      element.style.setProperty("--hero-shift", String(progress));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [active]);

  return ref;
}

/** Entrance fade-up styles — omitted entirely in reduced-motion mode. */
function riseIn(
  y: number,
  delay: number,
  duration: number,
  reduced: boolean,
): React.CSSProperties | undefined {
  if (reduced) return undefined;
  return {
    animation: `rise-in ${duration}s var(--ease-brand) both`,
    animationDelay: `${delay}s`,
    "--rise": `${y}px`,
  } as React.CSSProperties;
}

export function Hero() {
  const { reduced: reduceMotion } = useMotionPreference();
  const scrollToSection = useScrollToSection();
  const { requestReservation } = useReservationIntent();
  const heroRef = useHeroShift(!reduceMotion);

  return (
    <section
      id="home"
      ref={heroRef}
      tabIndex={-1}
      aria-labelledby="hero-title"
      className="relative isolate flex flex-col overflow-hidden pt-20 focus:outline-none md:pt-24"
    >
      {/* ---- atmosphere ---- */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(120%_90%_at_12%_110%,rgba(225,34,31,0.42)_0%,rgba(124,11,18,0.16)_42%,rgba(11,8,6,0)_72%)]"
      />
      <div
        aria-hidden="true"
        style={{ translate: "0 calc(var(--hero-shift, 0) * 130px)" }}
        className="absolute inset-x-0 -top-24 -z-20 h-[60vh] animate-glow-pulse bg-[radial-gradient(70%_60%_at_78%_0%,rgba(231,178,76,0.26)_0%,rgba(231,178,76,0.05)_45%,rgba(11,8,6,0)_75%)]"
      />
      <div
        aria-hidden="true"
        className="grill-slats absolute inset-x-0 bottom-0 -z-10 h-1/2 opacity-[0.16] [mask-image:linear-gradient(to_top,rgba(0,0,0,0.9),transparent)]"
      />
      <div
        aria-hidden="true"
        className="grain absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay"
      />
      <EmberField className="-z-10" count={18} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 top-24 -z-10 select-none font-display text-[34vw] leading-none text-bone/[0.035] sm:text-[26vw]"
      >
        당부
      </span>

      <div className="shell flex flex-1 flex-col justify-center gap-10 py-8 sm:py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-center xl:gap-14">
          <div className="flex flex-col items-start gap-5 sm:gap-6">
            <div style={riseIn(14, 0, 0.55, reduceMotion)}>
              <span className="inline-flex items-center gap-2 rounded-full border border-ember/45 bg-ember/12 px-3.5 py-1.5 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#ffd2c6] sm:text-[0.66rem]">
                <Flame className="size-3.5 animate-flicker text-ember-bright" aria-hidden="true" />
                All-Unlimited Korean BBQ
              </span>
            </div>

            <h1
              id="hero-title"
              className="display-hero foil-text"
              style={riseIn(26, 0.06, 0.75, reduceMotion)}
            >
              Dangbu
            </h1>

            <p
              className="display-lg max-w-[26ch] text-bone"
              style={riseIn(18, 0.14, 0.7, reduceMotion)}
            >
              Unlimited Samgyupsal <span className="text-brass">&amp;</span> Buffet
            </p>

            <p
              className="copy max-w-[52ch]"
              style={riseIn(16, 0.2, 0.7, reduceMotion)}
            >
              {site.hookline} Come hungry and enjoy the ultimate ALL-UNLIMITED Korean BBQ
              experience!
            </p>

            <div
              className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
              style={riseIn(16, 0.26, 0.7, reduceMotion)}
            >
              <Button
                variant="brass"
                size="xl"
                onClick={() => scrollToSection("menu")}
                className="w-full sm:w-auto"
              >
                View Menu
              </Button>
              <Button
                variant="ember"
                size="xl"
                onClick={() => requestReservation()}
                className="w-full sm:w-auto"
              >
                Reserve a Table
              </Button>
            </div>

            <ul
              className="mt-1 grid w-full gap-2.5 sm:grid-cols-3 sm:gap-3"
              style={riseIn(14, 0.34, 0.7, reduceMotion)}
            >
              {HERO_FACTS.map((fact) => (
                <li
                  key={fact.label}
                  className="flex items-center gap-2.5 rounded-xl border border-bone/8 bg-bone/[0.025] px-3 py-2.5"
                >
                  <fact.icon className="size-4 shrink-0 text-brass" aria-hidden="true" />
                  <span className="text-[0.78rem] leading-snug text-bone-dim">{fact.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ---- poster fan ---- */}
          <div
            style={{ translate: "0 calc(var(--hero-shift, 0) * -55px)" }}
            className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-5 lg:max-w-none"
          >
            <div className="relative h-[clamp(10rem,46vw,25rem)] w-full">
              {menuPackages.map((pkg, index) => {
                const layout = FAN_LAYOUT[index] ?? FAN_LAYOUT[0];

                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => scrollToSection("menu")}
                    aria-label={`View the ${pkg.price} ${pkg.name} menu`}
                    className="group absolute left-1/2 top-1/2 w-[clamp(5.4rem,19vw,11rem)] cursor-pointer rounded-[0.6rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass"
                    style={{
                      transform: `translate(-50%, -50%) translate(${layout.x}%, ${layout.y}%) rotate(${layout.rotate}deg)`,
                      zIndex: 10 + index,
                    }}
                  >
                    <span className="block overflow-hidden rounded-[0.6rem] border border-brass/30 bg-coal shadow-[0_26px_60px_-26px_rgba(0,0,0,0.95)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-3 group-hover:scale-[1.05]">
                      <PosterPicture
                        image={pkg.image}
                        alt={pkg.imageAlt}
                        sizes="(min-width: 1024px) 176px, 19vw"
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        className="aspect-[3/4] w-full object-cover"
                      />
                    </span>
                    <span className="mt-1.5 block text-center font-display text-[0.6rem] uppercase tracking-[0.16em] text-brass/85 sm:text-[0.7rem]">
                      {pkg.price}
                    </span>
                  </button>
                );
              })}
            </div>

            <SealBadge />

            <p className="max-w-[32ch] text-center text-[0.66rem] uppercase tracking-[0.22em] text-ash-text sm:text-[0.72rem]">
              Official menu posters · tap a package to explore
            </p>
          </div>
        </div>

        {/* ---- occasions ribbon (merged from the former standalone section) ---- */}
        <RevealGroup
          className="flex flex-col gap-4 border-t border-bone/8 pt-7 sm:pt-8"
          stagger={0.07}
          amount={0.25}
        >
          <RevealItem>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
              <p className="eyebrow text-brass/85">One grill · every gathering</p>
              <p className="text-[0.7rem] text-ash-text sm:text-[0.74rem]">
                Good food. Good people. <span className="text-brass/80">Good times.</span>
              </p>
            </div>
          </RevealItem>

          <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {OCCASIONS.map((occasion) => (
              <li key={occasion.title} className="h-full">
                <RevealItem className="h-full">
                  <button
                    type="button"
                    onClick={() => requestReservation()}
                    aria-label={`Reserve a table for ${occasion.title.toLowerCase()}`}
                    className="group flex h-full w-full items-center gap-3 rounded-xl border border-bone/8 bg-bone/[0.025] px-3.5 py-3 text-left transition-[border-color,background-color,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform hover:-translate-y-0.5 hover:border-brass/40 hover:bg-bone/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass sm:px-4"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-lg border border-brass/25 bg-[linear-gradient(160deg,rgba(231,178,76,0.16),rgba(225,34,31,0.14))] text-brass transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110 group-hover:-rotate-3 group-hover:border-brass/50 group-hover:text-brass-light group-hover:shadow-[0_0_18px_-4px_rgba(231,178,76,0.55)] sm:size-11"
                    >
                      <occasion.icon className="size-[1.15rem] sm:size-5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-display text-[0.82rem] uppercase tracking-[0.08em] text-bone sm:text-[0.92rem]">
                        {occasion.title}
                      </span>
                      <span className="text-[0.68rem] leading-snug text-ash-text sm:text-[0.72rem]">
                        {occasion.blurb}
                      </span>
                    </span>
                    <ChevronRight
                      className="ml-auto size-3.5 shrink-0 text-brass/0 transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:text-brass/80"
                      aria-hidden="true"
                    />
                  </button>
                </RevealItem>
              </li>
            ))}
          </ul>
        </RevealGroup>
      </div>

      <PriceStrip />
    </section>
  );
}
