"use client";

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
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

type SeriesPoint = {
  month: string;
  label: string;
  zarada: number;
  troskovi: number;
  materijal: number;
  mesecni: number;
  sati: number;
  neto: number;
};

function ChartTooltip({
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
      <p className="mb-1 font-medium text-[var(--ink)]">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  );
}

export function FinanceCharts({ series }: { series: SeriesPoint[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Zarada i troškovi kroz vreme
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Mesečni pregled prihoda i ukupnih troškova
        </p>
        <div className="h-72 w-full overflow-x-auto">
          {!mounted ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
              Učitavam grafikon…
            </div>
          ) : (
            <AreaChart
              width={520}
              height={280}
              data={series}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
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
              <Tooltip content={<ChartTooltip />} />
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
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Neto rezultat po mesecu
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Zarada minus troškovi (uključujući rad)
        </p>
        <div className="h-72 w-full overflow-x-auto">
          {!mounted ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
              Učitavam grafikon…
            </div>
          ) : (
            <BarChart
              width={520}
              height={280}
              data={series}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis dataKey="label" tick={{ fill: "#5b6b76", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "#5b6b76", fontSize: 12 }}
                tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="neto"
                name="Neto"
                fill="#0f766e"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </div>
      </Card>
    </div>
  );
}

type WidthPoint = {
  width: number;
  label: string;
  count: number;
  revenue: number;
};

type SizePoint = {
  label: string;
  count: number;
  revenue: number;
};

function CountTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-[var(--ink)]">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}:{" "}
          {p.dataKey === "revenue" ? formatMoney(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function HallCharts({
  byWidth,
  bySize,
}: {
  byWidth: WidthPoint[];
  bySize: SizePoint[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!byWidth.length && !bySize.length) {
    return (
      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Dimenzije hala
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Kad unesete širinu/dužinu/visinu na projektima, ovde će se pojaviti
          grafikoni koje dimenzije najviše idu.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Hale po širini
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Koliko konstrukcija ste uradili u svakoj širini
        </p>
        <div className="h-72 w-full overflow-x-auto">
          {!mounted ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
              Učitavam grafikon…
            </div>
          ) : (
            <BarChart
              width={520}
              height={280}
              data={byWidth}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis dataKey="label" tick={{ fill: "#5b6b76", fontSize: 12 }} />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#5b6b76", fontSize: 12 }}
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
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Najčešće dimenzije (Š×D×V)
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Koje mere konstrukcije se najviše poručuju
        </p>
        <div className="h-72 w-full overflow-x-auto">
          {!mounted ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
              Učitavam grafikon…
            </div>
          ) : (
            <BarChart
              width={560}
              height={280}
              data={bySize}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cfd8de" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: "#5b6b76", fontSize: 12 }}
              />
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
          )}
        </div>
      </Card>
    </div>
  );
}
