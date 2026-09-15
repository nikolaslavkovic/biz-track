import Link from "next/link";
import { FinanceCharts, HallCharts } from "@/components/finance-charts";
import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/analytics";
import {
  EXPENSE_CATEGORIES,
  formatDate,
  formatDimensions,
  formatHours,
  formatMoney,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const {
    summary,
    series,
    recentExpenses,
    recentWork,
    activeProjects,
    hallStats,
  } = await getDashboardData();

  const categoryLabel = (value: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink)] px-6 py-8 text-[var(--bg)] sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(120deg, transparent 0%, rgba(15,118,110,0.45) 45%, transparent 70%), radial-gradient(circle at 80% 20%, rgba(29,78,137,0.4), transparent 40%)",
          }}
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/90">
            FirmaRačun
          </p>
          <h1 className="mt-2 max-w-2xl font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl">
            Pregled firme na jednom mestu
          </h1>
          <p className="mt-3 max-w-xl text-sm text-stone-300 sm:text-base">
            Unosite troškove, materijal, mesečne račune i radne sate — aplikacija
            računa neto zaradu i satnicu, i čuva istoriju mesecima unazad.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/troskovi">
              <Button className="bg-teal-600 hover:bg-teal-500 text-white">
                Dodaj trošak
              </Button>
            </Link>
            <Link href="/radnici">
              <Button
                variant="secondary"
                className="border-stone-600 bg-stone-800 text-stone-100 hover:bg-stone-700"
              >
                Unesi radne sate
              </Button>
            </Link>
            <Link href="/projekti">
              <Button
                variant="outline"
                className="border-stone-500 text-stone-100 hover:bg-stone-800"
              >
                Projekti
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ukupna prodajna cena"
          value={formatMoney(summary.revenue)}
          hint="Sve hale / konstrukcije"
          tone="accent"
        />
        <StatCard
          label="Ukupni troškovi"
          value={formatMoney(summary.totalCosts)}
          hint="Materijal + mesečni + rad"
        />
        <StatCard
          label="Neto zarada"
          value={formatMoney(summary.netProfit)}
          hint="Zarada − troškovi"
          tone={summary.netProfit >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="Neto po satu"
          value={formatMoney(summary.netPerHour)}
          hint={`${formatHours(summary.totalHours)} ukupno`}
          tone={summary.netPerHour >= 0 ? "good" : "bad"}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Materijal
          </p>
          <p className="mt-1 text-xl font-semibold">
            {formatMoney(summary.materialCost)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Mesečni troškovi
          </p>
          <p className="mt-1 text-xl font-semibold">
            {formatMoney(summary.monthlyCost)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Trošak rada (iz sati)
          </p>
          <p className="mt-1 text-xl font-semibold">
            {formatMoney(summary.laborFromLogs)}
          </p>
        </Card>
      </section>

      <FinanceCharts series={series} />

      <HallCharts byWidth={hallStats.byWidth} bySize={hallStats.bySize} />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Aktivne hale
            </h2>
            <Link
              href="/projekti"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Svi
            </Link>
          </div>
          {activeProjects.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nema aktivnih projekata.</p>
          ) : (
            <ul className="space-y-3">
              {activeProjects.map((p) => (
                <li
                  key={p.id}
                  className="border-b border-[var(--line)] pb-3 last:border-0 last:pb-0"
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDimensions(p.lengthM, p.widthM, p.heightM)}
                    {p.client ? ` · ${p.client}` : ""}
                  </p>
                  <p className="text-sm text-[var(--accent)]">
                    {formatMoney(p.revenue)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-1">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
            Poslednji troškovi
          </h2>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Još nema unosa.</p>
          ) : (
            <ul className="space-y-3">
              {recentExpenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start justify-between gap-2 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {e.subcategory || categoryLabel(e.category)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatDate(e.date)} · {categoryLabel(e.category)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{formatMoney(e.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-1">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
            Poslednji radni sati
          </h2>
          {recentWork.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Još nema unosa.</p>
          ) : (
            <ul className="space-y-3">
              {recentWork.map((w) => (
                <li
                  key={w.id}
                  className="flex items-start justify-between gap-2 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{w.workerName}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatDate(w.date)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{formatHours(w.hours)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
