import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "bg-brand-card border border-brand-border rounded-card shadow-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
