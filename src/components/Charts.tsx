import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "./ui";
import { formatCompactRsd, formatMoney, cn } from "../lib/utils";
import type { OverviewPoint } from "../lib/data";

export function MoneyTooltip({
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
    <div className="max-w-[14rem] rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs shadow-md">
      <p className="mb-0.5 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatMoney(p.value)}
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

export function ChartFrame({
  height = 200,
  children,
}: {
  height?: number;
  children: (size: { width: number; height: number }) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="w-full max-w-full overflow-hidden"
      style={{ height }}
    >
      {width > 0 ? children({ width, height }) : null}
    </div>
  );
}

export function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );
  useEffect(() => {
    const sync = () => setNarrow(window.innerWidth < 640);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return narrow;
}

/** Line chart: prodaja, troškovi, radnici, neto */
export function OverviewLineChart({ series }: { series: OverviewPoint[] }) {
  const narrow = useNarrow();
  const tick = { fill: "#5b6b76", fontSize: narrow ? 9 : 11 };
  const yW = narrow ? 38 : 46;
  const margin = narrow
    ? { top: 4, right: 4, left: -6, bottom: 0 }
    : { top: 8, right: 10, left: 0, bottom: 0 };
  const chartH = narrow ? 200 : 280;

  return (
    <Card className="w-full max-w-full overflow-hidden !p-2.5 sm:!p-5">
      <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold">
        Tok kroz vreme
      </h3>
      <p className="mb-1.5 text-[10px] text-[var(--muted)] sm:text-xs">
        Prodaja · Troškovi · Radnici · Neto
      </p>
      <ChartFrame height={chartH}>
        {({ width, height }) => (
          <LineChart width={width} height={height} data={series} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
            <XAxis
              dataKey="label"
              tick={tick}
              interval="preserveStartEnd"
              minTickGap={narrow ? 28 : 16}
              tickMargin={4}
            />
            <YAxis
              width={yW}
              tick={tick}
              tickCount={narrow ? 4 : 5}
              tickFormatter={(v) => formatCompactRsd(Number(v))}
            />
            <Tooltip content={<MoneyTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={28}
              wrapperStyle={{ fontSize: narrow ? 10 : 12 }}
            />
            <Line
              type="monotone"
              dataKey="prodaja"
              name="Prodaja"
              stroke="#0f766e"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="troskovi"
              name="Troškovi"
              stroke="#1d4e89"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="radnici"
              name="Radnici"
              stroke="#b45309"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="neto"
              name="Neto"
              stroke="#047857"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ChartFrame>
    </Card>
  );
}

export function PeriodTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: "ukupno" | "nedeljno" | "mesecno" | "godisnje") => void;
}) {
  const options = [
    { id: "ukupno" as const, label: "Ukupno" },
    { id: "nedeljno" as const, label: "Nedeljno" },
    { id: "mesecno" as const, label: "Mesečno" },
    { id: "godisnje" as const, label: "Godišnje" },
  ];

  return (
    <div className="grid grid-cols-4 gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "min-h-9 rounded-md px-1 text-[11px] font-semibold transition-colors sm:text-xs",
            value === o.id
              ? "bg-[var(--ink)] text-[var(--bg)]"
              : "text-[var(--muted)] active:bg-[var(--surface)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FinanceCharts({
  series,
}: {
  series: Array<{
    label: string;
    zarada: number;
    troskovi: number;
    neto: number;
  }>;
}) {
  const narrow = useNarrow();
  const tick = { fill: "#5b6b76", fontSize: narrow ? 9 : 11 };
  const yW = narrow ? 38 : 46;
  const margin = narrow
    ? { top: 2, right: 2, left: -8, bottom: 0 }
    : { top: 6, right: 8, left: 0, bottom: 0 };
  const chartH = narrow ? 160 : 240;

  return (
    <div className="grid w-full min-w-0 max-w-full gap-2 sm:gap-4 lg:grid-cols-2">
      <Card className="w-full max-w-full overflow-hidden !p-2.5 sm:!p-5">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold sm:text-lg">
          Zarada i troškovi
        </h3>
        <ChartFrame height={chartH}>
          {({ width, height }) => (
            <AreaChart width={width} height={height} data={series} margin={margin}>
              <defs>
                <linearGradient id="zaradaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="trosakFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d4e89" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#1d4e89" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis dataKey="label" tick={tick} interval="preserveStartEnd" />
              <YAxis
                width={yW}
                tick={tick}
                tickFormatter={(v) => formatCompactRsd(Number(v))}
              />
              <Tooltip content={<MoneyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="zarada"
                name="Zarada"
                stroke="#0f766e"
                fill="url(#zaradaFill)"
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="troskovi"
                name="Troškovi"
                stroke="#1d4e89"
                fill="url(#trosakFill)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ChartFrame>
      </Card>
      <Card className="w-full max-w-full overflow-hidden !p-2.5 sm:!p-5">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold sm:text-lg">
          Neto po mesecu
        </h3>
        <ChartFrame height={chartH}>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={series} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis dataKey="label" tick={tick} interval="preserveStartEnd" />
              <YAxis
                width={yW}
                tick={tick}
                tickFormatter={(v) => formatCompactRsd(Number(v))}
              />
              <Tooltip content={<MoneyTooltip />} />
              <Bar
                dataKey="neto"
                name="Neto"
                fill="#0f766e"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </ChartFrame>
      </Card>
    </div>
  );
}

export function HallCharts({
  byWidth,
  bySize,
}: {
  byWidth: Array<{ label: string; count: number }>;
  bySize: Array<{ label: string; count: number }>;
}) {
  const narrow = useNarrow();
  const tick = { fill: "#5b6b76", fontSize: narrow ? 9 : 11 };
  const yW = narrow ? 38 : 46;
  const margin = narrow
    ? { top: 2, right: 2, left: -8, bottom: 0 }
    : { top: 6, right: 8, left: 0, bottom: 0 };
  const chartH = narrow ? 160 : 240;

  if (!byWidth.length && !bySize.length) {
    return (
      <Card>
        <h3 className="text-sm font-semibold">Dimenzije hala</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Unesite dimenzije na projektima da vidite grafikone.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid w-full min-w-0 max-w-full gap-2 sm:gap-4 lg:grid-cols-2">
      <Card className="w-full max-w-full overflow-hidden !p-2.5 sm:!p-5">
        <h3 className="text-sm font-semibold">Hale po širini</h3>
        <div className="mt-1">
          <ChartFrame height={chartH}>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={byWidth} margin={margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
                <XAxis dataKey="label" tick={tick} />
                <YAxis width={yW} allowDecimals={false} tick={tick} />
                <Tooltip content={<CountTooltip />} />
                <Bar
                  dataKey="count"
                  name="Broj hala"
                  fill="#1d4e89"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ChartFrame>
        </div>
      </Card>
      <Card className="w-full max-w-full overflow-hidden !p-2.5 sm:!p-5">
        <h3 className="text-sm font-semibold">Najčešće dimenzije</h3>
        <div className="mt-1">
          <ChartFrame height={chartH}>
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                data={bySize}
                layout="vertical"
                margin={{ top: 2, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
                <XAxis type="number" allowDecimals={false} tick={tick} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={narrow ? 64 : 96}
                  tick={{ fill: "#5b6b76", fontSize: narrow ? 8 : 10 }}
                />
                <Tooltip content={<CountTooltip />} />
                <Bar
                  dataKey="count"
                  name="Broj hala"
                  fill="#0f766e"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ChartFrame>
        </div>
      </Card>
    </div>
  );
}
