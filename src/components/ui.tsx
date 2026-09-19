import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]",
        secondary:
          "bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--surface-3)] border border-[var(--line)]",
        outline:
          "border border-[var(--line)] bg-transparent hover:bg-[var(--surface-2)]",
        ghost: "hover:bg-[var(--surface-2)]",
        danger: "bg-[var(--danger)] text-white hover:opacity-90",
      },
      size: {
        default: "min-h-12 h-12 px-4 py-2 text-base sm:min-h-10 sm:h-10 sm:text-sm",
        sm: "min-h-10 h-10 rounded-md px-3 text-sm sm:min-h-8 sm:h-8 sm:text-xs",
        lg: "min-h-12 h-12 rounded-md px-6 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "flex min-h-12 h-12 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:min-h-10 sm:h-10 sm:text-sm",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "flex min-h-12 h-12 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:min-h-10 sm:h-10 sm:text-sm",
        props.className,
      )}
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
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "bad" | "accent";
}) {
  const toneClass =
    tone === "good"
      ? "text-[var(--good)]"
      : tone === "bad"
        ? "text-[var(--danger)]"
        : tone === "accent"
          ? "text-[var(--accent)]"
          : "text-[var(--ink)]";

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] opacity-80" />
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl",
          toneClass,
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p> : null}
    </Card>
  );
}
