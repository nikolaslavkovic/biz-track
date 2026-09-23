import {
  db,
  getCustomSubcategories,
  getEurToRsdRate,
  type CustomSubcategories,
  type Project,
  type Worker,
  type WorkLog,
  type Expense,
} from "../db";
import {
  formatWeekRange,
  monthKey,
  projectRate,
  toRsd,
  weekEndISO,
  weekStartISO,
} from "./utils";

export type PeriodMode = "ukupno" | "nedeljno" | "mesecno" | "godisnje";

export type OverviewPoint = {
  key: string;
  label: string;
  prodaja: number;
  troskovi: number;
  radnici: number;
  neto: number;
};

export type OverviewSlice = {
  prodaja: number;
  troskovi: number;
  radnici: number;
  neto: number;
  series: OverviewPoint[];
};

export type DashboardData = {
  projects: Project[];
  workers: Worker[];
  workLogs: WorkLog[];
  expenses: Expense[];
  eurToRsd: number;
  summary: {
    revenue: number;
    totalCosts: number;
    netProfit: number;
    totalHours: number;
    netPerHour: number;
    materialCost: number;
    monthlyCost: number;
    laborFromLogs: number;
  };
  series: Array<{
    month: string;
    label: string;
    zarada: number;
    troskovi: number;
    neto: number;
  }>;
  hallStats: {
    byWidth: Array<{
      width: number;
      label: string;
      count: number;
      revenue: number;
    }>;
    bySize: Array<{ label: string; count: number; revenue: number }>;
  };
  weekly: Array<{
    weekStart: string;
    label: string;
    totalHours: number;
    totalCost: number;
    workers: Array<{
      workerId: number;
      workerName: string;
      hourlyRate: number;
      hours: number;
      adjustment: number;
      cost: number;
      logIds: number[];
    }>;
  }>;
  customSubcategories: CustomSubcategories;
};

function yearKey(date: string): string {
  return date.slice(0, 4);
}

function projectDate(p: Project): string {
  return (p.endDate || p.startDate || "").slice(0, 10);
}

function laborCost(
  workLogs: WorkLog[],
  workerMap: Map<number, Worker>,
  expenses: Expense[],
): number {
  const plata = expenses
    .filter((e) => e.category === "plata")
    .reduce((s, e) => s + e.amount, 0);
  if (plata > 0) return plata;
  return workLogs.reduce((s, log) => s + logCost(log, workerMap.get(log.workerId)), 0);
}

export function logCost(log: WorkLog, worker: Worker | undefined): number {
  return log.hours * (worker?.hourlyRate || 0) + (Number(log.adjustment) || 0);
}

function expenseTroskovi(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.category !== "plata")
    .reduce((s, e) => s + e.amount, 0);
}

function filterByRange<T extends { date?: string } | Project>(
  items: T[],
  start: string | null,
  end: string | null,
  getDate: (item: T) => string,
): T[] {
  if (!start || !end) return items;
  return items.filter((item) => {
    const d = getDate(item);
    return d >= start && d <= end;
  });
}

function totalsFor(
  projects: Project[],
  expenses: Expense[],
  workLogs: WorkLog[],
  workerMap: Map<number, Worker>,
  eurToRsd: number,
): Omit<OverviewSlice, "series"> {
  const prodaja = projects.reduce(
    (s, p) =>
      s + toRsd(p.revenue, p.revenueCurrency, projectRate(p, eurToRsd)),
    0,
  );
  const troskovi = expenseTroskovi(expenses);
  const radnici = laborCost(workLogs, workerMap, expenses);
  return {
    prodaja,
    troskovi,
    radnici,
    neto: prodaja - troskovi - radnici,
  };
}

function monthBuckets(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return keys;
}

function weekBuckets(count: number): string[] {
  const keys: string[] = [];
  const current = weekStartISO();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(current + "T12:00:00");
    d.setDate(d.getDate() - i * 7);
    keys.push(weekStartISO(d));
  }
  return keys;
}

function yearBuckets(count: number): string[] {
  const y = new Date().getFullYear();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) keys.push(String(y - i));
  return keys;
}

function labelForBucket(mode: PeriodMode, key: string): string {
  if (mode === "nedeljno") {
    const end = weekEndISO(key);
    const a = key.slice(5).replace("-", ".");
    const b = end.slice(5).replace("-", ".");
    return `${a}–${b}`;
  }
  if (mode === "godisnje") return key;
  // mesecno / ukupno chart
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("sr-RS", {
    month: "short",
    year: "2-digit",
  }).format(new Date(y, (m || 1) - 1, 1));
}

function matchBucket(mode: PeriodMode, date: string, key: string): boolean {
  if (mode === "nedeljno") {
    return weekStartISO(date) === key;
  }
  if (mode === "godisnje") {
    return yearKey(date) === key;
  }
  return monthKey(date) === key;
}

function buildSeries(
  mode: PeriodMode,
  projects: Project[],
  expenses: Expense[],
  workLogs: WorkLog[],
  workerMap: Map<number, Worker>,
  eurToRsd: number,
): OverviewPoint[] {
  const chartMode: PeriodMode =
    mode === "ukupno" ? "mesecno" : mode;
  const keys =
    chartMode === "nedeljno"
      ? weekBuckets(12)
      : chartMode === "godisnje"
        ? yearBuckets(5)
        : monthBuckets(12);

  return keys.map((key) => {
    const bucketProjects = projects.filter((p) =>
      matchBucket(chartMode, projectDate(p), key),
    );
    const bucketExpenses = expenses.filter((e) =>
      matchBucket(chartMode, e.date, key),
    );
    const bucketLogs = workLogs.filter((w) =>
      matchBucket(chartMode, w.date, key),
    );
    const t = totalsFor(
      bucketProjects,
      bucketExpenses,
      bucketLogs,
      workerMap,
      eurToRsd,
    );
    return {
      key,
      label: labelForBucket(chartMode, key),
      ...t,
    };
  });
}

export function buildOverview(
  data: DashboardData,
  mode: PeriodMode,
): OverviewSlice {
  const workerMap = new Map(data.workers.map((w) => [w.id!, w]));
  const now = new Date();
  let start: string | null = null;
  let end: string | null = null;

  if (mode === "nedeljno") {
    start = weekStartISO();
    end = weekEndISO(start);
  } else if (mode === "mesecno") {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    start = `${y}-${m}-01`;
    end = new Date(y, now.getMonth() + 1, 0).toISOString().slice(0, 10);
  } else if (mode === "godisnje") {
    const y = now.getFullYear();
    start = `${y}-01-01`;
    end = `${y}-12-31`;
  }

  const projects = filterByRange(data.projects, start, end, projectDate);
  const expenses = filterByRange(data.expenses, start, end, (e) => e.date);
  const workLogs = filterByRange(data.workLogs, start, end, (w) => w.date);

  const totals = totalsFor(
    projects,
    expenses,
    workLogs,
    workerMap,
    data.eurToRsd,
  );

  return {
    ...totals,
    series: buildSeries(
      mode,
      data.projects,
      data.expenses,
      data.workLogs,
      workerMap,
      data.eurToRsd,
    ),
  };
}

export async function loadDashboardData(): Promise<DashboardData> {
  const [projects, workers, workLogs, expenses, eurToRsd, customSubcategories] =
    await Promise.all([
      db.projects.orderBy("startDate").reverse().toArray(),
      db.workers.orderBy("name").toArray(),
      db.workLogs.orderBy("date").reverse().toArray(),
      db.expenses.orderBy("date").reverse().toArray(),
      getEurToRsdRate(),
      getCustomSubcategories(),
    ]);

  const workerMap = new Map(workers.map((w) => [w.id!, w]));
  const overview = buildOverview(
    {
      projects,
      workers,
      workLogs,
      expenses,
      eurToRsd,
      summary: {
        revenue: 0,
        totalCosts: 0,
        netProfit: 0,
        totalHours: 0,
        netPerHour: 0,
        materialCost: 0,
        monthlyCost: 0,
        laborFromLogs: 0,
      },
      series: [],
      hallStats: { byWidth: [], bySize: [] },
      weekly: [],
      customSubcategories,
    },
    "ukupno",
  );

  const materialCost = expenses
    .filter((e) => e.category === "materijal")
    .reduce((s, e) => s + e.amount, 0);
  const monthlyCost = expenses
    .filter((e) => e.category === "obaveze")
    .reduce((s, e) => s + e.amount, 0);

  let totalHours = 0;
  let laborFromLogs = 0;
  for (const log of workLogs) {
    totalHours += log.hours;
    laborFromLogs += logCost(log, workerMap.get(log.workerId));
  }

  const byWidth = new Map<
    string,
    { width: number; label: string; count: number; revenue: number }
  >();
  const bySize = new Map<
    string,
    { label: string; count: number; revenue: number }
  >();
  for (const p of projects) {
    if (!p.widthM) continue;
    const rev = toRsd(
      p.revenue,
      p.revenueCurrency,
      projectRate(p, eurToRsd),
    );
    const wk = String(p.widthM);
    const wr = byWidth.get(wk) ?? {
      width: p.widthM,
      label: `${p.widthM} m`,
      count: 0,
      revenue: 0,
    };
    wr.count += 1;
    wr.revenue += rev;
    byWidth.set(wk, wr);
    const sl = `${p.lengthM}×${p.widthM}×${p.heightM}`;
    const sr = bySize.get(sl) ?? { label: sl, count: 0, revenue: 0 };
    sr.count += 1;
    sr.revenue += rev;
    bySize.set(sl, sr);
  }

  const weekMap = new Map<string, DashboardData["weekly"][number]>();
  for (const log of workLogs) {
    const weekStart = weekStartISO(log.date);
    const w = workerMap.get(log.workerId);
    if (!w) continue;
    let week = weekMap.get(weekStart);
    if (!week) {
      week = {
        weekStart,
        label: formatWeekRange(weekStart),
        totalHours: 0,
        totalCost: 0,
        workers: [],
      };
      weekMap.set(weekStart, week);
    }
    const cost = logCost(log, w);
    const adjustment = Number(log.adjustment) || 0;
    week.totalHours += log.hours;
    week.totalCost += cost;
    const existing = week.workers.find((x) => x.workerId === log.workerId);
    if (existing) {
      existing.hours += log.hours;
      existing.adjustment += adjustment;
      existing.cost += cost;
      existing.logIds.push(log.id!);
    } else {
      week.workers.push({
        workerId: log.workerId,
        workerName: w.name,
        hourlyRate: w.hourlyRate,
        hours: log.hours,
        adjustment,
        cost,
        logIds: [log.id!],
      });
    }
  }

  return {
    projects,
    workers,
    workLogs,
    expenses,
    eurToRsd,
    summary: {
      revenue: overview.prodaja,
      totalCosts: overview.troskovi + overview.radnici,
      netProfit: overview.neto,
      totalHours,
      netPerHour: totalHours > 0 ? overview.neto / totalHours : 0,
      materialCost,
      monthlyCost,
      laborFromLogs,
    },
    series: overview.series.map((p) => ({
      month: p.key,
      label: p.label,
      zarada: p.prodaja,
      troskovi: p.troskovi + p.radnici,
      neto: p.neto,
    })),
    hallStats: {
      byWidth: [...byWidth.values()].sort((a, b) => a.width - b.width),
      bySize: [...bySize.values()]
        .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
        .slice(0, 12),
    },
    weekly: [...weekMap.values()].sort((a, b) =>
      a.weekStart < b.weekStart ? 1 : -1,
    ),
    customSubcategories,
  };
}
