import { DeleteButton } from "@/components/form-buttons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { createExpense, deleteExpense } from "@/lib/actions";
import { listExpenses, listProjects } from "@/lib/analytics";
import {
  EXPENSE_CATEGORIES,
  MATERIAL_SUBCATEGORIES,
  MONTHLY_SUBCATEGORIES,
  formatDate,
  formatMoney,
  todayISO,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TroskoviPage() {
  const [items, projectList] = await Promise.all([
    listExpenses(),
    listProjects(),
  ]);

  const categoryLabel = (value: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Troškovi
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Dnevni materijal (cevi, farba, žica…), mesečni računi (struja, porez) i
          ostali troškovi.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
          Novi trošak
        </h2>
        <form
          action={createExpense}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Field label="Datum">
            <Input name="date" type="date" required defaultValue={todayISO()} />
          </Field>
          <Field label="Kategorija">
            <Select name="category" defaultValue="materijal" required>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Podkategorija">
            <Input
              name="subcategory"
              list="subcats"
              placeholder="npr. Cevi, Struja, Porez"
            />
            <datalist id="subcats">
              {[...MATERIAL_SUBCATEGORIES, ...MONTHLY_SUBCATEGORIES].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Iznos (RSD)">
            <Input name="amount" type="number" min="1" step="1" required />
          </Field>
          <Field label="Projekat (opciono)">
            <Select name="projectId" defaultValue="">
              <option value="">— bez projekta —</option>
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Opis" className="sm:col-span-2 lg:col-span-1">
            <Input name="description" placeholder="Detalji unosa" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit">Sačuvaj trošak</Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Predlozi: {MATERIAL_SUBCATEGORIES.join(", ")} ·{" "}
          {MONTHLY_SUBCATEGORIES.join(", ")}
        </p>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Kategorija</th>
              <th className="px-4 py-3 font-medium">Stavka</th>
              <th className="px-4 py-3 font-medium">Projekat</th>
              <th className="px-4 py-3 font-medium text-right">Iznos</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                  Nema troškova. Unesite prvi iznad.
                </td>
              </tr>
            ) : (
              items.map((e) => (
                <tr key={e.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">{categoryLabel(e.category)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.subcategory || "—"}</p>
                    {e.description ? (
                      <p className="text-xs text-[var(--muted)]">{e.description}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {e.projectName || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatMoney(e.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton
                      onDelete={async () => {
                        "use server";
                        await deleteExpense(e.id);
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
