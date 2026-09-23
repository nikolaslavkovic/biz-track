import { db } from "./db";

const SAMPLE_PROJECTS = [
  { name: "Hala Petrović", clientPhone: "060 111 2233" },
  { name: "Hala Centar", clientPhone: "011 200 300" },
  { name: "Hala Nikolić", clientPhone: "064 555 7788" },
  { name: "Hala Jovanović", clientPhone: "063 100 200" },
];

const SAMPLE_WORKERS = [
  { name: "Nikola Jovanović", hourlyRate: 1200 },
  { name: "Stefan Ilić", hourlyRate: 1000 },
  { name: "Darko Mitić", hourlyRate: 900 },
];

const SAMPLE_EXPENSES = [
  { description: "Čelični profili", amount: 320000 },
  { description: "Račun", amount: 15200 },
  { description: "Antikorozivna", amount: 28000 },
  { description: "Dizel", amount: 12000 },
];

const CLEANUP_FLAG = "sample_data_removed";

let initializing: Promise<void> | null = null;

/** React StrictMode u dev-u poziva efekat dvaput — deli isti poziv */
export function initDatabase(): Promise<void> {
  initializing ??= init();
  return initializing;
}

async function init() {
  const rate = await db.settings.get("eur_to_rsd");
  if (!rate) await db.settings.put({ key: "eur_to_rsd", value: "117" });
  if (await db.settings.get(CLEANUP_FLAG)) return;
  await removeSampleData();
  await db.settings.put({ key: CLEANUP_FLAG, value: new Date().toISOString() });
}

/** Briše samo probne podatke koje je ranija verzija automatski ubacivala */
async function removeSampleData() {
  await db.transaction("rw", [db.projects, db.workers, db.workLogs, db.expenses], async () => {
    await db.projects
      .filter((p) =>
        SAMPLE_PROJECTS.some(
          (s) => s.name === p.name && s.clientPhone === p.clientPhone,
        ),
      )
      .delete();

    const workerIds = (
      await db.workers
        .filter((w) =>
          SAMPLE_WORKERS.some(
            (s) => s.name === w.name && s.hourlyRate === w.hourlyRate,
          ),
        )
        .toArray()
    ).map((w) => w.id!);
    if (workerIds.length) {
      await db.workLogs.where("workerId").anyOf(workerIds).delete();
      await db.workers.bulkDelete(workerIds);
    }

    await db.expenses
      .filter((e) =>
        SAMPLE_EXPENSES.some(
          (s) => s.description === e.description && s.amount === e.amount,
        ),
      )
      .delete();
  });
}
