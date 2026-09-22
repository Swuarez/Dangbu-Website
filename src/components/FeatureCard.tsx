import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  detail?: string;
}

/** Single experience feature card with a brass icon plate. */
export function FeatureCard({ feature, className }: { feature: FeatureItem; className?: string }) {
  const Icon = feature.icon;

  return (
    <article
      className={cn(
        "panel panel-hover group flex h-full flex-col gap-3 p-5 sm:p-6",
        "hover:-translate-y-1",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-11 place-items-center rounded-xl border border-brass/35 bg-[linear-gradient(160deg,rgba(231,178,76,0.2),rgba(225,34,31,0.16))] text-brass transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105"
      >
        <Icon className="size-5" />
      </span>

      <h3 className="display-md text-bone">{feature.title}</h3>

      <p className="copy-sm">{feature.description}</p>

      {feature.detail ? (
        <p className="mt-auto pt-2 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-brass/75">
          {feature.detail}
        </p>
      ) : null}
    </article>
  );
}
