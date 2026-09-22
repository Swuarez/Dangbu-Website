import { ArrowUpRight, Flame, Menu as MenuIcon, Phone } from "lucide-react";
import { motion } from "motion/react";
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

        <ul className="hidden items-center gap-0.5 lg:flex xl:gap-1.5">
          {navLinks.map((link) => {
            const isActive = isHome && activeSection === link.sectionId;
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={(event) => handleLinkClick(event, link)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative block rounded-full px-3.5 py-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 xl:px-4 xl:text-[0.74rem]",
                    isActive ? "text-brass-light" : "text-bone-dim hover:text-bone",
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="nav-active-pill"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-brass/35 bg-brass/12"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  ) : null}
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
                <motion.ul
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
                  }}
                  className="flex flex-col"
                >
                  {navLinks.map((link, index) => (
                    <motion.li
                      key={link.to}
                      variants={{
                        hidden: { opacity: 0, x: 18 },
                        visible: { opacity: 1, x: 0, transition: { duration: 0.36 } },
                      }}
                      className="border-b border-bone/8 last:border-b-0"
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
                    </motion.li>
                  ))}
                </motion.ul>
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
