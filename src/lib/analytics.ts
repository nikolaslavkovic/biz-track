import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { expenses, projects, settings, workers, workLogs } from "@/db/schema";
import {
  formatWeekRange,
  monthKey,
  toRsd,
  weekEndISO,
  weekStartISO,
} from "@/lib/utils";

export async function getEurToRsdRate(): Promise<number> {
  const row = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "eur_to_rsd"))
    .limit(1);
  const rate = Number(row[0]?.value);
  return Number.isFinite(rate) && rate > 0 ? rate : 117;
}

export function projectRevenueRsd(
  project: { revenue: number; revenueCurrency?: string | null },
  eurToRsd: number,
): number {
  return toRsd(project.revenue, project.revenueCurrency ?? "RSD", eurToRsd);
}

export type Summary = {
  revenue: number;
  expensesTotal: number;
  materialCost: number;
  monthlyCost: number;
  otherCost: number;
  laborFromLogs: number;
  payrollExpenses: number;
  totalCosts: number;
  netProfit: number;
  totalHours: number;
  netPerHour: number;
  activeProjects: number;
  completedProjects: number;
};

export async function getSummary(from?: string, to?: string): Promise<Summary> {
  const eurToRsd = await getEurToRsdRate();
  const expenseConds = [];
  const workConds = [];

  if (from) {
    expenseConds.push(gte(expenses.date, from));
    workConds.push(gte(workLogs.date, from));
  }
  if (to) {
    expenseConds.push(lte(expenses.date, to));
    workConds.push(lte(workLogs.date, to));
  }

  const expenseRows = await db
    .select()
    .from(expenses)
    .where(expenseConds.length ? and(...expenseConds) : undefined);

  const workRows = await db
    .select({
      hours: workLogs.hours,
      rate: workers.hourlyRate,
      date: workLogs.date,
    })
    .from(workLogs)
    .innerJoin(workers, eq(workLogs.workerId, workers.id))
    .where(workConds.length ? and(...workConds) : undefined);

  let projectRows = await db.select().from(projects);
  if (from || to) {
    projectRows = projectRows.filter((p) => {
      const start = p.startDate;
      const end = p.endDate ?? p.startDate;
      if (from && end < from) return false;
      if (to && start > to) return false;
      return true;
    });
  }

  const revenue = projectRows.reduce(
    (s, p) => s + projectRevenueRsd(p, eurToRsd),
    0,
  );

  let materialCost = 0;
  let monthlyCost = 0;
  let otherCost = 0;
  let payrollExpenses = 0;
  let expensesTotal = 0;

  for (const e of expenseRows) {
    expensesTotal += e.amount;
    if (e.category === "materijal") materialCost += e.amount;
    else if (e.category === "mesecni") monthlyCost += e.amount;
    else if (e.category === "plata") payrollExpenses += e.amount;
    else otherCost += e.amount;
  }

  let totalHours = 0;
  let laborFromLogs = 0;
  for (const w of workRows) {
    totalHours += w.hours;
    laborFromLogs += w.hours * w.rate;
  }

  // Prefer explicit payroll expenses if present; otherwise use hours × rate.
  const costsWithoutPayroll = materialCost + monthlyCost + otherCost;
  const totalCosts =
    payrollExpenses > 0
      ? expensesTotal
      : costsWithoutPayroll + laborFromLogs;

  const netProfit = revenue - totalCosts;
  const netPerHour = totalHours > 0 ? netProfit / totalHours : 0;

  const activeProjects = projectRows.filter((p) => p.status === "aktivan").length;
  const completedProjects = projectRows.filter(
    (p) => p.status === "zavrsen",
  ).length;

  return {
    revenue,
    expensesTotal,
    materialCost,
    monthlyCost,
    otherCost,
    laborFromLogs,
    payrollExpenses,
    totalCosts,
    netProfit,
    totalHours,
    netPerHour,
    activeProjects,
    completedProjects,
  };
}

export async function getMonthlySeries(monthsBack = 6) {
  const eurToRsd = await getEurToRsdRate();
  const now = new Date();
  const keys: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  const from = `${keys[0]}-01`;
  const expenseRows = await db
    .select()
    .from(expenses)
    .where(gte(expenses.date, from));

  const workRows = await db
    .select({
      hours: workLogs.hours,
      rate: workers.hourlyRate,
      date: workLogs.date,
    })
    .from(workLogs)
    .innerJoin(workers, eq(workLogs.workerId, workers.id))
    .where(gte(workLogs.date, from));

  const projectRows = await db.select().from(projects);

  return keys.map((key) => {
    const monthExpenses = expenseRows.filter((e) => monthKey(e.date) === key);
    const monthWork = workRows.filter((w) => monthKey(w.date) === key);
    const monthProjects = projectRows.filter((p) => {
      const end = p.endDate ?? p.startDate;
      return monthKey(p.startDate) === key || monthKey(end) === key;
    });

    const troskovi = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const materijal = monthExpenses
      .filter((e) => e.category === "materijal")
      .reduce((s, e) => s + e.amount, 0);
    const mesecni = monthExpenses
      .filter((e) => e.category === "mesecni")
      .reduce((s, e) => s + e.amount, 0);
    const plata = monthExpenses
      .filter((e) => e.category === "plata")
      .reduce((s, e) => s + e.amount, 0);
    const sati = monthWork.reduce((s, w) => s + w.hours, 0);
    const rad = monthWork.reduce((s, w) => s + w.hours * w.rate, 0);
    const zarada = monthProjects.reduce(
      (s, p) => s + projectRevenueRsd(p, eurToRsd),
      0,
    );
    const costs = plata > 0 ? troskovi : troskovi + rad;

    return {
      month: key,
      label: formatMonthLabel(key),
      zarada,
      troskovi: costs,
      materijal,
      mesecni,
      sati,
      neto: zarada - costs,
    };
  });
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("sr-RS", {
    month: "short",
    year: "2-digit",
  }).format(d);
}

export async function getDashboardData(from?: string, to?: string) {
  const [
    summary,
    series,
    recentExpenses,
    recentWork,
    activeProjects,
    hallStats,
    eurToRsd,
  ] = await Promise.all([
    getSummary(from, to),
    getMonthlySeries(8),
    db.select().from(expenses).orderBy(desc(expenses.date)).limit(8),
    db
      .select({
        id: workLogs.id,
        date: workLogs.date,
        hours: workLogs.hours,
        note: workLogs.note,
        workerName: workers.name,
      })
      .from(workLogs)
      .innerJoin(workers, eq(workLogs.workerId, workers.id))
      .orderBy(desc(workLogs.date))
      .limit(8),
    db
      .select()
      .from(projects)
      .where(eq(projects.status, "aktivan"))
      .orderBy(asc(projects.startDate)),
    getHallDimensionStats(),
    getEurToRsdRate(),
  ]);

  return {
    summary,
    series,
    recentExpenses,
    recentWork,
    activeProjects,
    hallStats,
    eurToRsd,
  };
}

/** Aggregate halls by width and by full dimension key for charts. */
export async function getHallDimensionStats() {
  const eurToRsd = await getEurToRsdRate();
  const rows = await db.select().from(projects);
  const byWidth = new Map<
    string,
    { width: number; label: string; count: number; revenue: number }
  >();
  const bySize = new Map<
    string,
    {
      label: string;
      width: number;
      length: number;
      height: number;
      count: number;
      revenue: number;
      roofJedna: number;
      roofDve: number;
    }
  >();

  for (const p of rows) {
    if (!p.widthM) continue;
    const rev = projectRevenueRsd(p, eurToRsd);
    const widthKey = String(p.widthM);
    const widthRow = byWidth.get(widthKey) ?? {
      width: p.widthM,
      label: `${p.widthM} m`,
      count: 0,
      revenue: 0,
    };
    widthRow.count += 1;
    widthRow.revenue += rev;
    byWidth.set(widthKey, widthRow);

    const sizeLabel = `${p.widthM}×${p.lengthM}×${p.heightM}`;
    const sizeRow = bySize.get(sizeLabel) ?? {
      label: sizeLabel,
      width: p.widthM,
      length: p.lengthM,
      height: p.heightM,
      count: 0,
      revenue: 0,
      roofJedna: 0,
      roofDve: 0,
    };
    sizeRow.count += 1;
    sizeRow.revenue += rev;
    if (p.roofType === "jedna_voda") sizeRow.roofJedna += 1;
    else sizeRow.roofDve += 1;
    bySize.set(sizeLabel, sizeRow);
  }

  return {
    byWidth: [...byWidth.values()].sort((a, b) => a.width - b.width),
    bySize: [...bySize.values()]
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 12),
  };
}

export async function listProjects() {
  return db.select().from(projects).orderBy(desc(projects.startDate));
}

export async function listWorkers() {
  return db.select().from(workers).orderBy(asc(workers.name));
}

export async function listExpenses() {
  return db
    .select({
      id: expenses.id,
      date: expenses.date,
      category: expenses.category,
      subcategory: expenses.subcategory,
      description: expenses.description,
      amount: expenses.amount,
      projectId: expenses.projectId,
      projectName: projects.name,
    })
    .from(expenses)
    .leftJoin(projects, eq(expenses.projectId, projects.id))
    .orderBy(desc(expenses.date));
}

export async function listWorkLogs() {
  return db
    .select({
      id: workLogs.id,
      date: workLogs.date,
      hours: workLogs.hours,
      note: workLogs.note,
      workerId: workLogs.workerId,
      workerName: workers.name,
      hourlyRate: workers.hourlyRate,
      cost: sql<number>`${workLogs.hours} * ${workers.hourlyRate}`.as("cost"),
    })
    .from(workLogs)
    .innerJoin(workers, eq(workLogs.workerId, workers.id))
    .orderBy(desc(workLogs.date));
}

export type WeeklyPayrollRow = {
  workerId: number;
  workerName: string;
  hourlyRate: number;
  hours: number;
  cost: number;
};

export type WeeklyPayroll = {
  weekStart: string;
  weekEnd: string;
  label: string;
  totalHours: number;
  totalCost: number;
  workers: WeeklyPayrollRow[];
  logIds: number[];
};

/** Group work logs by calendar week (Mon–Sun) for payday overview. */
export async function getWeeklyPayroll(): Promise<WeeklyPayroll[]> {
  const logs = await listWorkLogs();
  const map = new Map<string, WeeklyPayroll>();

  for (const log of logs) {
    const weekStart = weekStartISO(log.date);
    let week = map.get(weekStart);
    if (!week) {
      week = {
        weekStart,
        weekEnd: weekEndISO(weekStart),
        label: formatWeekRange(weekStart),
        totalHours: 0,
        totalCost: 0,
        workers: [],
        logIds: [],
      };
      map.set(weekStart, week);
    }

    week.logIds.push(log.id);
    week.totalHours += log.hours;
    const cost = Number(log.cost) || log.hours * log.hourlyRate;
    week.totalCost += cost;

    const existing = week.workers.find((w) => w.workerId === log.workerId);
    if (existing) {
      existing.hours += log.hours;
      existing.cost += cost;
    } else {
      week.workers.push({
        workerId: log.workerId,
        workerName: log.workerName,
        hourlyRate: log.hourlyRate,
        hours: log.hours,
        cost,
      });
    }
  }

  return [...map.values()]
    .map((w) => ({
      ...w,
      workers: w.workers.sort((a, b) =>
        a.workerName.localeCompare(b.workerName, "sr"),
      ),
    }))
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
}
