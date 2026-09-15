import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  client: text("client").notNull().default(""),
  clientPhone: text("client_phone").notNull().default(""),
  description: text("description").notNull().default(""),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  status: text("status", {
    enum: ["aktivan", "zavrsen", "pauziran"],
  })
    .notNull()
    .default("aktivan"),
  /** Ukupna prodajna cena cele konstrukcije (u valuti revenueCurrency) */
  revenue: real("revenue").notNull().default(0),
  revenueCurrency: text("revenue_currency", {
    enum: ["RSD", "EUR"],
  })
    .notNull()
    .default("RSD"),
  lengthM: real("length_m").notNull().default(0),
  widthM: real("width_m").notNull().default(0),
  heightM: real("height_m").notNull().default(0),
  roofType: text("roof_type", {
    enum: ["jedna_voda", "dve_vode"],
  })
    .notNull()
    .default("dve_vode"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const workers = sqliteTable("workers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  hourlyRate: real("hourly_rate").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const workLogs = sqliteTable("work_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workerId: integer("worker_id")
    .notNull()
    .references(() => workers.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  date: text("date").notNull(),
  hours: real("hours").notNull(),
  note: text("note").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  category: text("category", {
    enum: ["materijal", "mesecni", "plata", "ostalo"],
  }).notNull(),
  subcategory: text("subcategory").notNull().default(""),
  description: text("description").notNull().default(""),
  amount: real("amount").notNull(),
  projectId: integer("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Project = typeof projects.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type WorkLog = typeof workLogs.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
