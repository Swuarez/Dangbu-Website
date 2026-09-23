import img1 from "@/assets/img1.jpg";
import img2 from "@/assets/img2.jpg";
import img3 from "@/assets/img3.jpg";
import img4 from "@/assets/img4.jpg";

/**
 * Responsive poster variants (AVIF + WebP at 480/768/1078 px) generated from
 * the four official JPEG posters. The JPEG stays the universal fallback.
 *
 * The Lighthouse audit showed the four JPEGs were 1,315 KB of the 1,729 KB
 * page weight; a phone now downloads ~55 KB AVIF card art instead of ~340 KB.
 */

const AVIF = import.meta.glob("../assets/posters/*.avif", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

const WEBP = import.meta.glob("../assets/posters/*.webp", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

export interface PosterSrcSet {
  /** e.g. "/assets/img1-480.avif 480w, ..." — null when variants are missing. */
  avif: string | null;
  webp: string | null;
}

const WIDTHS = [480, 768, 1078];

function collect(
  map: Record<string, string>,
  ext: "avif" | "webp",
): Record<string, string> {
  const byBase: Record<string, { width: number; url: string }[]> = {};
  const pattern = new RegExp(`/\\b(img\\d)-(\\d+)\\.${ext}$`);
  for (const path of Object.keys(map)) {
    const match = pattern.exec(path);
    if (!match) continue;
    (byBase[match[1]] ??= []).push({ width: Number(match[2]), url: map[path] });
  }
  const srcSets: Record<string, string> = {};
  for (const [base, entries] of Object.entries(byBase)) {
    srcSets[base] = entries
      .sort((a, b) => a.width - b.width)
      .map((entry) => `${entry.url} ${entry.width}w`)
      .join(", ");
  }
  return srcSets;
}

const AVIF_BY_BASE = collect(AVIF, "avif");
const WEBP_BY_BASE = collect(WEBP, "webp");

/** Maps the original JPEG import (as stored on MenuPackage.image) to "img1"…". */
const BASE_BY_JPEG: Record<string, string> = {
  [img1]: "img1",
  [img2]: "img2",
  [img3]: "img3",
  [img4]: "img4",
};

/** Widths advertised in every srcset (kept for sizes hints/tests). */
export const POSTER_WIDTHS = WIDTHS;

/** Look up the AVIF/WebP srcsets for an original poster JPEG URL. */
export function posterSrcSet(jpegUrl: string): PosterSrcSet {
  const base = BASE_BY_JPEG[jpegUrl];
  if (!base) return { avif: null, webp: null };
  return {
    avif: AVIF_BY_BASE[base] ?? null,
    webp: WEBP_BY_BASE[base] ?? null,
  };
}
