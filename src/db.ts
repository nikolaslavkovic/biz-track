import Dexie, { type EntityTable } from "dexie";

export type ProjectStatus = "aktivan" | "zavrsen" | "pauziran";
export type RoofType = "jedna_voda" | "dve_vode";
export type SaleCurrency = "RSD" | "EUR";
export type ExpenseCategory = "materijal" | "mesecni" | "plata" | "ostalo";

export type Project = {
  id?: number;
  name: string;
  client: string;
  clientPhone: string;
  description: string;
  startDate: string;
  endDate: string | null;
  status: ProjectStatus;
  revenue: number;
  revenueCurrency: SaleCurrency;
  /** Kurs EUR→RSD zaključan u trenutku unosa — ne menja se kad se menja globalni kurs */
  eurRateAtSale: number;
  lengthM: number;
  widthM: number;
  heightM: number;
  roofType: RoofType;
  createdAt: string;
};

export type Worker = {
  id?: number;
  name: string;
  hourlyRate: number;
  active: boolean;
  createdAt: string;
};

export type WorkLog = {
  id?: number;
  workerId: number;
  date: string;
  hours: number;
  note: string;
  createdAt: string;
};

export type Expense = {
  id?: number;
  date: string;
  category: ExpenseCategory;
  subcategory: string;
  description: string;
  amount: number;
  projectId: number | null;
  createdAt: string;
};

export type AppSetting = {
  key: string;
  value: string;
};

class FirmaDB extends Dexie {
  projects!: EntityTable<Project, "id">;
  workers!: EntityTable<Worker, "id">;
  workLogs!: EntityTable<WorkLog, "id">;
  expenses!: EntityTable<Expense, "id">;
  settings!: EntityTable<AppSetting, "key">;

  constructor() {
    super("FirmaRacunDB");
    this.version(1).stores({
      projects: "++id, startDate, status, widthM",
      workers: "++id, name, active",
      workLogs: "++id, workerId, date",
      expenses: "++id, date, category, projectId",
      settings: "key",
    });
    this.version(2)
      .stores({
        projects: "++id, startDate, status, widthM, createdAt",
        workers: "++id, name, active",
        workLogs: "++id, workerId, date",
        expenses: "++id, date, category, projectId",
        settings: "key",
      })
      .upgrade(async (tx) => {
        const row = await tx.table("settings").get("eur_to_rsd");
        const rate = Number(row?.value);
        const fallback = Number.isFinite(rate) && rate > 0 ? rate : 117;
        await tx
          .table("projects")
          .toCollection()
          .modify((p: Project) => {
            if (p.eurRateAtSale == null || !(p.eurRateAtSale > 0)) {
              p.eurRateAtSale = fallback;
            }
          });
      });
  }
}

export const db = new FirmaDB();

export async function getEurToRsdRate(): Promise<number> {
  const row = await db.settings.get("eur_to_rsd");
  const rate = Number(row?.value);
  return Number.isFinite(rate) && rate > 0 ? rate : 117;
}

export async function setEurToRsdRate(rate: number) {
  await db.settings.put({ key: "eur_to_rsd", value: String(rate) });
}
