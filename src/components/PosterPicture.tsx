import * as React from "react";
import { posterSrcSet } from "@/lib/posters";

/**
 * Official menu poster in modern formats with the original JPEG as fallback:
 *
 *   <source type="image/avif" srcset="…480w, …768w, …1078w" sizes="…">
 *   <source type="image/webp" srcset="…480w, …768w, …1078w" sizes="…">
 *   <img src="poster.jpg" …>          ← fallback when AVIF/WebP unsupported
 *
 * Explicit width/height keep CLS at zero; `sizes` lets phones pick the 480 px
 * variant (~55 KB AVIF instead of ~340 KB JPEG).
 */
export function PosterPicture({
  image,
  alt,
  sizes,
  width = 1078,
  height = 1440,
  className,
  loading = "lazy",
  fetchPriority = "auto",
  decoding = "async",
  onError,
}: {
  image: string;
  alt: string;
  /** Responsive layout hint, e.g. "(min-width:1280px) 300px, 90vw". */
  sizes: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "auto" | "sync";
  onError?: React.ReactEventHandler<HTMLImageElement>;
}) {
  const { avif, webp } = posterSrcSet(image);

  return (
    <picture>
      {avif ? <source type="image/avif" srcSet={avif} sizes={sizes} /> : null}
      {webp ? <source type="image/webp" srcSet={webp} sizes={sizes} /> : null}
      <img
        src={image}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        onError={onError}
        className={className}
      />
    </picture>
  );
}
