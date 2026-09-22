import { Beef, CookingPot, Drumstick, Leaf, Salad, Soup } from "lucide-react";
import { FeatureCard, type FeatureItem } from "@/components/FeatureCard";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { useScrollToSection } from "@/hooks/useScrollToSection";

const FEATURES: FeatureItem[] = [
  {
    icon: CookingPot,
    title: "Regular & Premium Pork",
    description: "Enjoy a variety of flavorful pork selections.",
    detail: "Dangbu · Salt & Pepper · Galbi · Spicy Bulgogi",
  },
  {
    icon: Beef,
    title: "Premium Beef",
    description: "Premium beef selections for a satisfying Korean BBQ experience.",
    detail: "Dangbu · Salt & Pepper · Galbi · Spicy Bulgogi",
  },
  {
    icon: Leaf,
    title: "Beef / Pork Enoki",
    description: "Enjoy delicious enoki combinations with your BBQ.",
    detail: "Unlimited enoki with pork or beef",
  },
  {
    icon: Drumstick,
    title: "Chicken & More",
    description: "Additional meat selections for every craving.",
    detail: "Chicken breast fillet · Unli chicken wings x4 flavors",
  },
  {
    icon: Salad,
    title: "Main & Side Dishes",
    description: "Enjoy Korean-inspired side dishes and favorites.",
    detail: "9 side dishes · 7 main dishes",
  },
  {
    icon: Soup,
    title: "Rice • Sauces • Dessert • Soup",
    description: "Complete your meal with all the essentials.",
    detail: "Kimchi rice · Ssamjang · Buko pandan · Soups",
  },
];

export function ExperienceSection() {
  const scrollToSection = useScrollToSection();

  return (
    <section
      id="experience"
      tabIndex={-1}
      aria-labelledby="experience-title"
      className="section-pad relative isolate scroll-mt-20 overflow-hidden border-b border-bone/6 bg-[linear-gradient(180deg,rgba(11,8,6,1)_0%,rgba(18,13,10,1)_45%,rgba(11,8,6,1)_100%)] focus:outline-none"
    >
      <div
        aria-hidden="true"
        className="grain pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-72 w-72 animate-glow-pulse rounded-full bg-[radial-gradient(circle,rgba(225,34,31,0.3),transparent_70%)]"
      />

      <div className="shell flex flex-col gap-10 lg:gap-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="The Experience"
            headingId="experience-title"
            title={
              <>
                The ultimate unlimited <span className="ember-text">K-BBQ</span> experience
              </>
            }
            description="Enjoy an all-unlimited Korean BBQ experience packed with premium meats, flavorful side dishes, sauces, rice, soup, desserts and more."
            className="lg:max-w-2xl"
          />

          <Button
            variant="outline"
            size="lg"
            onClick={() => scrollToSection("menu")}
            className="w-full shrink-0 sm:w-auto"
          >
            See the packages
          </Button>
        </div>

        <RevealGroup
          className="grid gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3"
          stagger={0.07}
        >
          {FEATURES.map((feature) => (
            <RevealItem key={feature.title} className="h-full">
              <FeatureCard feature={feature} />
            </RevealItem>
          ))}
        </RevealGroup>

        <p className="copy-sm max-w-[70ch] border-l-2 border-brass/40 pl-4 text-ash-text">
          Every package is all-unlimited for a fixed price per head — unlimited meats, unlimited
          sides, unlimited rice, sauces, soup and dessert. Prices are per head and may change based
          on availability.
        </p>
      </div>
    </section>
  );
}
