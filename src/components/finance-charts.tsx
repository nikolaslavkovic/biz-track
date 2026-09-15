"use client";

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
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" />
              <XAxis dataKey="label" tick={{ fill: "#78716c", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "#78716c", fontSize: 12 }}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
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
              />
              <Area
                type="monotone"
                dataKey="troskovi"
                name="Troškovi"
                stroke="#1d4e89"
                fill="url(#trosakFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Neto rezultat po mesecu
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Zarada minus troškovi (uključujući rad)
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" />
              <XAxis dataKey="label" tick={{ fill: "#78716c", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "#78716c", fontSize: 12 }}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="neto"
                name="Neto"
                fill="#0f766e"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
