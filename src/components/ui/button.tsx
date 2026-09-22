import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans font-semibold uppercase tracking-[0.16em] transition-[transform,box-shadow,background-color,border-color,color,filter] duration-300 ease-[cubic-bezier(.22,1,.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ember:
          "bg-[linear-gradient(180deg,var(--color-ember-bright)_0%,var(--color-ember)_45%,var(--color-ember-deep)_100%)] text-white shadow-[0_18px_42px_-20px_rgba(225,34,31,0.9)] hover:shadow-[0_22px_54px_-18px_rgba(255,74,52,0.95)] hover:brightness-[1.08] active:scale-[0.985]",
        brass:
          "bg-[linear-gradient(180deg,var(--color-brass-light)_0%,var(--color-brass)_52%,var(--color-brass-deep)_100%)] text-[#1b1306] shadow-[0_16px_36px_-20px_rgba(231,178,76,0.85)] hover:brightness-[1.05] active:scale-[0.985]",
        outline:
          "border border-brass/45 bg-bone/[0.02] text-bone hover:border-brass hover:bg-brass/10 active:scale-[0.985]",
        glass:
          "border border-bone/15 bg-ink/45 text-bone backdrop-blur-md hover:border-brass/45 hover:bg-ink/70",
        ghost: "text-bone-dim hover:bg-bone/[0.07] hover:text-bone",
        link: "text-brass underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-[0.68rem]",
        default: "h-11 px-6 text-[0.74rem]",
        lg: "h-12 px-7 text-[0.8rem] sm:h-13",
        xl: "h-13 px-8 text-[0.82rem] sm:h-14 sm:text-[0.86rem]",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "ember", size: "default" },
  },
);

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
