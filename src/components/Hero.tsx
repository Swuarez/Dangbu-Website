import { Clock, Flame, MapPin, Utensils } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { EmberField } from "@/components/EmberField";
import { PriceStrip } from "@/components/PriceStrip";
import { Button } from "@/components/ui/button";
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

function SealBadge() {
  const reduceMotion = useReducedMotion();

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
          <text fill="rgba(248,221,160,0.85)" fontSize="15" fontWeight="600" letterSpacing="4.5">
            <textPath href="#dangbu-seal-path" startOffset="0%">
              Come hungry · Leave satisfied ·
            </textPath>
            <textPath href="#dangbu-seal-path" startOffset="50%">
              All-unlimited Korean BBQ ·
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

export function Hero() {
  const reduceMotion = useReducedMotion();
  const scrollToSection = useScrollToSection();
  const { requestReservation } = useReservationIntent();
  const { scrollY } = useScroll();
  const glowShift = useTransform(scrollY, [0, 900], [0, 130]);
  const fanShift = useTransform(scrollY, [0, 900], [0, -55]);

  return (
    <section
      id="home"
      tabIndex={-1}
      aria-labelledby="hero-title"
      className="relative isolate flex flex-col overflow-hidden pt-20 focus:outline-none md:pt-24"
    >
      {/* ---- atmosphere ---- */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(120%_90%_at_12%_110%,rgba(225,34,31,0.42)_0%,rgba(124,11,18,0.16)_42%,rgba(11,8,6,0)_72%)]"
      />
      <motion.div
        aria-hidden="true"
        style={reduceMotion ? undefined : { y: glowShift }}
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
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-ember/45 bg-ember/12 px-3.5 py-1.5 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#ffd2c6] sm:text-[0.66rem]">
                <Flame className="size-3.5 animate-flicker text-ember-bright" aria-hidden="true" />
                All-Unlimited Korean BBQ
              </span>
            </motion.div>

            <motion.h1
              id="hero-title"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="display-hero foil-text"
            >
              Dangbu
            </motion.h1>

            <motion.p
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="display-lg max-w-[26ch] text-bone"
            >
              Unlimited Samgyupsal <span className="text-brass">&amp;</span> Buffet
            </motion.p>

            <motion.p
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="copy max-w-[52ch]"
            >
              {site.hookline} Come hungry and enjoy the ultimate ALL-UNLIMITED Korean BBQ
              experience!
            </motion.p>

            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
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
            </motion.div>

            <motion.ul
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="mt-1 grid w-full gap-2.5 sm:grid-cols-3 sm:gap-3"
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
            </motion.ul>
          </div>

          {/* ---- poster fan ---- */}
          <motion.div
            style={reduceMotion ? undefined : { y: fanShift }}
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
                      <img
                        src={pkg.image}
                        alt={pkg.imageAlt}
                        width={1078}
                        height={1440}
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        decoding="async"
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
          </motion.div>
        </div>
      </div>

      <PriceStrip />
    </section>
  );
}
