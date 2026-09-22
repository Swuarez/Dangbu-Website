import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * shadcn-style Sheet used for the mobile navigation drawer.
 * Focus is trapped and the page behind is scroll-locked by Radix Dialog,
 * so the drawer stays keyboard accessible.
 */

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[110] bg-ink/80 backdrop-blur-sm",
      "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const sheetVariants = cva(
  "fixed z-[120] flex max-h-[100dvh] flex-col gap-4 overflow-y-auto overscroll-contain border-brass/20 bg-[linear-gradient(180deg,rgba(30,23,19,0.99)_0%,rgba(11,8,6,0.99)_100%)] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 w-[min(21rem,86vw)] border-l data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right",
        left: "inset-y-0 left-0 w-[min(21rem,86vw)] border-r data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left",
        top: "inset-x-0 top-0 max-h-[85dvh] border-b data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
        bottom:
          "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[var(--radius-brand-lg)] border-t data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  showCloseButton?: boolean;
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, showCloseButton = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      {showCloseButton ? (
        <DialogPrimitive.Close
          aria-label="Close menu"
          className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full border border-bone/15 bg-ink/70 text-bone-dim transition-colors hover:border-brass/60 hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          <X className="size-4.5" aria-hidden="true" />
        </DialogPrimitive.Close>
      ) : null}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("display-md text-bone", className)} {...props} />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("copy-sm text-bone-dim", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
