"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { expenses, projects, workers, workLogs } from "@/db/schema";
import { formatWeekRange, fromWeekInputValue } from "@/lib/utils";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/projekti");
  revalidatePath("/troskovi");
  revalidatePath("/radnici");
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Naziv projekta je obavezan");

  await db.insert(projects).values({
    name,
    client: String(formData.get("client") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    startDate: String(formData.get("startDate") || new Date().toISOString().slice(0, 10)),
    endDate: String(formData.get("endDate") || "") || null,
    status: (String(formData.get("status") || "aktivan") as
      | "aktivan"
      | "zavrsen"
      | "pauziran"),
    revenue: Number(formData.get("revenue") || 0),
  });
  revalidateAll();
}

export async function updateProject(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) throw new Error("Nedostaje ID");

  await db
    .update(projects)
    .set({
      name: String(formData.get("name") || "").trim(),
      client: String(formData.get("client") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      startDate: String(formData.get("startDate")),
      endDate: String(formData.get("endDate") || "") || null,
      status: String(formData.get("status") || "aktivan") as
        | "aktivan"
        | "zavrsen"
        | "pauziran",
      revenue: Number(formData.get("revenue") || 0),
    })
    .where(eq(projects.id, id));
  revalidateAll();
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidateAll();
}

export async function createWorker(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Ime radnika je obavezno");

  await db.insert(workers).values({
    name,
    hourlyRate: Number(formData.get("hourlyRate") || 0),
    active: formData.get("active") !== "false",
  });
  revalidateAll();
}

export async function updateWorker(formData: FormData) {
  const id = Number(formData.get("id"));
  await db
    .update(workers)
    .set({
      name: String(formData.get("name") || "").trim(),
      hourlyRate: Number(formData.get("hourlyRate") || 0),
      active: formData.get("active") === "true" || formData.get("active") === "on",
    })
    .where(eq(workers.id, id));
  revalidateAll();
}

export async function deleteWorker(id: number) {
  await db.delete(workers).where(eq(workers.id, id));
  revalidateAll();
}

export async function createWorkLog(formData: FormData) {
  const workerId = Number(formData.get("workerId"));
  const hours = Number(formData.get("hours"));
  if (!workerId || !hours) throw new Error("Radnik i sati su obavezni");

  await db.insert(workLogs).values({
    workerId,
    projectId: null,
    date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    hours,
    note: String(formData.get("note") || "").trim(),
  });
  revalidateAll();
}

/** Batch entry for one work week: hours per worker (for payday). */
export async function createWeeklyWorkLogs(formData: FormData) {
  const weekValue = String(formData.get("week") || "");
  const weekStart = fromWeekInputValue(weekValue);
  const label = formatWeekRange(weekStart);
  const noteExtra = String(formData.get("note") || "").trim();

  const rows: Array<{
    workerId: number;
    projectId: null;
    date: string;
    hours: number;
    note: string;
  }> = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("hours_")) continue;
    const workerId = Number(key.slice("hours_".length));
    const hours = Number(value);
    if (!workerId || !hours || hours <= 0) continue;
    rows.push({
      workerId,
      projectId: null,
      date: weekStart,
      hours,
      note: noteExtra
        ? `Nedelja ${label} · ${noteExtra}`
        : `Nedelja ${label}`,
    });
  }

  if (rows.length === 0) {
    throw new Error("Unesite sate za bar jednog radnika");
  }

  await db.insert(workLogs).values(rows);
  revalidateAll();
}

export async function deleteWorkLog(id: number) {
  await db.delete(workLogs).where(eq(workLogs.id, id));
  revalidateAll();
}

export async function createExpense(formData: FormData) {
  const amount = Number(formData.get("amount"));
  const category = String(formData.get("category") || "ostalo") as
    | "materijal"
    | "mesecni"
    | "plata"
    | "ostalo";
  if (!amount) throw new Error("Iznos je obavezan");

  const projectIdRaw = formData.get("projectId");
  const projectId = projectIdRaw ? Number(projectIdRaw) : null;

  await db.insert(expenses).values({
    date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    category,
    subcategory: String(formData.get("subcategory") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    amount,
    projectId: projectId || null,
  });
  revalidateAll();
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidateAll();
}
