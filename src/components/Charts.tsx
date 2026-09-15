import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm shadow-md">
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
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Zarada i troškovi kroz vreme
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">Sve u dinarima</p>
        <div className="h-72 overflow-x-auto">
          {mounted ? (
            <AreaChart width={520} height={280} data={series}>
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
              <XAxis dataKey="label" tick={{ fill: "#5b6b76", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "#5b6b76", fontSize: 12 }}
                tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              />
              <Tooltip content={<MoneyTooltip />} />
              <Legend />
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
          ) : null}
        </div>
      </Card>
      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Neto rezultat po mesecu
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">Zarada − troškovi</p>
        <div className="h-72 overflow-x-auto">
          {mounted ? (
            <BarChart width={520} height={280} data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis dataKey="label" tick={{ fill: "#5b6b76", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "#5b6b76", fontSize: 12 }}
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
  useEffect(() => setMounted(true), []);

  if (!byWidth.length && !bySize.length) {
    return (
      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
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
      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Hale po širini
        </h3>
        <div className="mt-4 h-72 overflow-x-auto">
          {mounted ? (
            <BarChart width={520} height={280} data={byWidth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis dataKey="label" tick={{ fill: "#5b6b76", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#5b6b76", fontSize: 12 }} />
              <Tooltip content={<CountTooltip />} />
              <Bar
                dataKey="count"
                name="Broj hala"
                fill="#1d4e89"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          ) : null}
        </div>
      </Card>
      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Najčešće dimenzije (Š×D×V)
        </h3>
        <div className="mt-4 h-72 overflow-x-auto">
          {mounted ? (
            <BarChart
              width={560}
              height={280}
              data={bySize}
              layout="vertical"
              margin={{ left: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#5b6b76", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="label"
                width={100}
                tick={{ fill: "#5b6b76", fontSize: 11 }}
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
          ) : null}
        </div>
      </Card>
    </div>
  );
}
