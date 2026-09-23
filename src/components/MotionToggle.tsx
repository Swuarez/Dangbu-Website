import { Sparkles, Waves, Zap } from "lucide-react";
import { useMotionPreference } from "@/context/MotionPreferenceContext";
import type { MotionMode } from "@/lib/motionPreference";
import { cn } from "@/lib/utils";

/* ============================================================
   Footer motion control.
   Auto = follow the OS setting (default), Full = always animate,
   Reduced = never animate. One click, remembered per browser.
   ============================================================ */

const ORDER: MotionMode[] = ["auto", "full", "reduced"];

const LABEL: Record<MotionMode, string> = {
  auto: "Motion: Auto",
  full: "Motion: Full",
  reduced: "Motion: Reduced",
};

const HINT: Record<MotionMode, string> = {
  auto: "Following your device setting. Click to force animations on.",
  full: "Animations always on. Click to switch to reduced motion.",
  reduced: "Animations off. Click to follow your device setting again.",
};

function ModeIcon({ mode }: { mode: MotionMode }) {
  const className = "size-3.5 shrink-0";
  if (mode === "full") return <Zap className={className} aria-hidden="true" />;
  if (mode === "reduced") return <Waves className={className} aria-hidden="true" />;
  return <Sparkles className={className} aria-hidden="true" />;
}

export function MotionToggle({ className }: { className?: string }) {
  const { mode, setMode, canEnableAnimations } = useMotionPreference();

  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      title={canEnableAnimations ? `${LABEL[mode]} — ${HINT[mode]} (your system asks for reduced motion)` : HINT[mode]}
      aria-label={`${LABEL[mode]}. Activate to use ${LABEL[next]}.`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-bone/12 px-3 py-1.5 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ash-text/70 transition-colors hover:border-brass/45 hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass",
        canEnableAnimations && "border-brass/45 text-brass",
        className,
      )}
    >
      <ModeIcon mode={mode} />
      {LABEL[mode]}
    </button>
  );
}
