import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "group flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-bone/12 bg-ink-soft/80 px-4 text-left text-[0.95rem] text-bone transition-colors duration-200",
      "hover:border-bone/25 focus-visible:border-brass/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/35",
      "disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive/70 aria-invalid:ring-2 aria-invalid:ring-destructive/25",
      "data-[placeholder]:text-ash-text/85 [&>span]:min-w-0 [&>span]:truncate",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        aria-hidden="true"
        className="size-4 shrink-0 text-brass/75 transition-transform duration-300 group-data-[state=open]:rotate-180"
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        "relative z-[120] max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-brass/25 bg-popover text-bone shadow-[0_34px_80px_-32px_rgba(0,0,0,0.95)]",
        "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
        position === "popper" &&
          "w-full data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-brass/70">
        <ChevronDown className="size-3.5 rotate-180" aria-hidden="true" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-brass/70">
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-2 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-ash-text",
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg py-2.5 pl-3 pr-9 text-[0.92rem] leading-snug text-bone-dim outline-none transition-colors",
      "focus:bg-brass/12 focus:text-bone data-[highlighted]:bg-brass/12 data-[highlighted]:text-bone",
      "data-[state=checked]:bg-ember/15 data-[state=checked]:text-bone",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="absolute right-3 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4 text-brass" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1.5 my-1 h-px bg-bone/10", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
