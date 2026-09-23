import { Cookie, X } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NOTICE_KEY = "dangbu.privacyNotice.v1";

/**
 * Storage notice (GDPR/RA 10173 style). This site uses NO tracking
 * cookies — only strictly necessary browser storage (staff session,
 * offline reservation drafts) — so a single acknowledgement is enough.
 */
export function CookieNotice() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(NOTICE_KEY) !== "acknowledged");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const acknowledge = () => {
    try {
      window.localStorage.setItem(NOTICE_KEY, "acknowledged");
    } catch {
      /* storage unavailable — the notice simply reappears next visit */
    }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Privacy notice"
      className="fixed inset-x-3 bottom-3 z-[90] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-md"
    >
      <div className="panel flex flex-col gap-3 border-brass/30 p-4 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.85)]">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-brass/40 bg-ink text-brass">
            <Cookie className="size-4" aria-hidden="true" />
          </span>
          <p className="text-[0.78rem] leading-relaxed text-bone-dim">
            <strong className="text-bone">No tracking cookies here.</strong> We only use essential
            browser storage to keep your reservation and (for staff) your sign-in session working.
            Details in our{" "}
            <Link to="/privacy" className="text-brass underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={acknowledge} aria-label="Dismiss privacy notice">
            <X className="size-3.5" aria-hidden="true" />
          </Button>
          <Button variant="brass" size="sm" onClick={acknowledge}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
