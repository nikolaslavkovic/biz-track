import { db } from "./db";
import { todayISO, weekStartISO } from "./lib/utils";

function monthsAgo(n: number, day = 5): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}

let seeding: Promise<void> | null = null;

/** React StrictMode u dev-u poziva efekat dvaput — deli isti poziv da ne bi duplirao podatke */
export function seedIfEmpty(): Promise<void> {
  seeding ??= seed();
  return seeding;
}

async function seed() {
  const count = await db.projects.count();
  const rate = await db.settings.get("eur_to_rsd");
  if (!rate) await db.settings.put({ key: "eur_to_rsd", value: "117" });
  if (count > 0) return;

  const now = new Date().toISOString();

  const p1 = await db.projects.add({
    name: "Hala Petrović",
    client: "Marko Petrović",
    clientPhone: "060 111 2233",
    description: "Čelična konstrukcija, krov na dve vode",
    startDate: monthsAgo(3, 2),
    endDate: monthsAgo(1, 20),
    status: "zavrsen",
    revenue: 1850000,
    revenueCurrency: "RSD",
    eurRateAtSale: 117,
    lengthM: 24,
    widthM: 12,
    heightM: 5,
    roofType: "dve_vode",
    sortOrder: 1,
    createdAt: now,
  });

  const p2 = await db.projects.add({
    name: "Hala Centar",
    client: "Centar d.o.o.",
    clientPhone: "011 200 300",
    description: "Veća čelična hala",
    startDate: monthsAgo(1, 8),
    endDate: null,
    status: "aktivan",
    revenue: 3200000,
    revenueCurrency: "RSD",
    eurRateAtSale: 117,
    lengthM: 30,
    widthM: 15,
    heightM: 6,
    roofType: "dve_vode",
    sortOrder: 2,
    createdAt: now,
  });

  await db.projects.add({
    name: "Hala Nikolić",
    client: "Jelena Nikolić",
    clientPhone: "064 555 7788",
    description: "Manja hala, krov na jednu vodu",
    startDate: monthsAgo(0, 3),
    endDate: null,
    status: "aktivan",
    revenue: 8400,
    revenueCurrency: "EUR",
    eurRateAtSale: 117,
    lengthM: 18,
    widthM: 10,
    heightM: 4.5,
    roofType: "jedna_voda",
    sortOrder: 3,
    createdAt: now,
  });

  await db.projects.add({
    name: "Hala Jovanović",
    client: "Petar Jovanović",
    clientPhone: "063 100 200",
    description: "",
    startDate: monthsAgo(2, 10),
    endDate: monthsAgo(1, 5),
    status: "zavrsen",
    revenue: 1400000,
    revenueCurrency: "RSD",
    eurRateAtSale: 117,
    lengthM: 20,
    widthM: 12,
    heightM: 5,
    roofType: "dve_vode",
    sortOrder: 4,
    createdAt: now,
  });

  const w1 = await db.workers.add({
    name: "Nikola Jovanović",
    hourlyRate: 1200,
    active: true,
    createdAt: now,
  });
  const w2 = await db.workers.add({
    name: "Stefan Ilić",
    hourlyRate: 1000,
    active: true,
    createdAt: now,
  });
  const w3 = await db.workers.add({
    name: "Darko Mitić",
    hourlyRate: 900,
    active: true,
    createdAt: now,
  });

  await db.workLogs.bulkAdd([
    {
      workerId: w1 as number,
      date: weekStartISO(monthsAgo(1, 10)),
      hours: 40,
      note: "Nedelja",
      createdAt: now,
    },
    {
      workerId: w2 as number,
      date: weekStartISO(monthsAgo(1, 10)),
      hours: 35,
      note: "Nedelja",
      createdAt: now,
    },
    {
      workerId: w3 as number,
      date: weekStartISO(monthsAgo(0, 4)),
      hours: 40,
      note: "Nedelja",
      createdAt: now,
    },
    {
      workerId: w1 as number,
      date: weekStartISO(monthsAgo(0, 5)),
      hours: 30,
      note: "Nedelja",
      createdAt: now,
    },
  ]);

  await db.expenses.bulkAdd([
    {
      date: monthsAgo(1, 9),
      category: "materijal",
      subcategory: "Cevi za CNC sečenje",
      description: "Čelični profili",
      amount: 320000,
      projectId: p1 as number,
      createdAt: now,
    },
    {
      date: monthsAgo(1, 2),
      category: "obaveze",
      subcategory: "Struja",
      description: "Račun",
      amount: 15200,
      projectId: null,
      createdAt: now,
    },
    {
      date: todayISO(),
      category: "materijal",
      subcategory: "Farba",
      description: "Antikorozivna",
      amount: 28000,
      projectId: p2 as number,
      createdAt: now,
    },
    {
      date: monthsAgo(0, 2),
      category: "obaveze",
      subcategory: "Gorivo",
      description: "Dizel",
      amount: 12000,
      projectId: null,
      createdAt: now,
    },
  ]);
}
