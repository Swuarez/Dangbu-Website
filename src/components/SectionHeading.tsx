import * as React from "react";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

/** Shared section heading: eyebrow → rule → display title → description. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleClassName,
  actions,
  headingId,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  actions?: React.ReactNode;
  headingId?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        centered ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow ? (
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-brass/70" />
            {eyebrow}
            {centered ? <span aria-hidden="true" className="h-px w-8 bg-brass/70" /> : null}
          </p>
        </Reveal>
      ) : null}

      <Reveal delay={0.06}>
        <h2
          id={headingId}
          className={cn(
            "display-lg max-w-[22ch]",
            centered && "mx-auto max-w-[26ch]",
            titleClassName,
          )}
        >
          {title}
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <div className={cn("rule-brass w-40", centered && "mx-auto w-56")} />
      </Reveal>

      {description ? (
        <Reveal delay={0.14}>
          <div className={cn("copy max-w-[62ch]", centered && "mx-auto")}>{description}</div>
        </Reveal>
      ) : null}

      {actions ? (
        <Reveal delay={0.18}>
          <div className={cn("flex flex-wrap gap-3", centered && "justify-center")}>{actions}</div>
        </Reveal>
      ) : null}
    </div>
  );
}
