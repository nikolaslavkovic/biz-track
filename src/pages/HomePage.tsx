import { Link } from "react-router-dom";
import { FinanceCharts, HallCharts } from "../components/Charts";
import { Button, Card } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  EXPENSE_CATEGORIES,
  formatDate,
  formatDimensions,
  formatHours,
  formatCompactRsd,
  formatSalePrice,
  cn,
} from "../lib/utils";

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
    <div className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2 sm:px-3 sm:py-3">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[var(--muted)] sm:text-xs">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 break-words font-[family-name:var(--font-display)] text-base font-semibold leading-tight sm:text-xl",
          toneClass,
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[10px] text-[var(--muted)] sm:text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export function HomePage({ data }: { data: DashboardData }) {
  const { summary, series, hallStats, projects, expenses, workLogs, workers, eurToRsd } =
    data;
  const active = projects.filter((p) => p.status === "aktivan");
  const workerName = (id: number) =>
    workers.find((w) => w.id === id)?.name ?? "—";
  const categoryLabel = (value: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 sm:space-y-6">
      {/* Kompaktan header + brzi linkovi */}
      <section className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight sm:text-3xl">
            Pregled
          </h1>
          <p className="text-xs text-[var(--muted)] sm:text-sm">
            Kurs 1 EUR = {eurToRsd} RSD
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Link to="/troskovi">
            <Button size="sm" className="px-2.5 text-xs sm:px-3 sm:text-sm">
              + Trošak
            </Button>
          </Link>
          <Link to="/radnici">
            <Button size="sm" variant="secondary" className="px-2.5 text-xs sm:px-3 sm:text-sm">
              Sati
            </Button>
          </Link>
        </div>
      </section>

      {/* Glavne brojke — 2×2 na telefonu */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
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

      {/* Razrada troškova — jedna linija */}
      <section className="grid grid-cols-3 gap-2">
        <MiniStat label="Materijal" value={formatCompactRsd(summary.materialCost)} />
        <MiniStat label="Mesečni" value={formatCompactRsd(summary.monthlyCost)} />
        <MiniStat label="Rad" value={formatCompactRsd(summary.laborFromLogs)} />
      </section>

      <FinanceCharts series={series} />
      <HallCharts byWidth={hallStats.byWidth} bySize={hallStats.bySize} />

      {/* Liste — kraće, manje razmaka */}
      <section className="grid gap-2 sm:gap-3 lg:grid-cols-3">
        <Card className="!p-3">
          <h2 className="mb-2 text-sm font-semibold">Aktivne hale</h2>
          {active.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">Nema aktivnih.</p>
          ) : (
            <ul className="space-y-2">
              {active.slice(0, 4).map((p) => (
                <li
                  key={p.id}
                  className="flex items-baseline justify-between gap-2 border-b border-[var(--line)] pb-2 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-[10px] text-[var(--muted)]">
                      {formatDimensions(p.lengthM, p.widthM, p.heightM)}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-medium text-[var(--accent)]">
                    {formatSalePrice(p.revenue, p.revenueCurrency, eurToRsd)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="!p-3">
          <h2 className="mb-2 text-sm font-semibold">Poslednji troškovi</h2>
          <ul className="space-y-2">
            {expenses.slice(0, 4).map((e) => (
              <li
                key={e.id}
                className="flex justify-between gap-2 border-b border-[var(--line)] pb-2 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {e.subcategory || categoryLabel(e.category)}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">{formatDate(e.date)}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold">{formatCompactRsd(e.amount)}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="!p-3">
          <h2 className="mb-2 text-sm font-semibold">Poslednji sati</h2>
          <ul className="space-y-2">
            {workLogs.slice(0, 4).map((w) => (
              <li
                key={w.id}
                className="flex justify-between gap-2 border-b border-[var(--line)] pb-2 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{workerName(w.workerId)}</p>
                  <p className="text-[10px] text-[var(--muted)]">{formatDate(w.date)}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold">{formatHours(w.hours)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
