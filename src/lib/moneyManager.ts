import {
  db,
  getCustomSubcategories,
  setCustomSubcategories,
  type Expense,
  type ExpenseCategory,
  type Income,
  type Project,
  type Worker,
  type WorkLog,
} from "../db";
import {
  INCOME_SUBCATEGORY_KEY,
  MONEY_MANAGER_EXPENSE,
  MONEY_MANAGER_INCOME,
  normalizeName,
  todayISO,
} from "./utils";

/** Jedna transakcija u JSON formatu (isti kao fajl iz MoneyManager-a) */
export type FileTransaction = {
  date: string;
  transaction_type: "income" | "expense";
  business_category?: string | null;
  subcategory?: string | null;
  note?: string | null;
  amount_rsd: number;
  source_currency?: string | null;
  source_amount?: number | null;
  original_category?: string | null;
  original_subcategory?: string | null;
  original_note?: string | null;
  original_currency_field?: string | null;
  app_project_id?: number | null;
};

type AppBackup = {
  version: number;
  projects?: Project[];
  workers?: Worker[];
  workLogs?: WorkLog[];
  eurToRsd?: number;
};

type FileShape = {
  totals?: { income_rsd?: number; expense_rsd?: number; transaction_count?: number };
  transactions?: FileTransaction[];
  app?: AppBackup;
};

type Resolved = {
  date: string;
  type: "income" | "expense";
  category: string;
  subcategory: string;
  note: string;
  amount: number;
  currency: string;
  sourceAmount: number;
  projectId: number | null;
};

const PREFIX = "mm:";
const LEGACY_PREFIX = "ferox:";

/** Kategorije iz ranijeg ChatGPT izvoza → pravi MoneyManager nazivi */
const LEGACY_BUSINESS_CATEGORY: Record<string, string> = {
  "Materijal": "FEROX materijal",
  "Alat i oprema": "FEROX alat",
  "Potrosni materijal": "FEROX potrosni materijal",
  "Obaveze firme": "FEROX obaveze",
  "Marketing": "FEROX marketing",
  "Radnici": "FEROX radnici",
};

const EXPENSE_BY_NAME = new Map<string, ExpenseCategory>(
  Object.entries(MONEY_MANAGER_EXPENSE)
    .filter(([key]) => key !== "mesecni")
    .map(([key, name]) => [normalizeName(name), key as ExpenseCategory]),
);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseCurrencyField(field: string): { currency: string; amount: number } | null {
  const m = /^([A-Z]{3})\s*\(([\d.,\s]+)\)$/.exec(field.trim());
  if (!m) return null;
  return { currency: m[1], amount: Number(m[2].replace(/[,\s]/g, "")) };
}

function resolve(t: FileTransaction): Resolved {
  const amount = round2(Number(t.amount_rsd));
  const category =
    text(t.original_category) ||
    (t.transaction_type === "expense"
      ? (LEGACY_BUSINESS_CATEGORY[text(t.business_category)] ?? text(t.business_category))
      : MONEY_MANAGER_INCOME) ||
    "Ostalo";
  const subcategory =
    "original_subcategory" in t ? text(t.original_subcategory) : text(t.subcategory);
  const note = "original_note" in t ? text(t.original_note) : text(t.note);
  const parsed = parseCurrencyField(text(t.original_currency_field));
  const currency = text(t.source_currency) || parsed?.currency || "RSD";
  const sourceAmount = Number(t.source_amount) || parsed?.amount || amount;
  return {
    date: t.date,
    type: t.transaction_type,
    category,
    subcategory,
    note,
    amount,
    currency,
    sourceAmount,
    projectId: t.app_project_id ?? null,
  };
}

function parseFile(raw: string): FileShape {
  const data = JSON.parse(raw.replace(/:\s*NaN\b/g, ": null")) as FileShape;
  if (!Array.isArray(data.transactions)) {
    throw new Error("Fajl nema listu „transactions“.");
  }
  data.transactions = data.transactions.filter(
    (t) =>
      /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
      (t.transaction_type === "income" || t.transaction_type === "expense") &&
      Number.isFinite(Number(t.amount_rsd)),
  );
  return data;
}

function keysFor(rows: Resolved[]): string[] {
  const seen = new Map<string, number>();
  return rows.map((r) => {
    const base = `${r.date}|${r.type}|${r.category}|${r.subcategory}|${r.note}|${r.amount}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return `${PREFIX}${base}#${n}`;
  });
}

function expenseToResolved(e: Expense): Resolved {
  return {
    date: e.date,
    type: "expense",
    category: e.originalCategory || MONEY_MANAGER_EXPENSE[e.category] || "Ostalo",
    subcategory: e.subcategory,
    note: e.description,
    amount: round2(e.amount),
    currency: e.sourceCurrency || "RSD",
    sourceAmount: e.sourceAmount || e.amount,
    projectId: e.projectId,
  };
}

function incomeToResolved(i: Income): Resolved {
  return {
    date: i.date,
    type: "income",
    category: i.originalCategory || MONEY_MANAGER_INCOME,
    subcategory: i.subcategory || (i.category === "avans" ? "Avans" : ""),
    note: i.description,
    amount: round2(i.amount),
    currency: i.sourceCurrency || "RSD",
    sourceAmount: i.sourceAmount || i.amount,
    projectId: null,
  };
}

function toFileTransaction(r: Resolved): FileTransaction {
  const amountLabel = r.sourceAmount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return {
    date: r.date,
    transaction_type: r.type,
    business_category: r.category,
    subcategory: r.subcategory,
    note: r.note,
    amount_rsd: r.amount,
    source_currency: r.currency,
    source_amount: r.sourceAmount,
    original_category: r.category,
    original_subcategory: r.subcategory || null,
    original_note: r.note || null,
    original_currency_field: r.currency === "RSD" ? "RSD" : `${r.currency} (${amountLabel})`,
    ...(r.projectId ? { app_project_id: r.projectId } : {}),
  };
}

// ---------- Provera ----------

export type CheckRow = { label: string; file: number; app: number; money: boolean; ok: boolean };

export type Verification = {
  ok: boolean;
  rows: CheckRow[];
  monthsChecked: number;
  monthsOk: number;
  groupsChecked: number;
  groupsOk: number;
  mismatches: string[];
  /** Zbirovi upisani u fajl (totals) se slažu sa transakcijama u fajlu */
  fileTotalsOk: boolean | null;
};

type Stats = {
  count: number;
  income: number;
  expense: number;
  months: Map<string, { income: number; expense: number; count: number }>;
  groups: Map<string, { amount: number; count: number }>;
};

function stats(rows: Resolved[]): Stats {
  const s: Stats = { count: 0, income: 0, expense: 0, months: new Map(), groups: new Map() };
  for (const r of rows) {
    s.count++;
    s[r.type] += r.amount;
    const m = s.months.get(r.date.slice(0, 7)) ?? { income: 0, expense: 0, count: 0 };
    m[r.type] += r.amount;
    m.count++;
    s.months.set(r.date.slice(0, 7), m);
    const gk = `${r.type === "income" ? "Prihod" : "Trošak"} · ${r.category}${r.subcategory ? ` / ${r.subcategory}` : ""}`;
    const g = s.groups.get(gk) ?? { amount: 0, count: 0 };
    g.amount += r.amount;
    g.count++;
    s.groups.set(gk, g);
  }
  return s;
}

const same = (a: number, b: number) => Math.abs(a - b) < 0.01;

function compare(file: Stats, app: Stats, fileTotalsOk: boolean | null): Verification {
  const rows: CheckRow[] = [
    { label: "Broj transakcija", file: file.count, app: app.count, money: false, ok: file.count === app.count },
    { label: "Prihodi", file: file.income, app: app.income, money: true, ok: same(file.income, app.income) },
    { label: "Troškovi", file: file.expense, app: app.expense, money: true, ok: same(file.expense, app.expense) },
    {
      label: "Neto",
      file: file.income - file.expense,
      app: app.income - app.expense,
      money: true,
      ok: same(file.income - file.expense, app.income - app.expense),
    },
  ];
  const mismatches: string[] = [];
  let monthsOk = 0;
  for (const [k, f] of file.months) {
    const a = app.months.get(k);
    if (a && a.count === f.count && same(a.income, f.income) && same(a.expense, f.expense)) monthsOk++;
    else mismatches.push(`Mesec ${k}`);
  }
  let groupsOk = 0;
  for (const [k, f] of file.groups) {
    const a = app.groups.get(k);
    if (a && a.count === f.count && same(a.amount, f.amount)) groupsOk++;
    else mismatches.push(k);
  }
  return {
    ok: rows.every((r) => r.ok) && !mismatches.length,
    rows,
    monthsChecked: file.months.size,
    monthsOk,
    groupsChecked: file.groups.size,
    groupsOk,
    mismatches,
    fileTotalsOk,
  };
}

async function verifyKeys(fileRows: Resolved[], keys: string[], fileTotalsOk: boolean | null) {
  const wanted = new Set(keys);
  const [expenses, incomes] = await Promise.all([
    db.expenses.where("importKey").startsWith(PREFIX).toArray(),
    db.incomes.where("importKey").startsWith(PREFIX).toArray(),
  ]);
  const appRows = [
    ...expenses.filter((e) => wanted.has(e.importKey!)).map(expenseToResolved),
    ...incomes.filter((i) => wanted.has(i.importKey!)).map(incomeToResolved),
  ];
  return compare(stats(fileRows), stats(appRows), fileTotalsOk);
}

// ---------- Uvoz ----------

export type ImportResult = {
  expenses: number;
  incomes: number;
  skipped: number;
  replacedLegacy: number;
  restored: { projects: number; workers: number; workLogs: number } | null;
  restoreSkipped: boolean;
  verification: Verification;
};

async function restoreApp(app: AppBackup | undefined) {
  if (!app) return { restored: null, restoreSkipped: false };
  const [projects, workers] = await Promise.all([db.projects.count(), db.workers.count()]);
  if (projects || workers) return { restored: null, restoreSkipped: true };
  const restored = {
    projects: app.projects?.length ?? 0,
    workers: app.workers?.length ?? 0,
    workLogs: app.workLogs?.length ?? 0,
  };
  await db.transaction("rw", [db.projects, db.workers, db.workLogs, db.settings], async () => {
    if (app.projects?.length) await db.projects.bulkPut(app.projects);
    if (app.workers?.length) await db.workers.bulkPut(app.workers);
    if (app.workLogs?.length) await db.workLogs.bulkPut(app.workLogs);
    if (app.eurToRsd && app.eurToRsd > 0) {
      await db.settings.put({ key: "eur_to_rsd", value: String(app.eurToRsd) });
    }
  });
  return { restored, restoreSkipped: false };
}

export async function importMoneyManagerJson(raw: string): Promise<ImportResult> {
  const data = parseFile(raw);
  const fileRows = data.transactions!.map(resolve);
  const keys = keysFor(fileRows);
  const now = new Date().toISOString();

  let fileTotalsOk: boolean | null = null;
  if (data.totals?.income_rsd != null && data.totals?.expense_rsd != null) {
    const s = stats(fileRows);
    fileTotalsOk =
      same(s.income, data.totals.income_rsd) &&
      same(s.expense, data.totals.expense_rsd) &&
      (data.totals.transaction_count == null || data.totals.transaction_count === s.count);
  }

  const { restored, restoreSkipped } = await restoreApp(data.app);
  const projectIds = new Set((await db.projects.toCollection().primaryKeys()) as number[]);

  const replacedLegacy = await db.transaction("rw", [db.expenses, db.incomes], async () => {
    const e = await db.expenses.where("importKey").startsWith(LEGACY_PREFIX).delete();
    const i = await db.incomes.where("importKey").startsWith(LEGACY_PREFIX).delete();
    return e + i;
  });

  const [prevE, prevI] = await Promise.all([
    db.expenses.where("importKey").startsWith(PREFIX).toArray(),
    db.incomes.where("importKey").startsWith(PREFIX).toArray(),
  ]);
  const existing = new Set([...prevE, ...prevI].map((r) => r.importKey!));

  const expenses: Expense[] = [];
  const incomes: Income[] = [];
  const subcats = new Map<string, Set<string>>();
  const addSub = (key: string, name: string) => {
    if (!name) return;
    if (!subcats.has(key)) subcats.set(key, new Set());
    subcats.get(key)!.add(name);
  };
  let skipped = 0;

  fileRows.forEach((r, idx) => {
    const importKey = keys[idx];
    if (existing.has(importKey)) {
      skipped++;
      return;
    }
    const source = { sourceCurrency: r.currency, sourceAmount: r.sourceAmount };
    if (r.type === "expense") {
      const category = EXPENSE_BY_NAME.get(normalizeName(r.category)) ?? "ostalo";
      if (category !== "ostalo") addSub(category, r.subcategory);
      expenses.push({
        date: r.date,
        category,
        subcategory: r.subcategory,
        description: r.note,
        amount: r.amount,
        projectId: r.projectId && projectIds.has(r.projectId) ? r.projectId : null,
        ...source,
        importKey,
        ...(category === "ostalo" ? { originalCategory: r.category } : {}),
        createdAt: now,
      });
    } else {
      addSub(INCOME_SUBCATEGORY_KEY, r.subcategory);
      incomes.push({
        date: r.date,
        category: normalizeName(r.subcategory) === "avans" ? "avans" : "prodaja",
        subcategory: r.subcategory,
        description: r.note,
        amount: r.amount,
        ...source,
        importKey,
        ...(r.category !== MONEY_MANAGER_INCOME ? { originalCategory: r.category } : {}),
        createdAt: now,
      });
    }
  });

  const custom = await getCustomSubcategories();
  for (const [key, names] of subcats) {
    const current = custom[key] ?? [];
    const lower = new Set(current.map((s) => s.toLowerCase()));
    custom[key] = [...current, ...[...names].filter((s) => !lower.has(s.toLowerCase()))];
  }

  await db.transaction("rw", [db.expenses, db.incomes, db.settings], async () => {
    if (expenses.length) await db.expenses.bulkAdd(expenses);
    if (incomes.length) await db.incomes.bulkAdd(incomes);
    await setCustomSubcategories(custom);
  });

  return {
    expenses: expenses.length,
    incomes: incomes.length,
    skipped,
    replacedLegacy,
    restored,
    restoreSkipped,
    verification: await verifyKeys(fileRows, keys, fileTotalsOk),
  };
}

export async function removeImportedData(): Promise<number> {
  return db.transaction("rw", [db.expenses, db.incomes], async () => {
    let n = 0;
    for (const prefix of [PREFIX, LEGACY_PREFIX]) {
      n += await db.expenses.where("importKey").startsWith(prefix).delete();
      n += await db.incomes.where("importKey").startsWith(prefix).delete();
    }
    return n;
  });
}

// ---------- Izvoz ----------

function sumBy<T>(rows: T[], key: (r: T) => string, value: (r: T) => number) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + value(r));
  return m;
}

export async function buildExport(): Promise<{ json: string; filename: string; count: number }> {
  const [expenses, incomes, projects, workers, workLogs, rate] = await Promise.all([
    db.expenses.toArray(),
    db.incomes.toArray(),
    db.projects.toArray(),
    db.workers.toArray(),
    db.workLogs.toArray(),
    db.settings.get("eur_to_rsd"),
  ]);
  const rows = [...expenses.map(expenseToResolved), ...incomes.map(incomeToResolved)].sort(
    (a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type),
  );
  const s = stats(rows);
  const dates = rows.map((r) => r.date);

  const byCat = (type: "income" | "expense") =>
    [...sumBy(rows.filter((r) => r.type === type), (r) => r.category, (r) => r.amount)]
      .map(([business_category, amount_rsd]) => ({ business_category, amount_rsd: round2(amount_rsd) }))
      .sort((a, b) => b.amount_rsd - a.amount_rsd);

  const payload = {
    description: "FEROX konstrukcije — izvoz iz aplikacije (isti format kao MoneyManager uvoz).",
    exported_at: new Date().toISOString(),
    period: { from: dates[0] ?? null, to: dates[dates.length - 1] ?? null },
    currency_note:
      "amount_rsd je iznos u RSD. source_currency/source_amount čuvaju originalnu valutu i iznos.",
    totals: {
      income_rsd: round2(s.income),
      expense_rsd: round2(s.expense),
      net_business_cashflow_rsd: round2(s.income - s.expense),
      transaction_count: s.count,
    },
    expense_categories: byCat("expense"),
    income_categories: byCat("income"),
    monthly_summary: [...s.months]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, m]) => ({
        month,
        expense: round2(m.expense),
        income: round2(m.income),
        net_business_cashflow_rsd: round2(m.income - m.expense),
      })),
    transactions: rows.map(toFileTransaction),
    app: {
      version: 1,
      projects,
      workers,
      workLogs,
      eurToRsd: Number(rate?.value) || undefined,
    } satisfies AppBackup,
  };
  return {
    json: JSON.stringify(payload, null, 1),
    filename: `ferox_izvoz_${todayISO()}.json`,
    count: rows.length,
  };
}
