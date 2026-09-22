import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "flex items-center gap-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-bone-dim",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
