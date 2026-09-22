import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em] transition-colors",
  {
    variants: {
      variant: {
        brass: "border-brass/45 bg-brass/12 text-brass-light",
        ember: "border-ember/55 bg-ember/18 text-[#ffd9cf]",
        outline: "border-bone/20 bg-bone/[0.03] text-bone-dim",
        solid: "border-transparent bg-[linear-gradient(180deg,var(--color-brass-light),var(--color-brass-deep))] text-[#1b1306]",
        unlimited:
          "border-transparent bg-[linear-gradient(180deg,var(--color-ember-bright),var(--color-ember-deep))] text-white shadow-[0_10px_24px_-14px_rgba(225,34,31,0.95)]",
      },
    },
    defaultVariants: { variant: "brass" },
  },
);

export interface BadgeProps
  extends React.ComponentPropsWithoutRef<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
