import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-bone/12 bg-ink-soft/80 px-4 text-[0.95rem] text-bone shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors duration-200 placeholder:text-ash-text/80 hover:border-bone/20 focus-visible:border-brass/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/35 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive/70 aria-invalid:ring-2 aria-invalid:ring-destructive/25";

const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(fieldBase, "h-12", className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentPropsWithoutRef<"textarea">>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(fieldBase, "min-h-28 resize-y py-3 leading-relaxed", className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Input, Textarea, fieldBase };
