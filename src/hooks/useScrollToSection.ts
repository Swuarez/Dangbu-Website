import { useCallback } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Smoothly scrolls to a section id, swaps focus for keyboard/AT users and
 * stays inside the reduced-motion contract. Returns false if the target
 * is not on the current page.
 */
export function useScrollToSection() {
  const reduceMotion = useReducedMotion();

  return useCallback(
    (id: string): boolean => {
      const target = document.getElementById(id);
      if (!target) return false;

      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });

      window.setTimeout(
        () => {
          try {
            target.focus({ preventScroll: true });
          } catch {
            /* focus is best-effort only */
          }
        },
        reduceMotion ? 0 : 420,
      );

      return true;
    },
    [reduceMotion],
  );
}
