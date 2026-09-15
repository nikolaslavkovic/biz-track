import { db } from "@/db";
import { expenses, projects, workers, workLogs } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function seedIfEmpty() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects);

  if (Number(count) > 0) {
    // Backfill demo dimensions on existing seed projects if still empty
    await db
      .update(projects)
      .set({
        lengthM: 24,
        widthM: 12,
        heightM: 5,
        roofType: "dve_vode",
        clientPhone: "060 111 2233",
      })
      .where(sql`${projects.widthM} = 0 AND ${projects.name} LIKE '%Petrović%'`);
    await db
      .update(projects)
      .set({
        lengthM: 30,
        widthM: 15,
        heightM: 6,
        roofType: "dve_vode",
        clientPhone: "011 200 300",
        name: "Hala Centar – čelična konstrukcija",
        description: "Čelična hala sa krovom na dve vode",
      })
      .where(sql`${projects.widthM} = 0 AND ${projects.name} LIKE '%Centar%'`);
    await db
      .update(projects)
      .set({
        lengthM: 18,
        widthM: 10,
        heightM: 4.5,
        roofType: "jedna_voda",
        clientPhone: "064 555 7788",
        name: "Hala Nikolić",
        description: "Manja čelična hala, krov na jednu vodu",
      })
      .where(sql`${projects.widthM} = 0 AND ${projects.name} LIKE '%Vračaru%'`);
    return;
  }

  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const monthsAgo = (n: number, day = 5) => {
    const d = new Date(today.getFullYear(), today.getMonth() - n, day);
    return iso(d);
  };

  const [p1] = await db
    .insert(projects)
    .values({
      name: "Hala Petrović",
      client: "Marko Petrović",
      clientPhone: "060 111 2233",
      description: "Čelična konstrukcija, krov na dve vode",
      startDate: monthsAgo(3, 2),
      endDate: monthsAgo(1, 20),
      status: "zavrsen",
      revenue: 1850000,
      lengthM: 24,
      widthM: 12,
      heightM: 5,
      roofType: "dve_vode",
    })
    .returning();

  const [p2] = await db
    .insert(projects)
    .values({
      name: "Hala Centar",
      client: "Centar d.o.o.",
      clientPhone: "011 200 300",
      description: "Veća čelična hala",
      startDate: monthsAgo(1, 8),
      endDate: null,
      status: "aktivan",
      revenue: 3200000,
      lengthM: 30,
      widthM: 15,
      heightM: 6,
      roofType: "dve_vode",
    })
    .returning();

  const [p3] = await db
    .insert(projects)
    .values({
      name: "Hala Nikolić",
      client: "Jelena Nikolić",
      clientPhone: "064 555 7788",
      description: "Manja hala, krov na jednu vodu",
      startDate: monthsAgo(0, 3),
      endDate: null,
      status: "aktivan",
      revenue: 980000,
      lengthM: 18,
      widthM: 10,
      heightM: 4.5,
      roofType: "jedna_voda",
    })
    .returning();

  // Extra halls for width chart variety
  await db.insert(projects).values([
    {
      name: "Hala Jovanović",
      client: "Petar Jovanović",
      clientPhone: "063 100 200",
      description: "",
      startDate: monthsAgo(2, 10),
      endDate: monthsAgo(1, 5),
      status: "zavrsen",
      revenue: 1400000,
      lengthM: 20,
      widthM: 12,
      heightM: 5,
      roofType: "dve_vode",
    },
    {
      name: "Hala Stojanović",
      client: "Ana Stojanović",
      clientPhone: "065 300 400",
      description: "",
      startDate: monthsAgo(4, 1),
      endDate: monthsAgo(3, 15),
      status: "zavrsen",
      revenue: 1100000,
      lengthM: 16,
      widthM: 10,
      heightM: 4,
      roofType: "jedna_voda",
    },
    {
      name: "Hala Milić",
      client: "Igor Milić",
      clientPhone: "061 700 800",
      description: "",
      startDate: monthsAgo(5, 8),
      endDate: monthsAgo(4, 20),
      status: "zavrsen",
      revenue: 2100000,
      lengthM: 28,
      widthM: 15,
      heightM: 5.5,
      roofType: "dve_vode",
    },
  ]);

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
    { workerId: w1.id, date: monthsAgo(3, 5), hours: 40 },
    { workerId: w2.id, date: monthsAgo(3, 5), hours: 40 },
    { workerId: w1.id, date: monthsAgo(2, 12), hours: 38 },
    { workerId: w3.id, date: monthsAgo(2, 14), hours: 40 },
    { workerId: w1.id, date: monthsAgo(1, 10), hours: 42 },
    { workerId: w2.id, date: monthsAgo(1, 11), hours: 35 },
    { workerId: w3.id, date: monthsAgo(0, 4), hours: 40 },
    { workerId: w1.id, date: monthsAgo(0, 5), hours: 30 },
    { workerId: w2.id, date: monthsAgo(0, 6), hours: 40 },
  ];

  await db.insert(workLogs).values(
    workEntries.map((e) => ({
      ...e,
      projectId: null,
      note: `Nedelja`,
    })),
  );

  await db.insert(expenses).values([
    {
      date: monthsAgo(3, 4),
      category: "materijal",
      subcategory: "Cevi",
      description: "Čelični profili",
      amount: 320000,
      projectId: p1.id,
    },
    {
      date: monthsAgo(3, 6),
      category: "materijal",
      subcategory: "Farba",
      description: "Antikorozivna farba",
      amount: 48000,
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
      description: "Elektro žica",
      amount: 22000,
      projectId: p2.id,
    },
    {
      date: monthsAgo(1, 12),
      category: "materijal",
      subcategory: "Cevi",
      description: "Profili i lim",
      amount: 410000,
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
      description: "Spojnice i vijci",
      amount: 28000,
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
