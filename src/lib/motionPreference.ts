/* ============================================================
   Motion preference
   ------------------------------------------------------------
   The OS/browser "reduce motion" setting is respected by default:

     - Windows: Settings → Accessibility → Visual effects → Animation effects
     - macOS:   System Settings → Accessibility → Display → Reduce motion

   Many users (and most performance-tuned PCs) turn that off for reasons
   unrelated to accessibility, and then wonder why a site looks static.
   So an explicit in-app choice can override the OS default. The choice is
   remembered per browser and applied as <html data-motion="full|reduced">,
   which keeps CSS animations and JS animations (motion/react) in agreement.
   ============================================================ */

export type MotionMode = "auto" | "full" | "reduced";

const STORAGE_KEY = "dangbu.motion";

/** Cycle order used by the footer control. */
export const MOTION_CYCLE: readonly MotionMode[] = ["auto", "full", "reduced"];

export function systemPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function readMotionMode(): MotionMode {
  if (typeof window === "undefined") return "auto";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "full" || stored === "reduced" ? stored : "auto";
  } catch {
    return "auto";
  }
}

export function writeMotionMode(mode: MotionMode): void {
  try {
    if (mode === "auto") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage unavailable — the choice simply won't persist */
  }
}

/** Effective answer to "should animations be toned down right now?". */
export function resolveReducedMotion(
  mode: MotionMode,
  systemReduced: boolean = systemPrefersReducedMotion(),
): boolean {
  if (mode === "full") return false;
  if (mode === "reduced") return true;
  return systemReduced;
}

/** Mirrors the resolved preference onto <html> for the CSS rules in index.css. */
export function applyMotionAttribute(reduced: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.motion = reduced ? "reduced" : "full";
}
