import { ArrowUpRight, Flame, Menu as MenuIcon, Phone } from "lucide-react";
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useReservationIntent } from "@/context/ReservationIntentContext";
import { navLinks, sectionIds, site, type NavLink } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useScrollToSection } from "@/hooks/useScrollToSection";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/utils";

const HOME_LINK: NavLink = { label: "Home", to: "/#home", sectionId: "home" };

export function Navbar() {
  const scrolled = useScrolled(24);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const activeSection = useActiveSection(sectionIds);
  const scrollToSection = useScrollToSection();
  const { requestReservation } = useReservationIntent();
  const [open, setOpen] = React.useState(false);

  // Desktop active-link pill: measured once per active-section change and
  // moved with a plain CSS transition (replaces motion's layoutId animation).
  const navListRef = React.useRef<HTMLUListElement>(null);
  const itemRefs = React.useRef<Record<string, HTMLLIElement | null>>({});
  const [pill, setPill] = React.useState<{ x: number; w: number } | null>(null);

  React.useLayoutEffect(() => {
    const list = navListRef.current;
    if (!list) return;

    const measure = () => {
      const activeId = isHome
        ? (navLinks.find((link) => link.sectionId === activeSection)?.to ?? null)
        : null;
      const item = activeId ? itemRefs.current[activeId] : null;
      setPill(item ? { x: item.offsetLeft, w: item.offsetWidth } : null);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeSection, isHome]);

  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const solid = scrolled || !isHome || open;

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, link: NavLink) => {
    if (!isHome) return;
    event.preventDefault();
    setOpen(false);
    scrollToSection(link.sectionId);
  };

  const handleReserveClick = () => {
    setOpen(false);
    requestReservation();
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
        solid
          ? "border-b border-brass/15 bg-ink/88 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav aria-label="Primary" className="shell flex h-16 items-center justify-between gap-3 md:h-20">
        <Link
          to="/#home"
          onClick={(event) => handleLinkClick(event, HOME_LINK)}
          className="group flex items-center gap-2.5 rounded-full py-1 pr-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl border border-brass/40 bg-[linear-gradient(160deg,rgba(231,178,76,0.22),rgba(225,34,31,0.28))] text-brass shadow-[0_10px_26px_-14px_rgba(225,34,31,0.9)] transition-transform duration-500 group-hover:scale-105 md:size-10"
          >
            <Flame className="size-4.5 md:size-5" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="font-display text-lg tracking-[0.02em] text-bone transition-colors group-hover:text-brass-light md:text-xl">
              {site.name}
            </span>
            <span className="hidden text-[0.5rem] font-semibold uppercase tracking-[0.34em] text-ash-text sm:block">
              Unlimited Samgyupsal
            </span>
          </span>
        </Link>

        <ul
          ref={navListRef}
          className="relative hidden items-center gap-0.5 lg:flex xl:gap-1.5"
        >
          <li
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute left-0 top-0 h-full rounded-full border border-brass/35 bg-brass/12 transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
              pill ? "opacity-100" : "opacity-0",
            )}
            style={{
              transform: `translateX(${pill?.x ?? 0}px)`,
              width: pill?.w ?? 0,
            }}
          />
          {navLinks.map((link) => {
            const isActive = isHome && activeSection === link.sectionId;
            return (
              <li
                key={link.to}
                ref={(node) => {
                  itemRefs.current[link.to] = node;
                }}
              >
                <Link
                  to={link.to}
                  onClick={(event) => handleLinkClick(event, link)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative block rounded-full px-3.5 py-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 xl:px-4 xl:text-[0.74rem]",
                    isActive ? "text-brass-light" : "text-bone-dim hover:text-bone",
                  )}
                >
                  <span className="relative">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={site.phones[0].href}
            className="hidden items-center gap-2 rounded-full border border-bone/12 px-3.5 py-2 text-[0.72rem] font-semibold tracking-[0.12em] text-bone-dim transition-colors hover:border-brass/50 hover:text-brass xl:inline-flex"
          >
            <Phone className="size-3.5" aria-hidden="true" />
            {site.phones[0].label}
          </a>

          <Button
            variant="ember"
            size="sm"
            onClick={handleReserveClick}
            className="hidden sm:inline-flex md:h-10 md:px-5"
          >
            Reserve Now
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="glass"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <MenuIcon className="size-4.5" aria-hidden="true" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="px-5 pb-7 pt-6 sm:px-6">
              <div className="flex flex-col gap-1 pr-12">
                <SheetTitle className="display-md foil-text">Dangbu</SheetTitle>
                <SheetDescription className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-ash-text">
                  Unlimited Samgyupsal &amp; Buffet
                </SheetDescription>
                <p className="mt-1 font-display text-sm uppercase tracking-[0.06em] text-brass/85">
                  {site.tagline}
                </p>
              </div>

              <nav aria-label="Mobile" className="mt-2">
                <ul className="flex flex-col">
                  {navLinks.map((link, index) => (
                    <li
                      key={link.to}
                      className="border-b border-bone/8 last:border-b-0"
                      style={{
                        animation: "slide-in-fade 0.36s var(--ease-brand) both",
                        animationDelay: `${0.06 + index * 0.05}s`,
                      }}
                    >
                      <Link
                        to={link.to}
                        onClick={(event) => handleLinkClick(event, link)}
                        className={cn(
                          "flex items-center justify-between gap-4 py-3.5 transition-colors",
                          isHome && activeSection === link.sectionId
                            ? "text-brass-light"
                            : "text-bone hover:text-brass",
                        )}
                      >
                        <span className="flex items-baseline gap-3">
                          <span className="font-sans text-[0.6rem] font-semibold tracking-[0.2em] text-ash-text">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-display text-xl uppercase tracking-[0.02em]">
                            {link.label}
                          </span>
                        </span>
                        <ArrowUpRight className="size-4 shrink-0 text-brass/70" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-auto flex flex-col gap-3 pt-4">
                <div className="rounded-[var(--radius-brand)] border border-brass/20 bg-bone/[0.03] p-4">
                  <p className="eyebrow text-[0.58rem]">Reservations &amp; inquiries</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {site.phones.map((phone) => (
                      <li key={phone.href}>
                        <a
                          href={phone.href}
                          className="flex items-center gap-2 font-display text-base tracking-[0.04em] text-bone transition-colors hover:text-brass"
                        >
                          <Phone className="size-3.5 text-brass/80" aria-hidden="true" />
                          {phone.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[0.7rem] text-ash-text">{site.hours}</p>
                </div>

                <Button variant="ember" size="lg" className="w-full" onClick={handleReserveClick}>
                  Reserve Now
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
