import { MapPin, Navigation } from "lucide-react";
import { BranchCard } from "@/components/BranchCard";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { branches, getDirectionsUrl } from "@/data/branches";
import { site } from "@/data/site";

export function BranchSection() {
  return (
    <section
      id="branches"
      tabIndex={-1}
      aria-labelledby="branches-title"
      className="section-pad relative isolate scroll-mt-20 overflow-hidden border-b border-bone/6 focus:outline-none"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(rgba(231,178,76,0.14)_1px,transparent_1px)] [background-size:34px_34px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(180deg,rgba(11,8,6,1),rgba(11,8,6,0))]"
      />

      <div className="shell flex flex-col gap-10">
        <SectionHeading
          align="center"
          eyebrow="Branches"
          headingId="branches-title"
          title={
            <>
              Visit <span className="foil-text">Dangbu</span>
            </>
          }
          description={`Two unlimited Korean BBQ houses in ${site.city}. Same unlimited menu, same warm grills, two neighborhoods.`}
        />

        <RevealGroup className="grid gap-5 md:grid-cols-2 lg:gap-6" stagger={0.09}>
          {branches.map((branch, index) => (
            <RevealItem key={branch.id} className="h-full">
              <BranchCard branch={branch} index={index} />
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brass/30 bg-brass/8 text-brass">
              <MapPin className="size-4.5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <p className="font-display text-base uppercase tracking-[0.06em] text-bone">
                Both branches open daily
              </p>
              <p className="text-[0.8rem] text-ash-text">
                {site.hours} · walk-ins welcome, reservations seated first
              </p>
            </div>
          </div>

          <Button variant="outline" asChild className="w-full shrink-0 sm:w-auto">
            <a
              href={getDirectionsUrl(branches[0])}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open in Maps — Dangbu Main Branch on Google Maps`}
            >
              <Navigation className="size-4" aria-hidden="true" />
              Open in Maps
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
