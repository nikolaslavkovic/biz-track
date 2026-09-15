import { db } from "@/db";
import { expenses, projects, workers, workLogs } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function seedIfEmpty() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects);

  if (Number(count) > 0) return;

  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const monthsAgo = (n: number, day = 5) => {
    const d = new Date(today.getFullYear(), today.getMonth() - n, day);
    return iso(d);
  };

  const [p1] = await db
    .insert(projects)
    .values({
      name: "Kuća Petrović – instalacije",
      client: "Marko Petrović",
      description: "Vodovod i grejanje u novoj kući",
      startDate: monthsAgo(3, 2),
      endDate: monthsAgo(1, 20),
      status: "zavrsen",
      revenue: 480000,
    })
    .returning();

  const [p2] = await db
    .insert(projects)
    .values({
      name: "Lokal Centar – renoviranje",
      client: "Centar d.o.o.",
      description: "Cevi, farba i električne instalacije",
      startDate: monthsAgo(1, 8),
      endDate: null,
      status: "aktivan",
      revenue: 210000,
    })
    .returning();

  const [p3] = await db
    .insert(projects)
    .values({
      name: "Stan na Vračaru",
      client: "Jelena Nikolić",
      description: "Zamena instalacija u kupatilu",
      startDate: monthsAgo(0, 3),
      endDate: null,
      status: "aktivan",
      revenue: 95000,
    })
    .returning();

  const [w1] = await db
    .insert(workers)
    .values({ name: "Nikola Jovanović", hourlyRate: 1200, active: true })
    .returning();
  const [w2] = await db
    .insert(workers)
    .values({ name: "Stefan Ilić", hourlyRate: 1000, active: true })
    .returning();
  const [w3] = await db
    .insert(workers)
    .values({ name: "Darko Mitić", hourlyRate: 900, active: true })
    .returning();

  const workEntries = [
    { workerId: w1.id, date: monthsAgo(3, 5), hours: 8 },
    { workerId: w2.id, date: monthsAgo(3, 5), hours: 8 },
    { workerId: w1.id, date: monthsAgo(2, 12), hours: 7.5 },
    { workerId: w3.id, date: monthsAgo(2, 14), hours: 8 },
    { workerId: w1.id, date: monthsAgo(1, 10), hours: 8 },
    { workerId: w2.id, date: monthsAgo(1, 11), hours: 6 },
    { workerId: w3.id, date: monthsAgo(0, 4), hours: 8 },
    { workerId: w1.id, date: monthsAgo(0, 5), hours: 5 },
    { workerId: w2.id, date: monthsAgo(0, 6), hours: 8 },
  ];

  await db.insert(workLogs).values(
    workEntries.map((e) => ({ ...e, projectId: null, note: "" })),
  );

  await db.insert(expenses).values([
    {
      date: monthsAgo(3, 4),
      category: "materijal",
      subcategory: "Cevi",
      description: "PVC i bakarne cevi",
      amount: 62000,
      projectId: p1.id,
    },
    {
      date: monthsAgo(3, 6),
      category: "materijal",
      subcategory: "Farba",
      description: "Antikorozivna farba",
      amount: 18000,
      projectId: p1.id,
    },
    {
      date: monthsAgo(2, 1),
      category: "mesecni",
      subcategory: "Struja",
      description: "Račun za struju",
      amount: 14500,
      projectId: null,
    },
    {
      date: monthsAgo(2, 5),
      category: "mesecni",
      subcategory: "Porez",
      description: "Poreska obaveza firme",
      amount: 38000,
      projectId: null,
    },
    {
      date: monthsAgo(1, 9),
      category: "materijal",
      subcategory: "Žica",
      description: "Elektro žica 2.5mm",
      amount: 22000,
      projectId: p2.id,
    },
    {
      date: monthsAgo(1, 12),
      category: "materijal",
      subcategory: "Cevi",
      description: "Pex cevi",
      amount: 31000,
      projectId: p2.id,
    },
    {
      date: monthsAgo(1, 2),
      category: "mesecni",
      subcategory: "Struja",
      description: "Račun za struju",
      amount: 15200,
      projectId: null,
    },
    {
      date: monthsAgo(0, 3),
      category: "materijal",
      subcategory: "Fittings",
      description: "Spojnice i ventili",
      amount: 9800,
      projectId: p3.id,
    },
    {
      date: monthsAgo(0, 2),
      category: "mesecni",
      subcategory: "Gorivo",
      description: "Dizel za kombi",
      amount: 12000,
      projectId: null,
    },
    {
      date: monthsAgo(0, 1),
      category: "ostalo",
      subcategory: "",
      description: "Sitni alat",
      amount: 4500,
      projectId: null,
    },
  ]);
}
