import { useState } from "react";
import { Link } from "react-router-dom";
import { OverviewLineChart, PeriodTabs } from "../components/Charts";
import { Button } from "../components/ui";
import {
  buildOverview,
  type DashboardData,
  type PeriodMode,
} from "../lib/data";
import { formatCompactRsd, cn } from "../lib/utils";

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
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
    </div>
  );
}

const PERIOD_HINT: Record<PeriodMode, string> = {
  ukupno: "Svi unosi",
  nedeljno: "Ova nedelja",
  mesecno: "Ovaj mesec",
  godisnje: "Ova godina",
};

export function HomePage({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState<PeriodMode>("ukupno");
  const overview = buildOverview(data, period);

  return (
    <div className="w-full min-w-0 max-w-full space-y-3">
      <section className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            Pregled
          </h1>
          <p className="text-xs text-[var(--muted)]">
            {PERIOD_HINT[period]} · 1 EUR = {data.eurToRsd} RSD
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
      </section>

      <OverviewLineChart series={overview.series} />
    </div>
  );
}
