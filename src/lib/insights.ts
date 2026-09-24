import type { DashboardData } from "./data";
import { earnedProjects, logCost } from "./data";
import { monthKey, projectRate, toRsd } from "./utils";

export type MonthStat = {
  key: string;
  label: string;
  /** Tekući mesec — još nije završen */
  partial: boolean;
  prodaja: number;
  troskovi: number;
  radnici: number;
  neto: number;
  /** Neto / prodaja u %, null kad nema prodaje */
  marza: number | null;
  brojProdaja: number;
  prodaja3m: number;
  neto3m: number;
  kumulativnoNeto: number;
};

export type CostSlice = { key: string; label: string; amount: number; share: number };

export type Insights = {
  months: MonthStat[];
  fullMonthCount: number;
  avgNeto: number;
  avgProdaja: number;
  avgTroskovi: number;
  marza: number | null;
  trend: {
    windowSize: number;
    netoChange: number | null;
    prodajaChange: number | null;
  };
  best: MonthStat | null;
  worst: MonthStat | null;
  totalNeto: number;
  yearProjection: number | null;
  avgSaleValue: number | null;
  costs: CostSlice[];
  summary: string[];
};

const COST_LABELS: Record<string, string> = {
  materijal: "Materijal",
  radnici: "Radnici",
  alat: "Alat i oprema",
  potrosni: "Potrošni materijal",
  obaveze: "Obaveze",
  marketing: "Marketing",
  ostalo: "Ostalo",
};

/** Napomena sa dimenzijama hale, npr. „12x6x3m na dve vode“ */
const HALL_DIMENSIONS = /\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?\s*[x×]\s*\d+/i;

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("sr-Latn-RS", { month: "short" })
    .format(new Date(y, m - 1, 1))
    .replace(".", "");
}

function nextMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function avg(values: number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}

function pctChange(now: number, before: number): number | null {
  if (!before) return null;
  return ((now - before) / Math.abs(before)) * 100;
}

function projectDate(p: { endDate: string | null; startDate: string }): string {
  return (p.endDate || p.startDate || "").slice(0, 10);
}

export function buildInsights(data: DashboardData): Insights | null {
  const workerMap = new Map(data.workers.map((w) => [w.id!, w]));
  const current = currentMonthKey();
  const earned = earnedProjects(data.projects);

  const dates = [
    ...data.incomes.map((i) => i.date),
    ...data.expenses.map((e) => e.date),
    ...data.workLogs.map((l) => l.date),
    ...earned.map(projectDate),
  ].filter(Boolean);
  if (!dates.length) return null;

  const first = monthKey(dates.reduce((a, b) => (a < b ? a : b)));
  const keys: string[] = [];
  for (let k = first; k <= current; k = nextMonth(k)) keys.push(k);

  const blank = () => ({ prodaja: 0, troskovi: 0, radnici: 0, brojProdaja: 0 });
  const buckets = new Map(keys.map((k) => [k, blank()]));
  const costTotals = new Map<string, number>();
  const addCost = (key: string, amount: number) =>
    costTotals.set(key, (costTotals.get(key) ?? 0) + amount);

  let saleSum = 0;
  let saleCount = 0;

  for (const i of data.incomes) {
    const b = buckets.get(monthKey(i.date));
    if (!b) continue;
    b.prodaja += i.amount;
    if (i.category !== "avans" && HALL_DIMENSIONS.test(i.description)) {
      b.brojProdaja += 1;
      saleSum += i.amount;
      saleCount += 1;
    }
  }
  for (const p of earned) {
    const b = buckets.get(monthKey(projectDate(p)));
    if (!b) continue;
    const value = toRsd(p.revenue, p.revenueCurrency, projectRate(p, data.eurToRsd));
    b.prodaja += value;
    b.brojProdaja += 1;
    saleSum += value;
    saleCount += 1;
  }
  for (const e of data.expenses) {
    const b = buckets.get(monthKey(e.date));
    if (!b) continue;
    if (e.category === "plata") {
      b.radnici += e.amount;
      addCost("radnici", e.amount);
    } else {
      b.troskovi += e.amount;
      addCost(e.category in COST_LABELS ? e.category : "ostalo", e.amount);
    }
  }
  for (const l of data.workLogs) {
    const b = buckets.get(monthKey(l.date));
    if (!b) continue;
    const cost = logCost(l, workerMap.get(l.workerId));
    b.radnici += cost;
    addCost("radnici", cost);
  }

  let cumulative = 0;
  const months: MonthStat[] = keys.map((key) => {
    const b = buckets.get(key)!;
    const neto = b.prodaja - b.troskovi - b.radnici;
    cumulative += neto;
    return {
      key,
      label: monthLabel(key) + (key === current ? "*" : ""),
      partial: key === current,
      ...b,
      neto,
      marza: b.prodaja > 0 ? (neto / b.prodaja) * 100 : null,
      prodaja3m: 0,
      neto3m: 0,
      kumulativnoNeto: cumulative,
    };
  });
  months.forEach((m, idx) => {
    const win = months.slice(Math.max(0, idx - 2), idx + 1);
    m.prodaja3m = avg(win.map((w) => w.prodaja));
    m.neto3m = avg(win.map((w) => w.neto));
  });

  const full = months.filter((m) => !m.partial);
  const basis = full.length ? full : months;

  const totalProdaja = months.reduce((s, m) => s + m.prodaja, 0);
  const totalNeto = months.reduce((s, m) => s + m.neto, 0);

  const windowSize = Math.min(3, Math.floor(full.length / 2));
  const recent = windowSize ? full.slice(-windowSize) : [];
  const previous = windowSize ? full.slice(-2 * windowSize, -windowSize) : [];
  const trend = {
    windowSize,
    netoChange: windowSize
      ? pctChange(avg(recent.map((m) => m.neto)), avg(previous.map((m) => m.neto)))
      : null,
    prodajaChange: windowSize
      ? pctChange(avg(recent.map((m) => m.prodaja)), avg(previous.map((m) => m.prodaja)))
      : null,
  };

  const best = basis.reduce<MonthStat | null>((a, m) => (!a || m.neto > a.neto ? m : a), null);
  const worst = basis.reduce<MonthStat | null>((a, m) => (!a || m.neto < a.neto ? m : a), null);

  const avgNeto = avg(basis.map((m) => m.neto));
  const year = current.slice(0, 4);
  const doneThisYear = full.filter((m) => m.key.startsWith(year));
  const netoThisYearDone = doneThisYear.reduce((s, m) => s + m.neto, 0);
  const remainingMonths = 12 - doneThisYear.length;
  const yearProjection = doneThisYear.length
    ? netoThisYearDone + avg(doneThisYear.map((m) => m.neto)) * remainingMonths
    : null;

  const costSum = [...costTotals.values()].reduce((s, v) => s + v, 0);
  const costs: CostSlice[] = [...costTotals.entries()]
    .filter(([, v]) => v > 0)
    .map(([key, amount]) => ({
      key,
      label: COST_LABELS[key] ?? key,
      amount,
      share: costSum ? (amount / costSum) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const marza = totalProdaja > 0 ? (totalNeto / totalProdaja) * 100 : null;

  const summary: string[] = [];
  if (trend.netoChange != null) {
    const n = windowSize === 1 ? "prošlog meseca" : `poslednja ${windowSize} meseca`;
    const p = windowSize === 1 ? "pretprošlog" : `prethodna ${windowSize}`;
    const ch = trend.netoChange;
    const verdict =
      ch > 10 ? "firma raste" : ch < -10 ? "zarada pada — vredi proveriti troškove" : "firma je stabilna";
    summary.push(
      `Neto ${n} je ${Math.abs(ch).toFixed(0)}% ${ch >= 0 ? "veći" : "manji"} nego ${p} — ${verdict}.`,
    );
  }
  if (trend.prodajaChange != null) {
    const ch = trend.prodajaChange;
    summary.push(
      `Prodaja je ${ch >= 0 ? "porasla" : "pala"} ${Math.abs(ch).toFixed(0)}% u istom poređenju.`,
    );
  }
  if (marza != null) {
    summary.push(
      `Od svakih 100 dinara prodaje ostaje ti oko ${Math.max(0, marza).toFixed(0)} dinara neto.`,
    );
  }
  if (costs[0]) {
    summary.push(`Najveći trošak je ${costs[0].label.toLowerCase()} (${costs[0].share.toFixed(0)}% svih troškova).`);
  }
  const lossMonths = basis.filter((m) => m.neto < 0).length;
  if (lossMonths) {
    summary.push(`${lossMonths} od ${basis.length} meseci je bilo u minusu.`);
  }

  return {
    months,
    fullMonthCount: full.length,
    avgNeto,
    avgProdaja: avg(basis.map((m) => m.prodaja)),
    avgTroskovi: avg(basis.map((m) => m.troskovi + m.radnici)),
    marza,
    trend,
    best,
    worst,
    totalNeto,
    yearProjection,
    avgSaleValue: saleCount ? saleSum / saleCount : null,
    costs,
    summary,
  };
}
