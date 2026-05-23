import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "normal" | "watch" | "flagged" | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  icon?: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  normal: "bg-brand-teal-light text-brand-teal",
  watch: "bg-brand-amber-light text-brand-amber",
  flagged: "bg-brand-coral-light text-brand-coral",
  neutral: "bg-brand-surface text-brand-muted border border-brand-border",
};

export function Badge({
  variant = "neutral",
  label,
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="inline-flex">
          {icon}
        </span>
      )}
      {label}
    </span>
  );
}
