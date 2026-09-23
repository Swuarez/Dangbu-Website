import * as React from "react";
import {
  applyMotionAttribute,
  readMotionMode,
  resolveReducedMotion,
  systemPrefersReducedMotion,
  writeMotionMode,
  type MotionMode,
} from "@/lib/motionPreference";

/* ============================================================
   Motion preference context.
   Components ask this instead of motion/react's useReducedMotion()
   so the visitor's explicit choice (footer control) and the OS
   setting resolve in one place — and so CSS matches JS.
   ============================================================ */

export interface MotionPreference {
  /** Stored choice: auto (follow the OS), full, or reduced. */
  mode: MotionMode;
  /** Whether animations should be toned down right now. */
  reduced: boolean;
  /** True when the system (not the visitor) is asking for reduced motion. */
  systemReduced: boolean;
  /** True when the visitor could enable animations with one click. */
  canEnableAnimations: boolean;
  setMode: (mode: MotionMode) => void;
}

const MotionPreferenceContext = React.createContext<MotionPreference | null>(null);

// Applied at import time (before React paints) so a stored "full" choice beats
// an OS-level reduced-motion setting without a visible flash of static content.
applyMotionAttribute(resolveReducedMotion(readMotionMode()));

export function MotionPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<MotionMode>(() => readMotionMode());
  const [systemReduced, setSystemReduced] = React.useState(() => systemPrefersReducedMotion());

  // Follow the OS setting live — visitors can change it without a reload.
  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setSystemReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const reduced = resolveReducedMotion(mode, systemReduced);

  React.useEffect(() => {
    applyMotionAttribute(reduced);
  }, [reduced]);

  const setMode = React.useCallback((next: MotionMode) => {
    setModeState(next);
    writeMotionMode(next);
  }, []);

  const value = React.useMemo<MotionPreference>(
    () => ({
      mode,
      reduced,
      systemReduced,
      canEnableAnimations: mode === "auto" && systemReduced,
      setMode,
    }),
    [mode, reduced, systemReduced, setMode],
  );

  return (
    <MotionPreferenceContext.Provider value={value}>{children}</MotionPreferenceContext.Provider>
  );
}

export function useMotionPreference(): MotionPreference {
  const context = React.useContext(MotionPreferenceContext);
  if (!context) {
    throw new Error("useMotionPreference must be used within MotionPreferenceProvider");
  }
  return context;
}
