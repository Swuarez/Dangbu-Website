import * as React from "react";
import { MenuCard } from "@/components/MenuCard";
import { MenuModal } from "@/components/MenuModal";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { menuPackages } from "@/data/menu";

const PACKAGE_NOTES = [
  "Per head · dine-in",
  "Unlimited refills",
  "All packages include rice, sauces & dessert",
];

export function MenuSection() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <section
      id="menu"
      tabIndex={-1}
      aria-labelledby="menu-title"
      className="section-pad relative isolate scroll-mt-20 overflow-hidden border-b border-bone/6 focus:outline-none"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40%] bg-[linear-gradient(180deg,rgba(18,13,10,1),rgba(11,8,6,0)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/4 -z-10 h-96 w-96 animate-glow-pulse rounded-full bg-[radial-gradient(circle,rgba(231,178,76,0.22),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-0 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(225,34,31,0.24),transparent_70%)]"
      />

      <div className="shell flex flex-col gap-10 lg:gap-12">
        <SectionHeading
          align="center"
          eyebrow="The Menu"
          headingId="menu-title"
          title={
            <>
              Choose your perfect <span className="foil-text">package</span>
            </>
          }
          description="Four unlimited experiences. One place to enjoy them all."
        />

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {PACKAGE_NOTES.map((note) => (
            <Badge key={note} variant="outline" className="normal-case tracking-[0.12em]">
              {note}
            </Badge>
          ))}
        </div>

        <RevealGroup className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" stagger={0.08}>
          {menuPackages.map((pkg, index) => (
            <RevealItem key={pkg.id} className="h-full">
              <MenuCard pkg={pkg} index={index} onView={() => setActiveIndex(index)} />
            </RevealItem>
          ))}
        </RevealGroup>

        <p className="copy-sm mx-auto max-w-[76ch] text-center text-ash-text">
          Prices are per head and inclusive of unlimited servings of the items listed for that
          package. Menu items may change based on availability. Leftovers are charged separately.
          Tap any package image to read the full official menu.
        </p>
      </div>

      <MenuModal
        index={activeIndex}
        onIndexChange={(next) => setActiveIndex(next)}
        onClose={() => setActiveIndex(null)}
      />
    </section>
  );
}
