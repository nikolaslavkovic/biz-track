import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ChartFrame, MoneyTooltip, useNarrow } from "./Charts";
import { Card } from "./ui";
import type { Insights } from "../lib/insights";
import { cn, formatCompactRsd, formatMoney } from "../lib/utils";

function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

const COST_COLORS: Record<string, string> = {
  materijal: "#0f766e",
  radnici: "#e11d48",
  alat: "#0284c7",
  potrosni: "#d97706",
  obaveze: "#7c3aed",
  ostalo: "#64748b",
};

function useChartProps() {
  const narrow = useNarrow();
  return {
    narrow,
    tick: { fill: "#5b6b76", fontSize: narrow ? 9 : 11 },
    yW: narrow ? 38 : 46,
    margin: narrow
      ? { top: 6, right: 4, left: -6, bottom: 0 }
      : { top: 8, right: 10, left: 0, bottom: 0 },
    height: narrow ? 170 : 240,
  };
}

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <Card className="w-full max-w-full overflow-hidden !p-2.5 sm:!p-5">
      <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold">
        {title}
      </h3>
      <p className="mb-1.5 text-[10px] leading-snug text-[var(--muted)] sm:text-xs">
        {hint}
      </p>
      {children}
    </Card>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  tone?: "default" | "good" | "bad" | "accent";
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-[family-name:var(--font-display)] text-base font-semibold leading-tight",
          tone === "good" && "text-[var(--good)]",
          tone === "bad" && "text-[var(--danger)]",
          tone === "accent" && "text-[var(--accent)]",
        )}
      >
        {value}
      </p>
      {sub ? <p className="truncate text-[10px] text-[var(--muted)]">{sub}</p> : null}
    </div>
  );
}

function TrendKpi({ label, change, window }: { label: string; change: number | null; window: number }) {
  if (change == null) {
    return <Kpi label={label} value="—" sub="treba više meseci" />;
  }
  const Icon = change > 5 ? TrendingUp : change < -5 ? TrendingDown : Minus;
  const tone = change > 5 ? "good" : change < -5 ? "bad" : "default";
  return (
    <Kpi
      label={label}
      tone={tone}
      value={`${change > 0 ? "+" : ""}${change.toFixed(0)}%`}
      sub={
        <span className="inline-flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {window === 1 ? "prošli vs pretprošli mesec" : `posl. ${window} vs preth. ${window} mes.`}
        </span>
      }
    />
  );
}

function PercentTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs shadow-md">
      <p className="mb-0.5 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value == null ? "—" : pct(Number(p.value))}
        </p>
      ))}
    </div>
  );
}

function CountTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs shadow-md">
      <p className="mb-0.5 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function InsightsSection({ insights }: { insights: Insights }) {
  const c = useChartProps();
  const { months } = insights;
  const hasPartial = months.some((m) => m.partial);
  const partialNote = hasPartial ? " * tekući mesec još nije završen." : "";
  const basisNote =
    insights.fullMonthCount > 0
      ? `prosek ${insights.fullMonthCount} završenih meseci`
      : "samo tekući mesec";

  return (
    <section className="space-y-3">
      <div className="pt-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
          Rast firme
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Svi podaci po mesecima, od {months[0].label.replace("*", "")} do danas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Kpi
          label="Prosečan mesečni neto"
          value={formatCompactRsd(insights.avgNeto)}
          sub={basisNote}
          tone={insights.avgNeto >= 0 ? "good" : "bad"}
        />
        <Kpi
          label="Prosečna mesečna prodaja"
          value={formatCompactRsd(insights.avgProdaja)}
          sub={`troškovi ~${formatCompactRsd(insights.avgTroskovi)}/mes`}
          tone="accent"
        />
        <TrendKpi
          label="Trend neto"
          change={insights.trend.netoChange}
          window={insights.trend.windowSize}
        />
        <TrendKpi
          label="Trend prodaje"
          change={insights.trend.prodajaChange}
          window={insights.trend.windowSize}
        />
        <Kpi
          label="Neto marža"
          value={insights.marza == null ? "—" : pct(insights.marza)}
          sub="neto od svake prodaje"
          tone={insights.marza != null && insights.marza >= 0 ? "good" : "bad"}
        />
        <Kpi
          label="Projekcija neto za godinu"
          value={insights.yearProjection == null ? "—" : formatCompactRsd(insights.yearProjection)}
          sub="ako nastavi ovim tempom"
          tone="accent"
        />
        <Kpi
          label="Najbolji mesec"
          value={insights.best ? formatCompactRsd(insights.best.neto) : "—"}
          sub={insights.best?.label.replace("*", "")}
          tone="good"
        />
        <Kpi
          label="Najslabiji mesec"
          value={insights.worst ? formatCompactRsd(insights.worst.neto) : "—"}
          sub={insights.worst?.label.replace("*", "")}
          tone={insights.worst && insights.worst.neto < 0 ? "bad" : "default"}
        />
      </div>

      {insights.summary.length ? (
        <Card className="!p-3 border-teal-200 bg-teal-50/60">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">
            Ukratko
          </p>
          <ul className="space-y-1 text-sm leading-snug">
            {insights.summary.map((s) => (
              <li key={s} className="flex gap-1.5">
                <span className="text-[var(--accent)]">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <ChartCard
        title="Neto po mesecima"
        hint={`Zeleno = zarada, crveno = gubitak. Isprekidana linija je prosečan mesečni neto.${partialNote}`}
      >
        <ChartFrame height={c.height}>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={months} margin={c.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" vertical={false} />
              <XAxis dataKey="label" tick={c.tick} interval={0} tickMargin={4} />
              <YAxis
                width={c.yW}
                tick={c.tick}
                tickCount={c.narrow ? 4 : 5}
                tickFormatter={(v) => formatCompactRsd(Number(v))}
              />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(15,118,110,0.06)" }} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <ReferenceLine
                y={insights.avgNeto}
                stroke="#0f766e"
                strokeDasharray="5 4"
                label={{
                  value: "prosek",
                  position: "insideTopRight",
                  fill: "#0f766e",
                  fontSize: 10,
                }}
              />
              <Bar dataKey="neto" name="Neto" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {months.map((m) => (
                  <Cell
                    key={m.key}
                    fill={m.neto >= 0 ? "#059669" : "#dc2626"}
                    fillOpacity={m.partial ? 0.45 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ChartFrame>
      </ChartCard>

      <ChartCard
        title="Pravac kretanja (prosek 3 meseca)"
        hint="Izravnava dobre i loše mesece. Ako linije idu gore, firma raste; ako su ravne, stagnira."
      >
        <ChartFrame height={c.height}>
          {({ width, height }) => (
            <LineChart width={width} height={height} data={months} margin={c.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis dataKey="label" tick={c.tick} interval={0} tickMargin={4} />
              <YAxis
                width={c.yW}
                tick={c.tick}
                tickCount={c.narrow ? 4 : 5}
                tickFormatter={(v) => formatCompactRsd(Number(v))}
              />
              <Tooltip content={<MoneyTooltip />} />
              <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: c.narrow ? 10 : 12 }} />
              <Line
                type="monotone"
                dataKey="prodaja3m"
                name="Prodaja (3m)"
                stroke="#0f766e"
                strokeWidth={2.5}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="neto3m"
                name="Neto (3m)"
                stroke="#1d4e89"
                strokeWidth={2.5}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ChartFrame>
      </ChartCard>

      <ChartCard
        title="Ukupna zarada od početka"
        hint={`Koliko je neto ukupno zarađeno do svakog meseca. Sada: ${formatMoney(insights.totalNeto)}.`}
      >
        <ChartFrame height={c.height}>
          {({ width, height }) => (
            <AreaChart width={width} height={height} data={months} margin={c.margin}>
              <defs>
                <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis dataKey="label" tick={c.tick} interval={0} tickMargin={4} />
              <YAxis
                width={c.yW}
                tick={c.tick}
                tickCount={c.narrow ? 4 : 5}
                tickFormatter={(v) => formatCompactRsd(Number(v))}
              />
              <Tooltip content={<MoneyTooltip />} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Area
                type="monotone"
                dataKey="kumulativnoNeto"
                name="Ukupno neto"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#cumFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ChartFrame>
      </ChartCard>

      <ChartCard
        title="Marža po mesecima"
        hint="Koliko % od prodaje ostane kao neto. Veća marža = isplativiji poslovi ili manji troškovi."
      >
        <ChartFrame height={c.height}>
          {({ width, height }) => (
            <LineChart width={width} height={height} data={months} margin={c.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis dataKey="label" tick={c.tick} interval={0} tickMargin={4} />
              <YAxis
                width={c.yW}
                tick={c.tick}
                tickCount={c.narrow ? 4 : 5}
                tickFormatter={(v) => `${Math.round(Number(v))}%`}
              />
              <Tooltip content={<PercentTooltip />} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              {insights.marza != null ? (
                <ReferenceLine
                  y={insights.marza}
                  stroke="#7c3aed"
                  strokeDasharray="5 4"
                  label={{
                    value: "prosek",
                    position: "insideTopRight",
                    fill: "#7c3aed",
                    fontSize: 10,
                  }}
                />
              ) : null}
              <Line
                type="monotone"
                dataKey="marza"
                name="Marža"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ChartFrame>
      </ChartCard>

      {insights.costs.length ? (
        <ChartCard
          title="Gde odlazi novac"
          hint="Udeo svake vrste troška u ukupnim troškovima (uključujući radnike)."
        >
          <ul className="space-y-2 pt-1">
            {insights.costs.map((cost) => (
              <li key={cost.key}>
                <div className="mb-0.5 flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium">{cost.label}</span>
                  <span className="tabular-nums text-[var(--muted)]">
                    {formatCompactRsd(cost.amount)} ·{" "}
                    <strong className="text-[var(--ink)]">{cost.share.toFixed(0)}%</strong>
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(cost.share, 1)}%`,
                      backgroundColor: COST_COLORS[cost.key] ?? "#64748b",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      ) : null}

      <ChartCard
        title="Broj prodaja po mesecu"
        hint={
          insights.avgSaleValue != null
            ? `Koliko konstrukcija je naplaćeno (bez avansa). Prosečna naplata: ${formatMoney(insights.avgSaleValue)}.`
            : "Koliko konstrukcija je naplaćeno (bez avansa)."
        }
      >
        <ChartFrame height={c.narrow ? 150 : 200}>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={months} margin={c.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" vertical={false} />
              <XAxis dataKey="label" tick={c.tick} interval={0} tickMargin={4} />
              <YAxis width={c.yW} tick={c.tick} allowDecimals={false} />
              <Tooltip content={<CountTooltip />} cursor={{ fill: "rgba(29,78,137,0.06)" }} />
              <Bar
                dataKey="brojProdaja"
                name="Prodaja"
                fill="#1d4e89"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </ChartFrame>
      </ChartCard>
    </section>
  );
}
