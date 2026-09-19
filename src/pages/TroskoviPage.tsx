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

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Istorija
        </h2>
        {expenses.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">Nema unetih troškova.</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li key={e.id}>
                <Card className="!p-3 sm:!p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {e.subcategory || categoryLabel(e.category)}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {formatDate(e.date)} · {categoryLabel(e.category)}
                      </p>
                      {e.description ? (
                        <p className="mt-1 break-words text-sm text-[var(--muted)]">
                          {e.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold tabular-nums">
                        {formatMoney(e.amount)}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="mt-1 text-[var(--danger)]"
                        onClick={() => remove(e.id!)}
                      >
                        Obriši
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
