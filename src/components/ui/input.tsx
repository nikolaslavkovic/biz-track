import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    className={cn(
      "flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
      className,
    )}
    ref={ref}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
