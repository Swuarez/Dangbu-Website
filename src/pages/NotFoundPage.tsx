import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";

export default function NotFoundPage() {
  return (
    <div className="shell flex min-h-[70dvh] flex-col items-center justify-center gap-5 pb-20 pt-28 text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-brass/35 bg-brass/10 text-brass">
        <Compass className="size-6" aria-hidden="true" />
      </span>

      <p className="eyebrow">404</p>
      <h1 className="display-lg text-bone">
        This table is <span className="foil-text">off the menu</span>
      </h1>
      <p className="copy max-w-[52ch]">
        The page you were looking for is not here. Head back to the grills and pick your unlimited
        package.
      </p>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button variant="ember" size="lg" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href={site.phones[0].href}>Call {site.phones[0].label}</a>
        </Button>
      </div>
    </div>
  );
}
