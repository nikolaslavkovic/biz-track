import { type FormEvent } from "react";
import { db, type Expense } from "../db";
import { Button, Card, Field, Input, Select } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  EXPENSE_CATEGORIES,
  MATERIAL_SUBCATEGORIES,
  MONTHLY_SUBCATEGORIES,
  formatDate,
  formatMoney,
  todayISO,
} from "../lib/utils";

export function TroskoviPage({
  data,
  onChange,
}: {
  data: DashboardData;
  onChange: () => Promise<void>;
}) {
  const { expenses, projects } = data;

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const projectIdRaw = String(fd.get("projectId") || "");
    await db.expenses.add({
      date: String(fd.get("date") || todayISO()),
      category: String(fd.get("category") || "materijal") as Expense["category"],
      subcategory: String(fd.get("subcategory") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      amount: Number(fd.get("amount") || 0),
      projectId: projectIdRaw ? Number(projectIdRaw) : null,
      createdAt: new Date().toISOString(),
    });
    e.currentTarget.reset();
    await onChange();
  }

  async function remove(id: number) {
    if (!confirm("Obrisati trošak?")) return;
    await db.expenses.delete(id);
    await onChange();
  }

  const categoryLabel = (value: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Troškovi
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Materijal, mesečni računi i ostalo — čuva se na telefonu.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
          Novi trošak
        </h2>
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Datum">
            <Input name="date" type="date" defaultValue={todayISO()} required />
          </Field>
          <Field label="Kategorija">
            <Select name="category" defaultValue="materijal">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Podkategorija">
            <Input name="subcategory" list="subcats" placeholder="Cevi, Struja..." />
            <datalist id="subcats">
              {[...MATERIAL_SUBCATEGORIES, ...MONTHLY_SUBCATEGORIES].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Iznos (RSD)">
            <Input name="amount" type="number" min="1" required />
          </Field>
          <Field label="Projekat (opciono)">
            <Select name="projectId" defaultValue="">
              <option value="">— bez projekta —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Opis">
            <Input name="description" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit">Sačuvaj trošak</Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--surface-2)] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3">Kategorija</th>
              <th className="px-4 py-3">Stavka</th>
              <th className="px-4 py-3 text-right">Iznos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-[var(--line)]">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.date)}</td>
                <td className="px-4 py-3">{categoryLabel(e.category)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{e.subcategory || "—"}</p>
                  {e.description ? (
                    <p className="text-xs text-[var(--muted)]">{e.description}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatMoney(e.amount)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-[var(--danger)]"
                    onClick={() => remove(e.id!)}
                  >
                    Obriši
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
