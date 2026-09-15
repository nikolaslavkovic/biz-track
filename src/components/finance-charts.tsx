"use client";

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

function ChartShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-[var(--muted)]">
        Učitavam grafikon…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      {children}
    </ResponsiveContainer>
  );
}

export function FinanceCharts({ series }: { series: SeriesPoint[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Zarada i troškovi kroz vreme
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Mesečni pregled prihoda i ukupnih troškova
        </p>
        <div className="h-72 w-full min-h-[18rem]">
          <ChartShell>
            <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          </ChartShell>
        </div>
      </Card>

      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Neto rezultat po mesecu
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Zarada minus troškovi (uključujući rad)
        </p>
        <div className="h-72 w-full min-h-[18rem]">
          <ChartShell>
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          </ChartShell>
        </div>
      </Card>
    </div>
  );
}
