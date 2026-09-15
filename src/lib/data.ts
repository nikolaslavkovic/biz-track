import {
  db,
  getEurToRsdRate,
  type Project,
  type Worker,
  type WorkLog,
  type Expense,
} from "../db";
import {
  formatWeekRange,
  monthKey,
  toRsd,
  weekStartISO,
} from "./utils";

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
      cost: number;
    }>;
  }>;
};

export async function loadDashboardData(): Promise<DashboardData> {
  const [projects, workers, workLogs, expenses, eurToRsd] = await Promise.all([
    db.projects.orderBy("startDate").reverse().toArray(),
    db.workers.orderBy("name").toArray(),
    db.workLogs.orderBy("date").reverse().toArray(),
    db.expenses.orderBy("date").reverse().toArray(),
    getEurToRsdRate(),
  ]);

  const workerMap = new Map(workers.map((w) => [w.id!, w]));

  const revenue = projects.reduce(
    (s, p) => s + toRsd(p.revenue, p.revenueCurrency, eurToRsd),
    0,
  );
  const materialCost = expenses
    .filter((e) => e.category === "materijal")
    .reduce((s, e) => s + e.amount, 0);
  const monthlyCost = expenses
    .filter((e) => e.category === "mesecni")
    .reduce((s, e) => s + e.amount, 0);
  const payrollExpenses = expenses
    .filter((e) => e.category === "plata")
    .reduce((s, e) => s + e.amount, 0);
  const otherCost = expenses
    .filter((e) => e.category === "ostalo")
    .reduce((s, e) => s + e.amount, 0);

  let totalHours = 0;
  let laborFromLogs = 0;
  for (const log of workLogs) {
    const w = workerMap.get(log.workerId);
    totalHours += log.hours;
    laborFromLogs += log.hours * (w?.hourlyRate || 0);
  }

  const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCosts =
    payrollExpenses > 0
      ? expensesTotal
      : materialCost + monthlyCost + otherCost + laborFromLogs;
  const netProfit = revenue - totalCosts;
  const netPerHour = totalHours > 0 ? netProfit / totalHours : 0;

  const now = new Date();
  const keys: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  const series = keys.map((key) => {
    const monthExpenses = expenses.filter((e) => monthKey(e.date) === key);
    const monthWork = workLogs.filter((w) => monthKey(w.date) === key);
    const monthProjects = projects.filter((p) => {
      const end = p.endDate ?? p.startDate;
      return monthKey(p.startDate) === key || monthKey(end) === key;
    });
    const troskovi = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const plata = monthExpenses
      .filter((e) => e.category === "plata")
      .reduce((s, e) => s + e.amount, 0);
    const rad = monthWork.reduce((s, log) => {
      const w = workerMap.get(log.workerId);
      return s + log.hours * (w?.hourlyRate || 0);
    }, 0);
    const zarada = monthProjects.reduce(
      (s, p) => s + toRsd(p.revenue, p.revenueCurrency, eurToRsd),
      0,
    );
    const costs = plata > 0 ? troskovi : troskovi + rad;
    const [y, m] = key.split("-").map(Number);
    const label = new Intl.DateTimeFormat("sr-RS", {
      month: "short",
      year: "2-digit",
    }).format(new Date(y, m - 1, 1));
    return { month: key, label, zarada, troskovi: costs, neto: zarada - costs };
  });

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
    const rev = toRsd(p.revenue, p.revenueCurrency, eurToRsd);
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
    const sl = `${p.widthM}×${p.lengthM}×${p.heightM}`;
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
    const cost = log.hours * w.hourlyRate;
    week.totalHours += log.hours;
    week.totalCost += cost;
    const existing = week.workers.find((x) => x.workerId === log.workerId);
    if (existing) {
      existing.hours += log.hours;
      existing.cost += cost;
    } else {
      week.workers.push({
        workerId: log.workerId,
        workerName: w.name,
        hourlyRate: w.hourlyRate,
        hours: log.hours,
        cost,
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
      revenue,
      totalCosts,
      netProfit,
      totalHours,
      netPerHour,
      materialCost,
      monthlyCost,
      laborFromLogs,
    },
    series,
    hallStats: {
      byWidth: [...byWidth.values()].sort((a, b) => a.width - b.width),
      bySize: [...bySize.values()]
        .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
        .slice(0, 12),
    },
    weekly: [...weekMap.values()].sort((a, b) =>
      a.weekStart < b.weekStart ? 1 : -1,
    ),
  };
}
