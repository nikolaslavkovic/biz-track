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
