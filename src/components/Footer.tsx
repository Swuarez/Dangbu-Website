import { ArrowUp, Flame, MapPin, Phone } from "lucide-react";
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MotionToggle } from "@/components/MotionToggle";
import { branches } from "@/data/branches";
import { navLinks, site, type NavLink } from "@/data/site";
import { useScrollToSection } from "@/hooks/useScrollToSection";

export function Footer() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const scrollToSection = useScrollToSection();

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, link: NavLink) => {
    if (!isHome) return;
    event.preventDefault();
    scrollToSection(link.sectionId);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative isolate overflow-hidden border-t border-brass/20 bg-[linear-gradient(180deg,rgba(11,8,6,1)_0%,rgba(20,14,12,1)_100%)]">
      <div
        aria-hidden="true"
        className="grill-slats pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(225,34,31,0.22),transparent_70%)]"
      />

      <div className="shell flex flex-col gap-10 py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col gap-4">
            <Link
              to="/#home"
              onClick={(event) =>
                handleLinkClick(event, { label: "Home", to: "/#home", sectionId: "home" })
              }
              className="flex items-center gap-3"
            >
              <span
                aria-hidden="true"
                className="grid size-11 place-items-center rounded-xl border border-brass/40 bg-[linear-gradient(160deg,rgba(231,178,76,0.22),rgba(225,34,31,0.28))] text-brass"
              >
                <Flame className="size-5" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="display-md foil-text">{site.name}</span>
                <span className="font-sans text-[0.54rem] font-semibold uppercase tracking-[0.3em] text-ash-text">
                  Unlimited Samgyupsal &amp; Buffet
                </span>
              </span>
            </Link>

            <p className="copy-sm max-w-[38ch]">{site.description}</p>

            <p className="font-display text-sm uppercase tracking-[0.08em] text-brass">
              {site.tagline}
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3">
            <h2 className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-brass">
              Quick links
            </h2>
            <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={(event) => handleLinkClick(event, link)}
                    className="text-[0.88rem] text-bone-dim transition-colors hover:text-brass"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-3">
            <h2 className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-brass">
              Branches
            </h2>
            <ul className="flex flex-col gap-4">
              {branches.map((branch) => (
                <li key={branch.id} className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 font-display text-[0.95rem] uppercase tracking-[0.06em] text-bone">
                    <MapPin className="size-3.5 text-brass/80" aria-hidden="true" />
                    {branch.name}
                  </span>
                  <span className="pl-5 text-[0.82rem] leading-snug text-ash-text">
                    {branch.address}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-brass">
              Contact
            </h2>
            <ul className="flex flex-col gap-2">
              {site.phones.map((phone) => (
                <li key={phone.href}>
                  <a
                    href={phone.href}
                    className="inline-flex items-center gap-2 font-display text-base tracking-[0.04em] text-bone transition-colors hover:text-brass"
                  >
                    <Phone className="size-3.5 text-brass/80" aria-hidden="true" />
                    {phone.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-[0.8rem] text-ash-text">{site.hours}</p>
            <p className="text-[0.8rem] text-ash-text">{site.priceRange} per head</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-bone/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.76rem] text-ash-text">{site.copyright}</p>

          <div className="flex flex-wrap items-center gap-4 self-start sm:self-auto">
            <MotionToggle />
            <Link
              to="/privacy"
              className="text-[0.68rem] uppercase tracking-[0.18em] text-ash-text/70 transition-colors hover:text-brass focus-visible:outline-2 focus-visible:outline-brass"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-[0.68rem] uppercase tracking-[0.18em] text-ash-text/70 transition-colors hover:text-brass focus-visible:outline-2 focus-visible:outline-brass"
            >
              Terms
            </Link>
            <Link
              to="/login"
              className="text-[0.68rem] uppercase tracking-[0.18em] text-ash-text/70 transition-colors hover:text-brass focus-visible:outline-2 focus-visible:outline-brass"
            >
              Staff login
            </Link>
            <Button variant="ghost" size="sm" onClick={scrollToTop}>
              <ArrowUp className="size-3.5" aria-hidden="true" />
              Back to top
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
