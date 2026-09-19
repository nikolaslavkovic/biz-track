import { Link } from "react-router-dom";
import { FinanceCharts } from "../components/Charts";
import { Button } from "../components/ui";
import type { DashboardData } from "../lib/data";
import { formatHours, formatCompactRsd, cn } from "../lib/utils";

function MiniStat({
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
    <div className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-[family-name:var(--font-display)] text-base font-semibold leading-tight",
          toneClass,
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function HomePage({ data }: { data: DashboardData }) {
  const { summary, series, eurToRsd } = data;

  return (
    <div className="w-full min-w-0 max-w-full space-y-3">
      <section className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            Pregled
          </h1>
          <p className="text-xs text-[var(--muted)]">1 EUR = {eurToRsd} RSD</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Link to="/troskovi">
            <Button size="sm" className="px-2.5 text-xs">
              + Trošak
            </Button>
          </Link>
          <Link to="/radnici">
            <Button size="sm" variant="secondary" className="px-2.5 text-xs">
              Sati
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <MiniStat
          label="Prodaja"
          value={formatCompactRsd(summary.revenue)}
          tone="accent"
        />
        <MiniStat label="Troškovi" value={formatCompactRsd(summary.totalCosts)} />
        <MiniStat
          label="Neto"
          value={formatCompactRsd(summary.netProfit)}
          tone={summary.netProfit >= 0 ? "good" : "bad"}
        />
        <MiniStat
          label="Neto / h"
          value={formatCompactRsd(summary.netPerHour)}
          hint={formatHours(summary.totalHours)}
          tone={summary.netPerHour >= 0 ? "good" : "bad"}
        />
      </section>

      <p className="text-center text-[11px] text-[var(--muted)]">
        Materijal {formatCompactRsd(summary.materialCost)} · Mesečni{" "}
        {formatCompactRsd(summary.monthlyCost)} · Rad{" "}
        {formatCompactRsd(summary.laborFromLogs)}
      </p>

      {/* Samo jedan grafikon — neto */}
      <FinanceCharts series={series} onlyNeto />
    </div>
  );
}
