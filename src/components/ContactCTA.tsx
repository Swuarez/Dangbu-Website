import { Flame, Phone, PhoneCall } from "lucide-react";
import { EmberField } from "@/components/EmberField";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { useReservationIntent } from "@/context/ReservationIntentContext";
import { site } from "@/data/site";

const PHONE_ICONS = { mobile: Phone, landline: PhoneCall } as const;

export function ContactCTA() {
  const { requestReservation } = useReservationIntent();

  return (
    <section
      id="contact"
      tabIndex={-1}
      aria-labelledby="contact-title"
      className="relative isolate scroll-mt-20 overflow-hidden focus:outline-none"
    >
      <div className="shell pb-14 pt-16 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-24">
        <div className="relative overflow-hidden rounded-[var(--radius-brand-lg)] border border-brass/30 bg-[linear-gradient(150deg,rgba(124,11,18,0.92)_0%,rgba(60,10,12,0.94)_45%,rgba(11,8,6,0.97)_100%)] px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
          <div
            aria-hidden="true"
            className="grill-slats pointer-events-none absolute inset-0 opacity-[0.18]"
          />
          <div
            aria-hidden="true"
            className="grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          />
          <EmberField className="opacity-80" count={12} />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 right-2 select-none font-display text-[22vw] leading-none text-bone/[0.05] sm:text-[16vw]"
          >
            당부
          </span>

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12">
            <div className="flex flex-col gap-4">
              <p className="eyebrow flex items-center gap-3">
                <Flame className="size-4 animate-flicker text-ember-bright" aria-hidden="true" />
                Ready when you are
              </p>

              <h2 id="contact-title" className="display-xl text-bone">
                Ready to <span className="foil-text">feast?</span>
              </h2>

              <p className="copy max-w-[46ch] text-bone-dim">
                Gather your people. Fire up the grill. Enjoy unlimited BBQ.
              </p>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button variant="brass" size="xl" asChild className="w-full sm:w-auto">
                  <a href={site.phones[0].href} aria-label={`Call Now — Dangbu at ${site.phones[0].label}`}>
                    <Phone className="size-4" aria-hidden="true" />
                    Call Now
                  </a>
                </Button>

                <Button
                  variant="ember"
                  size="xl"
                  className="w-full sm:w-auto"
                  onClick={() => requestReservation()}
                >
                  Reserve a Table
                </Button>
              </div>
            </div>

            <Reveal delay={0.1}>
              <ul className="flex flex-col gap-3">
                {site.phones.map((phone) => {
                  const Icon = PHONE_ICONS[phone.type];

                  return (
                    <li key={phone.href}>
                      <a
                        href={phone.href}
                        className="group flex items-center gap-4 rounded-[var(--radius-brand)] border border-bone/12 bg-ink/40 px-4 py-3.5 backdrop-blur transition-colors hover:border-brass/55 hover:bg-ink/60"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brass/35 bg-brass/10 text-brass">
                          <Icon className="size-4.5" aria-hidden="true" />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="font-sans text-[0.56rem] font-semibold uppercase tracking-[0.24em] text-ash-text">
                            {phone.type === "mobile" ? "Mobile" : "Landline"}
                          </span>
                          <span className="font-display text-xl tracking-[0.04em] text-bone tabular-nums">
                            {phone.label}
                          </span>
                        </span>
                        <span className="ml-auto font-sans text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-brass opacity-0 transition-opacity group-hover:opacity-100">
                          Tap to call
                        </span>
                      </a>
                    </li>
                  );
                })}

                <li className="rounded-[var(--radius-brand)] border border-bone/10 bg-ink/30 px-4 py-3 text-[0.8rem] text-ash-text backdrop-blur">
                  {site.hours} · {site.city}
                </li>
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
