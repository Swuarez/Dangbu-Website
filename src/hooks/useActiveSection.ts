import { useEffect, useState } from "react";

/**
 * Tracks which page section owns the viewport so the navbar can highlight
 * the active link. Pass a module-level (stable) array of element ids.
 */
export function useActiveSection(sectionIds: readonly string[]): string {
  const [active, setActive] = useState<string>(sectionIds[0] ?? "");

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0 || typeof IntersectionObserver === "undefined") return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let bestId = "";
        let bestRatio = 0;

        for (const id of sectionIds) {
          const ratio = ratios.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }

        if (bestId) setActive(bestId);
      },
      { rootMargin: "-18% 0px -58% 0px", threshold: [0, 0.15, 0.4, 0.75, 1] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sectionIds]);

  return active;
}
