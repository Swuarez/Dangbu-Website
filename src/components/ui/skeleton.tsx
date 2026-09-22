import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-xl bg-[linear-gradient(90deg,rgba(48,36,32,0.55),rgba(231,178,76,0.14),rgba(48,36,32,0.55))] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
