import * as React from "react";
import { useMotionPreference } from "@/context/MotionPreferenceContext";

/* ============================================================
   Scroll reveals — CSS transitions + a tiny IntersectionObserver.
   (Replaces motion/react so the ~36 KB animation library leaves
   the bundle entirely; behaviour is unchanged.)

   Components ask the MotionPreference context (not the raw media query),
   so the footer's "Motion: Full" choice re-enables animations even when
   the OS reports prefers-reduced-motion: reduce. The kill-switch in
   index.css also zeroes transition-delay/duration in reduced mode.

   Each reveal carries a safety net: if IntersectionObserver never
   reports the element visible (locked-down browsers, patched IO, print),
   a timer + scroll check reveals the content anyway instead of leaving
   it stuck at opacity 0.
   ============================================================ */

/** In-view detection with a fallback so content can never remain invisible. */
function useRevealed(
  ref: React.RefObject<HTMLElement | null>,
  amount: number,
  rootMargin: string,
): boolean {
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    if (shown) return;
    const element = ref.current;
    if (!element) return;

    const reveal = () => setShown(true);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) reveal();
        },
        { rootMargin, threshold: amount },
      );
      observer.observe(element);
    }

    const check = () => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) reveal();
    };
    const timer = window.setTimeout(check, 900);
    window.addEventListener("scroll", check, { passive: true, once: true });

    return () => {
      observer?.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("scroll", check);
    };
  }, [ref, amount, rootMargin, shown]);

  return shown;
}

/** Shared stagger state passed from <RevealGroup> to <RevealItem>. */
interface RevealGroupState {
  shown: boolean;
  reduced: boolean;
  stagger: number;
  /** Next child index — called once per <RevealItem> render, in tree order. */
  takeIndex: () => number;
}

const RevealGroupContext = React.createContext<RevealGroupState | null>(null);

/** Single scroll-triggered fade-up reveal. */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  amount = 0.2,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  amount?: number;
}) {
  const { reduced } = useMotionPreference();
  const ref = React.useRef<HTMLDivElement>(null);
  const shown = useRevealed(ref, amount, "0px 0px -70px 0px");
  const distance = reduced ? 0 : y;
  const duration = reduced ? 0.2 : 0.66;
  const transitionDelay = reduced ? 0 : delay;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translate3d(0, ${distance}px, 0)`,
        transition: `opacity ${duration}s var(--ease-brand) ${transitionDelay}s, transform ${duration}s var(--ease-brand) ${transitionDelay}s`,
      }}
    >
      {children}
    </div>
  );
}

/** Parent for groups that should stagger their children into view. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  amount = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  amount?: number;
}) {
  const { reduced } = useMotionPreference();
  const ref = React.useRef<HTMLDivElement>(null);
  const shown = useRevealed(ref, amount, "0px 0px -60px 0px");
  const indexRef = React.useRef(0);
  indexRef.current = 0; // reset before children render so indices follow tree order

  const value = React.useMemo<RevealGroupState>(
    () => ({
      shown,
      reduced,
      stagger,
      takeIndex: () => indexRef.current++,
    }),
    [shown, reduced, stagger],
  );

  return (
    <RevealGroupContext.Provider value={value}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </RevealGroupContext.Provider>
  );
}

/** Child item for <RevealGroup> — fades/slides in with a staggered delay. */
export function RevealItem({
  children,
  className,
  y = 26,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
}) {
  const { reduced } = useMotionPreference();
  const group = React.useContext(RevealGroupContext);

  // Outside a group observe independently so a lone item can never stay invisible.
  const fallbackRef = React.useRef<HTMLDivElement>(null);
  const fallbackShown = useRevealed(fallbackRef, 0.15, "0px 0px -60px 0px");
  const shown = group ? group.shown : fallbackShown;
  const index = group ? group.takeIndex() : 0;

  const delay = group && !group.reduced ? 0.05 + index * group.stagger : 0;
  const duration = group?.reduced || reduced ? 0.2 : 0.6;
  const distance = reduced ? 0 : y;

  return (
    <div
      ref={group ? undefined : fallbackRef}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translate3d(0, ${distance}px, 0)`,
        transition: `opacity ${duration}s var(--ease-brand) ${delay}s, transform ${duration}s var(--ease-brand) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
