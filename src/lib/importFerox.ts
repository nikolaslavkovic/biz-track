import {
  db,
  getCustomSubcategories,
  setCustomSubcategories,
  type Expense,
  type ExpenseCategory,
  type Income,
  type IncomeCategory,
} from "../db";

type SourceTransaction = {
  date: string;
  transaction_type: "income" | "expense";
  business_category: string;
  subcategory?: string | null;
  note?: string | null;
  amount_rsd: number;
  source_currency?: string | null;
  source_amount?: number | null;
};

const IMPORT_PREFIX = "ferox:";

const EXPENSE_MAP: Record<string, { category: ExpenseCategory; subcategory?: string }> = {
  "Materijal": { category: "materijal" },
  "Alat i oprema": { category: "alat" },
  "Potrosni materijal": { category: "potrosni" },
  "Obaveze firme": { category: "obaveze" },
  "Marketing": { category: "obaveze", subcategory: "Marketing" },
  "Radnici": { category: "plata" },
};

const INCOME_MAP: Record<string, IncomeCategory> = {
  "Prodaja konstrukcija": "prodaja",
  "Avans": "avans",
};

const SUBCATEGORY_TARGETS: ExpenseCategory[] = ["alat", "materijal", "potrosni", "obaveze"];

export type ImportResult = {
  expenses: number;
  incomes: number;
  skipped: number;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** MoneyManager izvoz sadrži `NaN`, što nije validan JSON */
function parse(raw: string): SourceTransaction[] {
  const data = JSON.parse(raw.replace(/:\s*NaN\b/g, ": null")) as {
    transactions?: SourceTransaction[];
  };
  if (!Array.isArray(data.transactions)) {
    throw new Error("Fajl nema listu „transactions“.");
  }
  return data.transactions.filter(
    (t) =>
      /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
      (t.transaction_type === "income" || t.transaction_type === "expense") &&
      Number.isFinite(Number(t.amount_rsd)),
  );
}

export async function importFeroxJson(raw: string): Promise<ImportResult> {
  const transactions = parse(raw);
  const now = new Date().toISOString();

  const [prevExpenses, prevIncomes] = await Promise.all([
    db.expenses.where("importKey").startsWith(IMPORT_PREFIX).toArray(),
    db.incomes.where("importKey").startsWith(IMPORT_PREFIX).toArray(),
  ]);
  const existing = new Set(
    [...prevExpenses, ...prevIncomes].map((row) => row.importKey!),
  );

  const seen = new Map<string, number>();
  const expenses: Expense[] = [];
  const incomes: Income[] = [];
  const newSubcategories = new Map<ExpenseCategory, Set<string>>();
  let skipped = 0;

  for (const t of transactions) {
    const sub = text(t.subcategory);
    const note = text(t.note);
    const amount = Math.round(Number(t.amount_rsd) * 100) / 100;
    const base = `${t.date}|${t.transaction_type}|${t.business_category}|${sub}|${note}|${amount}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const importKey = `${IMPORT_PREFIX}${base}#${n}`;
    if (existing.has(importKey)) {
      skipped++;
      continue;
    }
    const source = {
      sourceCurrency: text(t.source_currency) || "RSD",
      sourceAmount: Number(t.source_amount) || amount,
    };

    if (t.transaction_type === "expense") {
      const mapped = EXPENSE_MAP[t.business_category];
      const category = mapped?.category ?? "ostalo";
      const subcategory = mapped
        ? (mapped.subcategory ?? sub)
        : sub || t.business_category;
      if (subcategory && SUBCATEGORY_TARGETS.includes(category)) {
        if (!newSubcategories.has(category)) newSubcategories.set(category, new Set());
        newSubcategories.get(category)!.add(subcategory);
      }
      expenses.push({
        date: t.date,
        category,
        subcategory,
        description: note,
        amount,
        projectId: null,
        ...source,
        importKey,
        createdAt: now,
      });
    } else {
      const category = INCOME_MAP[t.business_category] ?? "ostalo";
      incomes.push({
        date: t.date,
        category,
        subcategory: category === "ostalo" ? t.business_category : "",
        description: note,
        amount,
        ...source,
        importKey,
        createdAt: now,
      });
    }
  }

  const custom = await getCustomSubcategories();
  for (const [category, names] of newSubcategories) {
    const current = custom[category] ?? [];
    const lower = new Set(current.map((s) => s.toLowerCase()));
    custom[category] = [
      ...current,
      ...[...names].filter((s) => !lower.has(s.toLowerCase())),
    ];
  }

  await db.transaction("rw", [db.expenses, db.incomes, db.settings], async () => {
    if (expenses.length) await db.expenses.bulkAdd(expenses);
    if (incomes.length) await db.incomes.bulkAdd(incomes);
    await setCustomSubcategories(custom);
  });

  return { expenses: expenses.length, incomes: incomes.length, skipped };
}

export async function removeImportedData(): Promise<number> {
  return db.transaction("rw", [db.expenses, db.incomes], async () => {
    const e = await db.expenses.where("importKey").startsWith(IMPORT_PREFIX).delete();
    const i = await db.incomes.where("importKey").startsWith(IMPORT_PREFIX).delete();
    return e + i;
  });
}
