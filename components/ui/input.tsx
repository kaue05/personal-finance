import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("mb-1.5 block text-sm font-medium text-ink", className)} {...props} />
  )
);
Label.displayName = "Label";
