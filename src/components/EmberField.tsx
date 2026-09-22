import { useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Decorative ember particles + heat glow layered behind hero content. */
export function EmberField({ className, count = 16 }: { className?: string; count?: number }) {
  const embers = React.useMemo(() => {
    // Deterministic pseudo-random layout so renders stay stable.
    let seed = 20260214;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    return Array.from({ length: count }, (_, index) => ({
      id: index,
      left: 4 + random() * 92,
      size: 2 + random() * 5,
      duration: 6.5 + random() * 7,
      delay: random() * 9,
      drift: (random() - 0.5) * 90,
    }));
  }, [count]);

  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {embers.map((ember) => (
        <span
          key={ember.id}
          className="absolute bottom-0 rounded-full bg-[radial-gradient(circle,rgba(255,196,112,0.95)_0%,rgba(225,34,31,0.55)_45%,rgba(225,34,31,0)_72%)]"
          style={
            {
              left: `${ember.left}%`,
              width: `${ember.size}px`,
              height: `${ember.size}px`,
              animation: reducedMotion
                ? undefined
                : `ember-rise ${ember.duration}s linear ${ember.delay}s infinite`,
              "--ember-drift": `${ember.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
