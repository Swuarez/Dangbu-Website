import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Heart, PartyPopper, Users, UsersRound } from "lucide-react";
import * as React from "react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { useReservationIntent } from "@/context/ReservationIntentContext";
import { cn } from "@/lib/utils";

interface Occasion {
  emoji: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
}

const OCCASIONS: Occasion[] = [
  {
    emoji: "👨‍👩‍👧‍👦",
    title: "Family",
    description: "Long tables, unlimited refills and something for every age.",
    detail: "Great for Sunday lunches",
    icon: Users,
  },
  {
    emoji: "🧑‍🤝‍🧑",
    title: "Friends",
    description: "Barkada nights with endless samgyupsal and unli sides.",
    detail: "Group-friendly packages",
    icon: UsersRound,
  },
  {
    emoji: "❤️",
    title: "Dates",
    description: "A cozy grill for two with premium cuts and quiet corners.",
    detail: "Couple seats available",
    icon: Heart,
  },
  {
    emoji: "🎉",
    title: "Celebrations",
    description: "Birthdays, anniversaries and milestones worth feasting on.",
    detail: "Bring your cake — we handle the grill",
    icon: PartyPopper,
  },
];

export function OccasionsSection() {
  const { requestReservation } = useReservationIntent();
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: true, containScroll: "trimSnaps" },
    [Autoplay({ delay: 5200, stopOnMouseEnter: true, stopOnInteraction: true })],
  );
  const [selected, setSelected] = React.useState(0);
  const [snaps, setSnaps] = React.useState(OCCASIONS.length);

  React.useEffect(() => {
    if (!emblaApi) return;

    const sync = () => {
      setSelected(emblaApi.selectedScrollSnap());
      setSnaps(emblaApi.scrollSnapList().length);
    };

    sync();
    emblaApi.on("select", sync).on("reInit", sync);

    return () => {
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi]);

  return (
    <section
      id="occasions"
      tabIndex={-1}
      aria-labelledby="occasions-title"
      className="section-pad relative isolate scroll-mt-20 overflow-hidden border-b border-bone/6 bg-[linear-gradient(180deg,rgba(11,8,6,1)_0%,rgba(26,19,16,1)_50%,rgba(11,8,6,1)_100%)] focus:outline-none"
    >
      <div
        aria-hidden="true"
        className="grain pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
      />

      <div className="shell flex flex-col gap-9">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Occasions"
            headingId="occasions-title"
            title={
              <>
                Good food. Good people. <span className="ember-text">Good times.</span>
              </>
            }
            description="Perfect for family, friends, dates & celebrations!"
            className="lg:max-w-2xl"
          />

          <div className="hidden gap-2 lg:flex">
            <Button
              variant="outline"
              size="icon"
              aria-label="Show previous occasion"
              onClick={() => emblaApi?.scrollPrev()}
              className="size-11"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Show next occasion"
              onClick={() => emblaApi?.scrollNext()}
              className="size-11"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <Reveal>
          <div
            ref={emblaRef}
            role="group"
            aria-roledescription="carousel"
            aria-label="Occasions at Dangbu"
            className="overflow-hidden"
          >
            <div className="-ml-4 flex touch-pan-y">
              {OCCASIONS.map((occasion) => (
                <div
                  key={occasion.title}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={occasion.title}
                  className="min-w-0 shrink-0 grow-0 basis-[84%] pl-4 sm:basis-[47%] lg:basis-[32%] xl:basis-[24.5%]"
                >
                  <article className="panel panel-hover group flex h-full flex-col gap-3 p-5 hover:-translate-y-1 sm:p-6">
                    <span
                      aria-hidden="true"
                      className="grid size-14 place-items-center rounded-2xl border border-brass/30 bg-[linear-gradient(160deg,rgba(231,178,76,0.16),rgba(225,34,31,0.14))] text-2xl transition-transform duration-500 group-hover:scale-105"
                    >
                      {occasion.emoji}
                    </span>

                    <h3 className="display-md text-bone">{occasion.title}</h3>

                    <p className="copy-sm">{occasion.description}</p>

                    <p className="mt-auto flex items-start gap-2 pt-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-brass/80">
                      <occasion.icon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      {occasion.detail}
                    </p>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start px-0 text-brass hover:bg-transparent hover:text-brass-light"
                      onClick={() => requestReservation()}
                    >
                      Reserve for {occasion.title.toLowerCase()}
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    </Button>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="tablist" aria-label="Occasion slides">
            {Array.from({ length: snaps }).map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                role="tab"
                aria-selected={selected === dotIndex}
                aria-label={`Go to occasion slide ${dotIndex + 1}`}
                onClick={() => emblaApi?.scrollTo(dotIndex)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  selected === dotIndex ? "w-8 bg-brass" : "w-3 bg-bone/20 hover:bg-bone/35",
                )}
              />
            ))}
          </div>

          <div className="flex gap-2 lg:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label="Show previous occasion"
              onClick={() => emblaApi?.scrollPrev()}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Show next occasion"
              onClick={() => emblaApi?.scrollNext()}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
