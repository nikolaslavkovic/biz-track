import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number, currency = "RSD"): string {
  return new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatHours(value: number): string {
  return `${Number(value || 0).toFixed(1)} h`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value + (value.length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

/** Monday of the ISO week containing `date` (YYYY-MM-DD). */
export function weekStartISO(date: string | Date = new Date()): string {
  const d =
    typeof date === "string"
      ? new Date(date + (date.length === 10 ? "T12:00:00" : ""))
      : new Date(date);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function weekEndISO(weekStart: string): string {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

/** HTML week input value, e.g. 2026-W38 */
export function toWeekInputValue(date: string | Date = new Date()): string {
  const start = weekStartISO(date);
  const d = new Date(start + "T12:00:00");
  const year = d.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const startOfYearWeek = weekStartISO(jan4.toISOString().slice(0, 10));
  const startMs = new Date(start + "T12:00:00").getTime();
  const yearStartMs = new Date(startOfYearWeek + "T12:00:00").getTime();
  const weekNum = Math.floor((startMs - yearStartMs) / (7 * 24 * 3600 * 1000)) + 1;
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

/** Parse HTML week value (2026-W38) → Monday YYYY-MM-DD */
export function fromWeekInputValue(weekValue: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekValue.trim());
  if (!match) return weekStartISO();
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(year, 0, 4, 12, 0, 0);
  const monday = weekStartISO(jan4.toISOString().slice(0, 10));
  const d = new Date(monday + "T12:00:00");
  d.setDate(d.getDate() + (week - 1) * 7);
  return d.toISOString().slice(0, 10);
}

export function formatWeekRange(weekStart: string): string {
  const end = weekEndISO(weekStart);
  return `${formatDate(weekStart)} – ${formatDate(end)}`;
}

export function weekKey(date: string): string {
  return weekStartISO(date);
}

export const EXPENSE_CATEGORIES = [
  { value: "materijal", label: "Materijal" },
  { value: "mesecni", label: "Mesečni trošak" },
  { value: "plata", label: "Plata / isplata" },
  { value: "ostalo", label: "Ostalo" },
] as const;

export const MATERIAL_SUBCATEGORIES = [
  "Cevi",
  "Farba",
  "Žica",
  "Fittings",
  "Alat",
  "Ostalo",
];

export const MONTHLY_SUBCATEGORIES = [
  "Struja",
  "Porez",
  "Kirija",
  "Internet",
  "Gorivo",
  "Osiguranje",
  "Ostalo",
];

export const PROJECT_STATUSES = [
  { value: "aktivan", label: "Aktivan" },
  { value: "zavrsen", label: "Završen" },
  { value: "pauziran", label: "Pauziran" },
] as const;

export const ROOF_TYPES = [
  { value: "jedna_voda", label: "Krov na jednu vodu" },
  { value: "dve_vode", label: "Krov na dve vode" },
] as const;

export function formatDimensions(
  lengthM: number,
  widthM: number,
  heightM: number,
): string {
  if (!lengthM && !widthM && !heightM) return "—";
  return `${widthM || "?"} × ${lengthM || "?"} × ${heightM || "?"} m`;
}

export function roofLabel(value: string | null | undefined): string {
  return ROOF_TYPES.find((r) => r.value === value)?.label ?? value ?? "—";
}
