import { db, type AppSetting, type Expense, type Income, type Project, type Worker, type WorkLog } from "../db";

const KEEP_KEYS = new Set(["cloud_code", "cloud_updated_at"]);

export type AppSnapshot = {
  projects: Project[];
  workers: Worker[];
  workLogs: WorkLog[];
  expenses: Expense[];
  incomes: Income[];
  settings: AppSetting[];
};

export async function readSnapshot(): Promise<AppSnapshot> {
  const [projects, workers, workLogs, expenses, incomes, settings] = await Promise.all([
    db.projects.toArray(),
    db.workers.toArray(),
    db.workLogs.toArray(),
    db.expenses.toArray(),
    db.incomes.toArray(),
    db.settings.toArray(),
  ]);
  return {
    projects,
    workers,
    workLogs,
    expenses,
    incomes,
    settings: settings.filter((s) => !KEEP_KEYS.has(s.key)),
  };
}

export async function writeSnapshot(snapshot: AppSnapshot): Promise<void> {
  const keep = await db.settings.bulkGet([...KEEP_KEYS]);
  await db.transaction(
    "rw",
    [db.projects, db.workers, db.workLogs, db.expenses, db.incomes, db.settings],
    async () => {
      await Promise.all([
        db.projects.clear(),
        db.workers.clear(),
        db.workLogs.clear(),
        db.expenses.clear(),
        db.incomes.clear(),
        db.settings.clear(),
      ]);
      if (snapshot.projects.length) await db.projects.bulkPut(snapshot.projects);
      if (snapshot.workers.length) await db.workers.bulkPut(snapshot.workers);
      if (snapshot.workLogs.length) await db.workLogs.bulkPut(snapshot.workLogs);
      if (snapshot.expenses.length) await db.expenses.bulkPut(snapshot.expenses);
      if (snapshot.incomes.length) await db.incomes.bulkPut(snapshot.incomes);
      const settings = [
        ...(snapshot.settings ?? []).filter((s) => !KEEP_KEYS.has(s.key)),
        ...keep.filter((s): s is AppSetting => !!s),
      ];
      if (settings.length) await db.settings.bulkPut(settings);
    },
  );
}

export function snapshotIsEmpty(s: AppSnapshot): boolean {
  return (
    s.projects.length +
      s.workers.length +
      s.workLogs.length +
      s.expenses.length +
      s.incomes.length ===
    0
  );
}

function newer(a?: string, b?: string) {
  return (a ?? "") >= (b ?? "");
}

function mergeById<T extends { id?: number; createdAt?: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<number, T>();
  const extras: T[] = [];
  for (const item of [...remote, ...local]) {
    if (item.id == null) {
      extras.push(item);
      continue;
    }
    const prev = map.get(item.id);
    if (!prev || newer(item.createdAt, prev.createdAt)) map.set(item.id, item);
  }
  return [...map.values(), ...extras];
}

function mergeMoney<T extends { id?: number; importKey?: string; createdAt?: string }>(
  local: T[],
  remote: T[],
): T[] {
  const byImport = new Map<string, T>();
  const byId = new Map<number, T>();
  const rest: T[] = [];
  for (const item of [...remote, ...local]) {
    if (item.importKey) {
      const prev = byImport.get(item.importKey);
      if (!prev || newer(item.createdAt, prev.createdAt)) byImport.set(item.importKey, item);
      continue;
    }
    if (item.id != null) {
      const prev = byId.get(item.id);
      if (!prev || newer(item.createdAt, prev.createdAt)) byId.set(item.id, item);
      continue;
    }
    rest.push(item);
  }
  return [...byImport.values(), ...byId.values(), ...rest];
}

export function mergeSnapshots(local: AppSnapshot, remote: AppSnapshot): AppSnapshot {
  const settings = new Map<string, AppSetting>();
  for (const row of [...(remote.settings ?? []), ...(local.settings ?? [])]) {
    if (!KEEP_KEYS.has(row.key)) settings.set(row.key, row);
  }
  return {
    projects: mergeById(local.projects, remote.projects),
    workers: mergeById(local.workers, remote.workers),
    workLogs: mergeById(local.workLogs, remote.workLogs),
    expenses: mergeMoney(local.expenses, remote.expenses),
    incomes: mergeMoney(local.incomes, remote.incomes),
    settings: [...settings.values()],
  };
}
