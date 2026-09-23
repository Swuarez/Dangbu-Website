import { ArrowLeft, ArrowRight, Check, Flame, UtensilsCrossed } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PosterPicture } from "@/components/PosterPicture";
import { useReservationIntent } from "@/context/ReservationIntentContext";
import { menuPackages } from "@/data/menu";

/**
 * Accessible menu lightbox: full poster with object-contain (so the complete
 * menu stays readable on every screen), arrow-key navigation between the four
 * packages and a direct "reserve this package" path into the booking form.
 */
export function MenuModal({
  index,
  onIndexChange,
  onClose,
}: {
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const { requestReservation } = useReservationIntent();
  const open = index !== null;
  const pkg = open ? menuPackages[index] : undefined;

  const move = React.useCallback(
    (direction: 1 | -1) => {
      if (index === null) return;
      onIndexChange((index + direction + menuPackages.length) % menuPackages.length);
    },
    [index, onIndexChange],
  );

  const arrowButton =
    "inline-flex size-10 items-center justify-center rounded-full border border-bone/15 bg-ink/80 text-bone-dim backdrop-blur transition-colors hover:border-brass/60 hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent
        className="max-w-[min(1140px,94vw)] p-0"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
        }}
      >
        {pkg ? (
          <div className="grid max-h-[calc(100dvh-1.5rem)] min-h-0 grid-rows-[minmax(0,auto)_minmax(0,1fr)] overflow-hidden lg:max-h-[min(88dvh,900px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:grid-rows-1">
            <div className="relative flex min-h-0 items-center justify-center bg-[radial-gradient(90%_80%_at_50%_0%,rgba(225,34,31,0.22),rgba(11,8,6,0)_70%)] p-3 sm:p-5">
              <div
                aria-hidden="true"
                className="grill-slats pointer-events-none absolute inset-0 opacity-[0.1]"
              />
              <PosterPicture
                key={pkg.id}
                image={pkg.image}
                alt={pkg.imageAlt}
                sizes="(min-width: 1024px) 620px, 94vw"
                className="mx-auto max-h-[38dvh] w-auto max-w-full animate-zoom-in rounded-lg border border-brass/25 object-contain shadow-[0_30px_70px_-30px_rgba(0,0,0,0.95)] sm:max-h-[46dvh] lg:max-h-[76dvh]"
              />

              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between sm:inset-x-5">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label="Previous package"
                  className={arrowButton}
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </button>
                <span className="rounded-full border border-bone/12 bg-ink/80 px-3 py-1 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ash-text backdrop-blur">
                  {index !== null ? index + 1 : 1} / {menuPackages.length}
                </span>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="Next package"
                  className={arrowButton}
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain border-t border-bone/10 px-5 pb-5 pt-4 sm:px-6 sm:pb-6 lg:border-l lg:border-t-0">
              <div className="flex flex-wrap items-center gap-2 pr-12">
                <Badge variant="unlimited">
                  <Flame className="size-3" aria-hidden="true" />
                  Unlimited
                </Badge>
                {pkg.featured ? <Badge variant="solid">Best Seller</Badge> : null}
              </div>

              <div className="mt-3 flex items-end gap-3">
                <span className="display-price foil-text">{pkg.price}</span>
                <span className="pb-1 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-ash-text">
                  per head
                </span>
              </div>

              <DialogTitle className="mt-2 text-[clamp(1.35rem,2.4vw,1.85rem)]">
                {pkg.name}
              </DialogTitle>

              <DialogDescription className="mt-2">{pkg.blurb}</DialogDescription>

              <div className="mt-4 space-y-4">
                {pkg.groups.map((group) => (
                  <div key={group.title}>
                    <h4 className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-brass">
                      {group.title}
                    </h4>
                    <ul className="mt-2 grid gap-1.5">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-[0.85rem] text-bone-dim">
                          <Check
                            className="mt-0.5 size-3.5 shrink-0 text-brass/80"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 mt-5 flex flex-col gap-2.5 border-t border-bone/10 bg-[linear-gradient(180deg,rgba(17,12,10,0.85),rgba(11,8,6,0.99))] pt-4 sm:flex-row">
                <Button
                  variant="ember"
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    requestReservation({ packageId: pkg.id });
                  }}
                >
                  <UtensilsCrossed className="size-4" aria-hidden="true" />
                  Reserve This Package
                </Button>
                <Button variant="outline" size="lg" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
