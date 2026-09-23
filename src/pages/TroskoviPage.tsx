import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  FileText,
  Layers,
  Plus,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  db,
  setCustomSubcategories,
  type ExpenseCategory,
} from "../db";
import { Button, Card, Field, Input, Select } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  DEFAULT_SUBCATEGORIES,
  FEROX_CATEGORIES,
  cn,
  expenseCategoryLabel,
  formatDate,
  formatMoney,
  todayISO,
} from "../lib/utils";

type FeroxCategory = (typeof FEROX_CATEGORIES)[number]["value"];

const CATEGORY_STYLE: Record<
  FeroxCategory,
  { icon: LucideIcon; tile: string; chip: string }
> = {
  alat: {
    icon: Wrench,
    tile: "bg-sky-50 text-sky-900 border-sky-200",
    chip: "bg-sky-600",
  },
  materijal: {
    icon: Layers,
    tile: "bg-teal-50 text-teal-900 border-teal-200",
    chip: "bg-teal-600",
  },
  potrosni: {
    icon: Zap,
    tile: "bg-amber-50 text-amber-900 border-amber-200",
    chip: "bg-amber-600",
  },
  obaveze: {
    icon: FileText,
    tile: "bg-violet-50 text-violet-900 border-violet-200",
    chip: "bg-violet-600",
  },
};

function categoryStyle(value: string) {
  const key = (value === "mesecni" ? "obaveze" : value) as FeroxCategory;
  return CATEGORY_STYLE[key];
}

export function TroskoviPage({
  data,
  onChange,
}: {
  data: DashboardData;
  onChange: () => Promise<void>;
}) {
  const { expenses, projects, customSubcategories } = data;
  const [category, setCategory] = useState<FeroxCategory | null>(null);
  const [subcategory, setSubcategory] = useState("");
  const [addingSub, setAddingSub] = useState(false);
  const [newSub, setNewSub] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const custom = category ? (customSubcategories[category] ?? []) : [];
  const defaults = category ? DEFAULT_SUBCATEGORIES[category] ?? [] : [];

  function pick(value: FeroxCategory) {
    setCategory(value);
    setSubcategory("");
    setAddingSub(false);
    setNewSub("");
    setMessage(null);
  }

  async function addSubcategory(e: FormEvent) {
    e.preventDefault();
    const name = newSub.trim();
    if (!category || !name) return;
    const exists = [...defaults, ...custom].some(
      (s) => s.toLowerCase() === name.toLowerCase(),
    );
    if (!exists) {
      await setCustomSubcategories({
        ...customSubcategories,
        [category]: [...custom, name],
      });
      await onChange();
    }
    setSubcategory(name);
    setNewSub("");
    setAddingSub(false);
  }

  async function removeSubcategory(name: string) {
    if (!category) return;
    if (!confirm(`Ukloniti podkategoriju „${name}“?`)) return;
    await setCustomSubcategories({
      ...customSubcategories,
      [category]: custom.filter((s) => s !== name),
    });
    if (subcategory === name) setSubcategory("");
    await onChange();
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!category) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const projectIdRaw = String(fd.get("projectId") || "");
    await db.expenses.add({
      date: String(fd.get("date") || todayISO()),
      category: category as ExpenseCategory,
      subcategory: subcategory.trim(),
      description: String(fd.get("description") || "").trim(),
      amount: Number(fd.get("amount") || 0),
      projectId: projectIdRaw ? Number(projectIdRaw) : null,
      createdAt: new Date().toISOString(),
    });
    form.reset();
    const label = subcategory || expenseCategoryLabel(category);
    setSubcategory("");
    setMessage(`Sačuvano: ${label}`);
    await onChange();
  }

  async function remove(id: number) {
    if (!confirm("Obrisati trošak?")) return;
    await db.expenses.delete(id);
    await onChange();
  }

  const active = category ? CATEGORY_STYLE[category] : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">
          Troškovi
        </h1>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Izaberi vrstu troška, pa unesi detalje.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900">
          {message}
        </div>
      ) : null}

      {!category || !active ? (
        <section className="grid grid-cols-2 gap-2.5">
          {FEROX_CATEGORIES.map((c) => {
            const style = CATEGORY_STYLE[c.value];
            const Icon = style.icon;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => pick(c.value)}
                className={cn(
                  "flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-xl border-2 px-2 py-3 text-center shadow-sm transition-transform active:scale-[0.97]",
                  style.tile,
                )}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl text-white",
                    style.chip,
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-bold leading-tight">{c.label}</span>
                {customSubcategories[c.value]?.length ? (
                  <span className="line-clamp-2 text-[10px] leading-tight opacity-70">
                    {customSubcategories[c.value]!.join(", ")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </section>
      ) : (
        <Card className="!p-3 sm:!p-4">
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-label="Nazad na vrste troška"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-2)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white",
                active.chip,
              )}
            >
              <active.icon className="h-5 w-5" />
            </span>
            <h2 className="min-w-0 truncate font-[family-name:var(--font-display)] text-lg font-semibold">
              {expenseCategoryLabel(category)}
            </h2>
          </div>

          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Podkategorija
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[...defaults, ...custom].map((s) => {
                const selected = subcategory === s;
                const isCustom = custom.includes(s);
                return (
                  <span
                    key={s}
                    className={cn(
                      "inline-flex items-center rounded-full border text-sm font-medium",
                      selected
                        ? cn(active.chip, "border-transparent text-white")
                        : "border-[var(--line)] bg-[var(--surface)]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSubcategory(selected ? "" : s)}
                      className={cn("py-1.5 pl-3", isCustom ? "pr-1" : "pr-3")}
                    >
                      {s}
                    </button>
                    {isCustom ? (
                      <button
                        type="button"
                        onClick={() => void removeSubcategory(s)}
                        aria-label={`Ukloni ${s}`}
                        className="py-1.5 pr-2 pl-1 opacity-60"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </span>
                );
              })}
              {!addingSub ? (
                <button
                  type="button"
                  onClick={() => setAddingSub(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--muted)] px-3 py-1.5 text-sm font-medium text-[var(--muted)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Dodaj
                </button>
              ) : null}
            </div>
            {addingSub ? (
              <form onSubmit={addSubcategory} className="mt-2 flex gap-2">
                <Input
                  autoFocus
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  placeholder="Nova podkategorija"
                />
                <Button type="submit" size="sm" className="h-12 sm:h-10">
                  Dodaj
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-12 sm:h-10"
                  onClick={() => {
                    setAddingSub(false);
                    setNewSub("");
                  }}
                >
                  Otkaži
                </Button>
              </form>
            ) : null}
          </div>

          <form
            key={category}
            onSubmit={create}
            className="grid grid-cols-2 gap-2.5 border-t border-[var(--line)] pt-3"
          >
            <Field label="Iznos (RSD)">
              <Input
                name="amount"
                type="number"
                inputMode="numeric"
                min="1"
                required
              />
            </Field>
            <Field label="Datum">
              <Input name="date" type="date" defaultValue={todayISO()} required />
            </Field>
            <Field label="Hala (opciono)" className="col-span-2">
              <Select name="projectId" defaultValue="">
                <option value="">— bez hale —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Opis" className="col-span-2">
              <Input name="description" placeholder="opciono" />
            </Field>
            <div className="col-span-2">
              <Button type="submit" className="w-full">
                Sačuvaj trošak
                {subcategory ? ` · ${subcategory}` : ""}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Istorija
        </h2>
        {expenses.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">Nema unetih troškova.</p>
          </Card>
        ) : (
          <ul className="space-y-1.5">
            {expenses.map((e) => {
              const style = categoryStyle(e.category);
              const Icon = style?.icon;
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white",
                      style?.chip ?? "bg-slate-500",
                    )}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {e.subcategory || expenseCategoryLabel(e.category)}
                    </p>
                    <p className="truncate text-[11px] text-[var(--muted)]">
                      {formatDate(e.date)} · {expenseCategoryLabel(e.category)}
                      {e.description ? ` · ${e.description}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatMoney(e.amount)}
                    </p>
                    <button
                      type="button"
                      className="text-[11px] font-medium text-[var(--danger)]"
                      onClick={() => remove(e.id!)}
                    >
                      Obriši
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
