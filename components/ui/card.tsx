import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4 shadow-card sm:p-5",
        className
      )}
      {...props}
    />
  );
}

export function CardLabel({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs font-medium uppercase tracking-wide text-muted", className)}
      {...props}
    />
  );
}

export function CardValue({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("tabular mt-1 text-2xl font-medium text-ink", className)}
      {...props}
    />
  );
}
