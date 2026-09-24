import { useState } from "react";
import { Link } from "react-router-dom";
import { OverviewLineChart, PeriodTabs } from "../components/Charts";
import { DataImportCard } from "../components/DataImportCard";
import { InsightsSection } from "../components/InsightsSection";
import { Button } from "../components/ui";
import {
  buildOverview,
  type DashboardData,
  type PeriodMode,
} from "../lib/data";
import { buildInsights, buildUnitEconomics } from "../lib/insights";
import { formatCompactRsd, formatHours, formatMoney, cn } from "../lib/utils";

function MiniStat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "bad" | "accent" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-[var(--good)]"
      : tone === "bad"
        ? "text-[var(--danger)]"
        : tone === "accent"
          ? "text-[var(--accent)]"
          : tone === "warn"
            ? "text-amber-700"
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
      {sub ? <p className="truncate text-[10px] text-[var(--muted)]">{sub}</p> : null}
    </div>
  );
}

function SplitBar({ radnici, ostalo, neto }: { radnici: number; ostalo: number; neto: number }) {
  const labor = Math.max(0, radnici);
  const other = Math.max(0, ostalo);
  const keep = Math.max(0, neto);
  const sum = labor + other + keep;
  if (!sum) return null;
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
      {labor > 0 ? <div className="h-full bg-rose-500" style={{ width: `${(labor / sum) * 100}%` }} /> : null}
      {other > 0 ? <div className="h-full bg-slate-400" style={{ width: `${(other / sum) * 100}%` }} /> : null}
      {keep > 0 ? <div className="h-full bg-emerald-600" style={{ width: `${(keep / sum) * 100}%` }} /> : null}
    </div>
  );
}

const PERIOD_HINT: Record<PeriodMode, string> = {
  ukupno: "Svi unosi",
  nedeljno: "Ova nedelja",
  mesecno: "Ovaj mesec",
  godisnje: "Ova godina",
};

export function HomePage({
  data,
  onChange,
}: {
  data: DashboardData;
  onChange: () => Promise<void>;
}) {
  const [period, setPeriod] = useState<PeriodMode>("ukupno");
  const overview = buildOverview(data, period);
  const insights = buildInsights(data);
  const unit = buildUnitEconomics(
    overview.prodaja,
    overview.troskovi,
    overview.radnici,
    overview.hours,
    overview.days,
  );

  return (
    <div className="w-full min-w-0 max-w-full space-y-3">
      <section className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            Pregled
          </h1>
          <p className="text-xs text-[var(--muted)]">
            {PERIOD_HINT[period]}
          </p>
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

      <PeriodTabs value={period} onChange={setPeriod} />

      <section className="grid grid-cols-2 gap-2">
        <MiniStat
          label="Prodaja"
          value={formatCompactRsd(overview.prodaja)}
          tone="accent"
        />
        <MiniStat
          label="Troškovi"
          value={formatCompactRsd(overview.troskovi)}
        />
        <MiniStat
          label="Radnici"
          value={formatCompactRsd(overview.radnici)}
          tone="warn"
        />
        <MiniStat
          label="Neto zarada"
          value={formatCompactRsd(overview.neto)}
          tone={overview.neto >= 0 ? "good" : "bad"}
        />
        <MiniStat
          label="Radnici na 100 RSD"
          value={unit.per100 ? `${Math.round(unit.per100.radnici)} RSD` : "—"}
          sub="od svakih 100 prodaje"
          tone="warn"
        />
        <MiniStat
          label="Tebi na 100 RSD"
          value={unit.per100 ? `${Math.round(unit.per100.neto)} RSD` : "—"}
          sub="od svakih 100 prodaje"
          tone={unit.per100 && unit.per100.neto >= 0 ? "good" : "bad"}
        />
        <MiniStat
          label="Radnici po satu"
          value={unit.perHour ? formatMoney(unit.perHour.radnici) : "—"}
          sub={
            unit.perHour
              ? `${formatHours(unit.perHour.hours)} · ranije 1.000 RSD/h`
              : "nema sati ni isplata"
          }
          tone="warn"
        />
        <MiniStat
          label="Ti po satu rada"
          value={unit.perHour ? formatMoney(unit.perHour.neto) : "—"}
          sub={unit.perHour ? "po satu jednog radnika" : "nema sati ni isplata"}
          tone={unit.perHour && unit.perHour.neto >= 0 ? "good" : "bad"}
        />
        <MiniStat
          label="Ti po satu (2 radnika)"
          value={unit.perHourCrew != null ? formatMoney(unit.perHourCrew) : "—"}
          sub="kad rade dvojica odjednom"
          tone={unit.perHourCrew != null && unit.perHourCrew >= 0 ? "good" : "bad"}
        />
        <MiniStat
          label="Prosečan dnevni neto"
          value={unit.avgDaily ? formatMoney(unit.avgDaily.neto) : "—"}
          sub={unit.avgDaily ? `${unit.avgDaily.days} dana u periodu` : "nema perioda"}
          tone={unit.avgDaily && unit.avgDaily.neto >= 0 ? "good" : "bad"}
        />
      </section>

      {unit.per100 ? (
        <div className="space-y-1">
          <SplitBar
            radnici={unit.per100.radnici}
            ostalo={unit.per100.ostalo}
            neto={unit.per100.neto}
          />
          <p className="text-[10px] text-[var(--muted)]">
            Na 100 RSD prodaje: {Math.round(unit.per100.radnici)} radnici ·{" "}
            {Math.round(unit.per100.ostalo)} ostalo · {Math.round(unit.per100.neto)} tebi
          </p>
        </div>
      ) : null}

      <OverviewLineChart series={overview.series} />

      {insights ? <InsightsSection insights={insights} /> : null}

      <DataImportCard
        hasImported={
          data.incomes.some((i) => i.importKey) || data.expenses.some((e) => e.importKey)
        }
        onChange={onChange}
      />
    </div>
  );
}
