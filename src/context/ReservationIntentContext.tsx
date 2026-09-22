import * as React from "react";
import { useScrollToSection } from "@/hooks/useScrollToSection";

/**
 * Small event bus that lets any CTA ("RESERVE HERE", "RESERVE THIS PACKAGE")
 * pre-fill the booking form and jump the guest straight to the reservation
 * section — without prop-drilling through the whole page.
 */

export interface ReservationIntent {
  branchId?: string;
  packageId?: string;
  /** Increments on every request so repeated clicks are still observed. */
  nonce: number;
}

interface ReservationIntentContextValue {
  intent: ReservationIntent | null;
  requestReservation: (intent?: Omit<ReservationIntent, "nonce">) => void;
  clearIntent: () => void;
}

const ReservationIntentContext = React.createContext<ReservationIntentContextValue | null>(null);

export function ReservationIntentProvider({ children }: { children: React.ReactNode }) {
  const [intent, setIntent] = React.useState<ReservationIntent | null>(null);
  const scrollToSection = useScrollToSection();

  const requestReservation = React.useCallback<ReservationIntentContextValue["requestReservation"]>(
    (next) => {
      setIntent({ ...next, nonce: Date.now() });

      window.requestAnimationFrame(() => {
        const scrolled = scrollToSection("reservation");
        if (!scrolled) window.location.assign("/#reservation");
      });
    },
    [scrollToSection],
  );

  const clearIntent = React.useCallback(() => setIntent(null), []);

  const value = React.useMemo(
    () => ({ intent, requestReservation, clearIntent }),
    [intent, requestReservation, clearIntent],
  );

  return (
    <ReservationIntentContext.Provider value={value}>
      {children}
    </ReservationIntentContext.Provider>
  );
}

export function useReservationIntent(): ReservationIntentContextValue {
  const context = React.useContext(ReservationIntentContext);

  if (!context) {
    throw new Error("useReservationIntent must be used inside <ReservationIntentProvider>.");
  }

  return context;
}
