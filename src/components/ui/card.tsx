import { cn } from "@/lib/utils";

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
        "rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]",
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
      <p className={cn("mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl", toneClass)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p> : null}
    </Card>
  );
}
