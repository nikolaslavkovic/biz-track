import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

const dbPath =
  process.env.DATABASE_URL?.replace(/^file:/, "") ??
  path.join(process.cwd(), "data", "firma.db");

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    client TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'aktivan',
    revenue REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    hourly_rate REAL NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS work_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    hours REAL NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    amount REAL NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export const db = drizzle(sqlite, { schema });
