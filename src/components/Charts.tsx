import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "./ui";
import { formatMoney } from "../lib/utils";

function MoneyTooltip({
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
    <div className="max-w-[min(100vw-2rem,16rem)] rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
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
    <div className="max-w-[min(100vw-2rem,16rem)] rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function useIsNarrow(breakpoint = 480) {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < breakpoint);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return narrow;
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
  const [mounted, setMounted] = useState(false);
  const narrow = useIsNarrow();
  useEffect(() => setMounted(true), []);

  const tick = { fill: "#5b6b76", fontSize: narrow ? 10 : 12 };
  const yWidth = narrow ? 36 : 48;
  const margin = narrow
    ? { top: 4, right: 4, left: 0, bottom: 0 }
    : { top: 8, right: 12, left: 0, bottom: 0 };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="min-w-0 overflow-hidden">
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold sm:text-lg">
          Zarada i troškovi
        </h3>
        <p className="mb-3 text-sm text-[var(--muted)]">Sve u dinarima</p>
        <div className="h-56 w-full min-w-0 sm:h-72">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={margin}>
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
                <XAxis
                  dataKey="label"
                  tick={tick}
                  interval="preserveStartEnd"
                  minTickGap={narrow ? 28 : 16}
                />
                <YAxis
                  width={yWidth}
                  tick={tick}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                />
                <Tooltip content={<MoneyTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: narrow ? 11 : 13, paddingTop: 4 }}
                />
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
            </ResponsiveContainer>
          ) : null}
        </div>
      </Card>
      <Card className="min-w-0 overflow-hidden">
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold sm:text-lg">
          Neto po mesecu
        </h3>
        <p className="mb-3 text-sm text-[var(--muted)]">Zarada − troškovi</p>
        <div className="h-56 w-full min-w-0 sm:h-72">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
                <XAxis
                  dataKey="label"
                  tick={tick}
                  interval="preserveStartEnd"
                  minTickGap={narrow ? 28 : 16}
                />
                <YAxis
                  width={yWidth}
                  tick={tick}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                />
                <Tooltip content={<MoneyTooltip />} />
                <Bar
                  dataKey="neto"
                  name="Neto"
                  fill="#0f766e"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
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
  const [mounted, setMounted] = useState(false);
  const narrow = useIsNarrow();
  useEffect(() => setMounted(true), []);

  const tick = { fill: "#5b6b76", fontSize: narrow ? 10 : 12 };
  const yWidth = narrow ? 36 : 48;
  const margin = narrow
    ? { top: 4, right: 4, left: 0, bottom: 0 }
    : { top: 8, right: 12, left: 0, bottom: 0 };

  if (!byWidth.length && !bySize.length) {
    return (
      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold sm:text-lg">
          Dimenzije hala
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Unesite dimenzije na projektima da vidite grafikone.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="min-w-0 overflow-hidden">
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold sm:text-lg">
          Hale po širini
        </h3>
        <div className="mt-3 h-56 w-full min-w-0 sm:h-72">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byWidth} margin={margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
                <XAxis dataKey="label" tick={tick} />
                <YAxis
                  width={yWidth}
                  allowDecimals={false}
                  tick={tick}
                />
                <Tooltip content={<CountTooltip />} />
                <Bar
                  dataKey="count"
                  name="Broj hala"
                  fill="#1d4e89"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </Card>
      <Card className="min-w-0 overflow-hidden">
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold sm:text-lg">
          Najčešće dimenzije
        </h3>
        <div className="mt-3 h-56 w-full min-w-0 sm:h-72">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bySize}
                layout="vertical"
                margin={{
                  top: 4,
                  right: narrow ? 8 : 12,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={tick}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={narrow ? 72 : 100}
                  tick={{ fill: "#5b6b76", fontSize: narrow ? 9 : 11 }}
                />
                <Tooltip content={<CountTooltip />} />
                <Bar
                  dataKey="count"
                  name="Broj hala"
                  fill="#0f766e"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
