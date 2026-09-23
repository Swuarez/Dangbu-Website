import { AlertTriangle, Info, Megaphone, X } from "lucide-react";
import * as React from "react";
import {
  fetchActiveAnnouncements,
  subscribeToAnnouncements,
} from "@/services/announcementService";
import type { AnnouncementType, DbAnnouncement } from "@/types/database";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "dangbu.dismissedAnnouncements";

const TYPE_STYLE: Record<AnnouncementType, string> = {
  info: "border-brass/35 bg-[linear-gradient(90deg,rgba(58,42,20,0.97),rgba(34,26,22,0.97))] text-bone",
  promo: "border-ember/40 bg-[linear-gradient(90deg,rgba(94,16,13,0.97),rgba(34,26,22,0.97))] text-bone",
  warning:
    "border-brass-light/45 bg-[linear-gradient(90deg,rgba(94,64,16,0.97),rgba(34,26,22,0.97))] text-bone",
  closure:
    "border-ember-light/50 bg-[linear-gradient(90deg,rgba(120,20,16,0.97),rgba(34,26,22,0.97))] text-bone",
};

function TypeIcon({ type }: { type: AnnouncementType }) {
  const className = "size-3.5 shrink-0 text-brass-light";
  if (type === "warning" || type === "closure")
    return <AlertTriangle className={className} aria-hidden="true" />;
  if (type === "promo") return <Megaphone className={className} aria-hidden="true" />;
  return <Info className={className} aria-hidden="true" />;
}

function readDismissed(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(DISMISS_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Only https:// or site-relative links are ever rendered. Anything else
 * (javascript:, data:, protocol-relative //) is dropped — defense in depth
 * on top of the announcements_button_url_check database constraint.
 */
function safeAnnouncementUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^\/(?!\/)/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Announcement strip pinned above the navbar on the public site.
 * Fetches once, then follows Supabase Realtime (single channel,
 * removed on unmount). Renders nothing when Supabase is not
 * configured or no announcement is active.
 */
export function AnnouncementBar() {
  const [items, setItems] = React.useState<DbAnnouncement[]>([]);
  const [dismissed, setDismissed] = React.useState<string[]>([]);

  React.useEffect(() => {
    setDismissed(readDismissed());
    let cancelled = false;

    const load = async () => {
      const next = await fetchActiveAnnouncements();
      if (!cancelled) setItems(next);
    };

    void load();
    const unsubscribe = subscribeToAnnouncements(() => void load());

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const visible = items.filter((item) => !dismissed.includes(item.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      /* sessionStorage unavailable — dismissal simply won't persist */
    }
  };

  return (
    <div role="region" aria-label="Announcements" className="relative z-[70]">
      {visible.map((item) => {
        const href = safeAnnouncementUrl(item.button_url);
        return (
        <div
          key={item.id}
          className={cn("border-b px-4 py-2 sm:px-6", TYPE_STYLE[item.type])}
        >
          <div className="shell flex items-center justify-center gap-2.5 text-center">
            <TypeIcon type={item.type} />
            <p className="min-w-0 font-sans text-[0.72rem] leading-snug tracking-[0.02em] sm:text-[0.78rem]">
              <span className="font-semibold text-brass-light">{item.title}</span>
              <span className="mx-1.5 text-bone/40" aria-hidden="true">
                ·
              </span>
              <span className="text-bone/90">{item.message}</span>
              {item.button_text && href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center rounded-full border border-brass/50 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-brass-light transition-colors hover:bg-brass hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                >
                  {item.button_text}
                </a>
              ) : null}
            </p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label={`Dismiss announcement: ${item.title}`}
              className="ml-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-bone/60 transition-colors hover:bg-bone/10 hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        );
      })}
    </div>
  );
}
