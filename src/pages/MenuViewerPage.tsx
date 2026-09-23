import { ArrowLeft, ExternalLink, ImageOff, UtensilsCrossed, X } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReservationIntent } from "@/context/ReservationIntentContext";
import { menuPackages } from "@/data/menu";

/** Resolve a URL slug to a package: accepts the id ("standard") or the price ("299"). */
function resolvePackage(slug: string | undefined) {
  if (!slug) return undefined;
  const normalized = slug.trim().toLowerCase().replace(/^₱/, "");
  return (
    menuPackages.find((pkg) => pkg.id.toLowerCase() === normalized) ??
    menuPackages.find((pkg) => String(pkg.priceValue) === normalized)
  );
}

/**
 * Dedicated full-menu route (/menu/:package). A shareable, modal-free fallback
 * that always displays the complete poster with object-contain — never cropped.
 */
export default function MenuViewerPage() {
  const { package: slug } = useParams<{ package: string }>();
  const { requestReservation } = useReservationIntent();
  const pkg = resolvePackage(slug);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    document.title = pkg
      ? `${pkg.name} Menu — Dangbu Unlimited Samgyupsal & Buffet`
      : "Menu — Dangbu Unlimited Samgyupsal & Buffet";
  }, [pkg]);

  if (!pkg) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="eyebrow">Menu viewer</p>
        <h1 className="display-lg text-bone">
          That menu page <span className="foil-text">doesn&apos;t exist</span>
        </h1>
        <p className="copy max-w-md">
          We couldn&apos;t find a package matching “{slug}”. Try /menu/299, /menu/399, /menu/459 or
          /menu/499 — or browse every package on the main page.
        </p>
        <Button asChild variant="ember" size="lg">
          <Link to="/#menu">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Browse the menu
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col" aria-label={`Full menu for ${pkg.name}`}>
      <header className="flex items-center justify-between gap-3 border-b border-bone/10 px-4 py-3 sm:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/#menu">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to website
          </Link>
        </Button>
        <div className="flex min-w-0 items-center gap-2.5">
          <Badge variant="unlimited" className="hidden sm:inline-flex">
            {pkg.price} / head
          </Badge>
          <h1 className="truncate font-display text-sm uppercase tracking-[0.08em] text-bone sm:text-base">
            {pkg.name}
          </h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={pkg.image} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Open full size</span>
            <span className="sm:hidden">Full size</span>
          </a>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-auto bg-[radial-gradient(90%_70%_at_50%_0%,rgba(225,34,31,0.14),rgba(11,8,6,0)_70%)]">
        <div className="flex min-h-full w-full items-center justify-center p-3 sm:p-6">
        {failed ? (
          <div role="alert" className="panel flex max-w-sm flex-col items-center gap-3 p-8 text-center">
            <ImageOff className="size-8 text-brass" aria-hidden="true" />
            <p className="display-sm text-bone">Menu image unavailable</p>
            <p className="copy-sm">
              The poster could not be loaded. Please call 0945 673 2698 and we will help you.
            </p>
          </div>
        ) : (
          <img
            src={pkg.image}
            alt={`Full menu for ${pkg.name} — ${pkg.price} per head at Dangbu Unlimited Samgyupsal & Buffet`}
            width={1078}
            height={1440}
            decoding="async"
            onError={() => setFailed(true)}
            className="h-auto max-h-[calc(100vh-9rem)] max-h-[calc(100svh-9rem)] w-auto max-w-[96vw] rounded-lg border border-brass/25 object-contain shadow-[0_30px_70px_-30px_rgba(0,0,0,0.95)] sm:max-w-[min(92vw,900px)]"
          />
        )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-2.5 border-t border-bone/10 px-4 py-3 sm:px-6">
        <Button
          variant="ember"
          onClick={() => {
            requestReservation({ packageId: pkg.id });
          }}
        >
          <UtensilsCrossed className="size-4" aria-hidden="true" />
          Reserve this package
        </Button>
        <Button asChild variant="outline">
          <Link to="/#menu">
            <X className="size-4" aria-hidden="true" />
            Close
          </Link>
        </Button>
      </footer>
    </main>
  );
}
