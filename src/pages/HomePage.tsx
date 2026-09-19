import { Link } from "react-router-dom";
import { FinanceCharts, HallCharts } from "../components/Charts";
import { Button, Card, StatCard } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  EXPENSE_CATEGORIES,
  formatDate,
  formatDimensions,
  formatHours,
  formatMoney,
  formatSalePrice,
} from "../lib/utils";

export function HomePage({ data }: { data: DashboardData }) {
  const { summary, series, hallStats, projects, expenses, workLogs, workers, eurToRsd } =
    data;
  const active = projects.filter((p) => p.status === "aktivan");
  const workerName = (id: number) =>
    workers.find((w) => w.id === id)?.name ?? "—";
  const categoryLabel = (value: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink)] px-4 py-6 text-[var(--bg)] sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(120deg, transparent 0%, rgba(15,118,110,0.45) 45%, transparent 70%), radial-gradient(circle at 80% 20%, rgba(29,78,137,0.4), transparent 40%)",
          }}
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/90">
            FirmaRačun · web
          </p>
          <h1 className="mt-2 max-w-2xl font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            Pregled firme
          </h1>
          <p className="mt-3 max-w-xl text-sm text-stone-300">
            Unosi se pamte u ovom browseru (nema posebne baze za podesiti). Radi
            i offline posle prvog otvaranja.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/troskovi">
              <Button className="bg-teal-600 text-white hover:bg-teal-500">
                Dodaj trošak
              </Button>
            </Link>
            <Link to="/radnici">
              <Button
                variant="secondary"
                className="border-stone-600 bg-stone-800 text-stone-100 hover:bg-stone-700"
              >
                Nedeljni sati
              </Button>
            </Link>
            <Link to="/projekti">
              <Button
                variant="outline"
                className="border-stone-500 text-stone-100 hover:bg-stone-800"
              >
                Hale
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Prodajna cena (RSD)"
          value={formatMoney(summary.revenue)}
          hint={`Kurs 1 EUR = ${eurToRsd} RSD`}
          tone="accent"
        />
        <StatCard label="Ukupni troškovi" value={formatMoney(summary.totalCosts)} />
        <StatCard
          label="Neto"
          value={formatMoney(summary.netProfit)}
          tone={summary.netProfit >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="Neto po satu"
          value={formatMoney(summary.netPerHour)}
          hint={formatHours(summary.totalHours)}
          tone={summary.netPerHour >= 0 ? "good" : "bad"}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Materijal</p>
          <p className="mt-1 text-xl font-semibold">{formatMoney(summary.materialCost)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Mesečni</p>
          <p className="mt-1 text-xl font-semibold">{formatMoney(summary.monthlyCost)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Trošak rada</p>
          <p className="mt-1 text-xl font-semibold">{formatMoney(summary.laborFromLogs)}</p>
        </Card>
      </section>

      <FinanceCharts series={series} />
      <HallCharts byWidth={hallStats.byWidth} bySize={hallStats.bySize} />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
            Aktivne hale
          </h2>
          {active.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nema aktivnih.</p>
          ) : (
            <ul className="space-y-3">
              {active.map((p) => (
                <li key={p.id} className="border-b border-[var(--line)] pb-3 last:border-0">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDimensions(p.lengthM, p.widthM, p.heightM)}
                  </p>
                  <p className="text-sm text-[var(--accent)]">
                    {formatSalePrice(p.revenue, p.revenueCurrency, eurToRsd)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
            Poslednji troškovi
          </h2>
          <ul className="space-y-3">
            {expenses.slice(0, 6).map((e) => (
              <li key={e.id} className="flex justify-between gap-2 border-b border-[var(--line)] pb-3 last:border-0">
                <div>
                  <p className="font-medium">{e.subcategory || categoryLabel(e.category)}</p>
                  <p className="text-xs text-[var(--muted)]">{formatDate(e.date)}</p>
                </div>
                <p className="font-semibold">{formatMoney(e.amount)}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
            Poslednji sati
          </h2>
          <ul className="space-y-3">
            {workLogs.slice(0, 6).map((w) => (
              <li key={w.id} className="flex justify-between gap-2 border-b border-[var(--line)] pb-3 last:border-0">
                <div>
                  <p className="font-medium">{workerName(w.workerId)}</p>
                  <p className="text-xs text-[var(--muted)]">{formatDate(w.date)}</p>
                </div>
                <p className="font-semibold">{formatHours(w.hours)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
