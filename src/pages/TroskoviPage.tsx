import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Banknote,
  FileText,
  Layers,
  Megaphone,
  Plus,
  Users,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { db, setCustomSubcategories, type Expense, type Income } from "../db";
import { Button, Card, Field, Input, Select } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  FEROX_CATEGORIES,
  INCOME_SUBCATEGORY_KEY,
  MONEY_MANAGER_INCOME,
  cn,
  expenseCategoryLabel,
  formatDate,
  formatMoney,
  incomeLabel,
  normalizeName,
  sourceAmountLabel,
  todayISO,
} from "../lib/utils";

type FeroxCategory = (typeof FEROX_CATEGORIES)[number]["value"];
type Mode = "trosak" | "prihod";

const CATEGORY_STYLE: Record<FeroxCategory, { icon: LucideIcon; tile: string; chip: string }> = {
  materijal: { icon: Layers, tile: "bg-teal-50 text-teal-900 border-teal-200", chip: "bg-teal-600" },
  alat: { icon: Wrench, tile: "bg-sky-50 text-sky-900 border-sky-200", chip: "bg-sky-600" },
  potrosni: { icon: Zap, tile: "bg-amber-50 text-amber-900 border-amber-200", chip: "bg-amber-600" },
  obaveze: { icon: FileText, tile: "bg-violet-50 text-violet-900 border-violet-200", chip: "bg-violet-600" },
  marketing: { icon: Megaphone, tile: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200", chip: "bg-fuchsia-600" },
  plata: { icon: Users, tile: "bg-rose-50 text-rose-900 border-rose-200", chip: "bg-rose-600" },
};

const INCOME_STYLE = { icon: Banknote, chip: "bg-emerald-600" };

const HISTORY_STYLE: Record<string, { icon: LucideIcon; chip: string }> = {
  ...CATEGORY_STYLE,
  mesecni: CATEGORY_STYLE.obaveze,
};

const HISTORY_PAGE = 40;

function moneyFromForm(fd: FormData, eurToRsd: number) {
  const value = Number(fd.get("amount") || 0);
  const currency = String(fd.get("currency") || "RSD");
  const amount = currency === "EUR" ? Math.round(value * eurToRsd * 100) / 100 : value;
  return { amount, sourceCurrency: currency, sourceAmount: value };
}

export function TroskoviPage({
  data,
  onChange,
}: {
  data: DashboardData;
  onChange: () => Promise<void>;
}) {
  const { expenses, incomes, projects, customSubcategories, eurToRsd } = data;
  const [mode, setMode] = useState<Mode>("trosak");
  const [category, setCategory] = useState<FeroxCategory | null>(null);
  const [subcategory, setSubcategory] = useState("");
  const [addingSub, setAddingSub] = useState(false);
  const [newSub, setNewSub] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [shown, setShown] = useState(HISTORY_PAGE);

  const subKey = mode === "prihod" ? INCOME_SUBCATEGORY_KEY : category;
  const subcats = subKey ? (customSubcategories[subKey] ?? []) : [];
  const formOpen = mode === "prihod" || !!category;
  const style = mode === "prihod" ? INCOME_STYLE : category ? CATEGORY_STYLE[category] : null;
  const title = mode === "prihod" ? MONEY_MANAGER_INCOME : category ? expenseCategoryLabel(category) : "";

  function resetEntry() {
    setSubcategory("");
    setAddingSub(false);
    setNewSub("");
    setMessage(null);
    setShown(HISTORY_PAGE);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setCategory(null);
    resetEntry();
  }

  function pick(value: FeroxCategory | null) {
    setCategory(value);
    resetEntry();
  }

  async function addSubcategory(e: FormEvent) {
    e.preventDefault();
    const name = newSub.trim();
    if (!subKey || !name) return;
    if (!subcats.some((s) => normalizeName(s) === normalizeName(name))) {
      await setCustomSubcategories({ ...customSubcategories, [subKey]: [...subcats, name] });
      await onChange();
    }
    setSubcategory(name);
    setNewSub("");
    setAddingSub(false);
  }

  async function removeSubcategory(name: string) {
    if (!subKey) return;
    if (!confirm(`Ukloniti podkategoriju „${name}“? Postojeći unosi ostaju.`)) return;
    await setCustomSubcategories({
      ...customSubcategories,
      [subKey]: subcats.filter((s) => s !== name),
    });
    if (subcategory === name) setSubcategory("");
    await onChange();
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const money = moneyFromForm(fd, eurToRsd);
    const base = {
      date: String(fd.get("date") || todayISO()),
      subcategory: subcategory.trim(),
      description: String(fd.get("description") || "").trim(),
      ...money,
      createdAt: new Date().toISOString(),
    };
    if (mode === "prihod") {
      await db.incomes.add({
        ...base,
        category: normalizeName(base.subcategory) === "avans" ? "avans" : "prodaja",
      });
    } else if (category) {
      const projectIdRaw = String(fd.get("projectId") || "");
      await db.expenses.add({
        ...base,
        category,
        projectId: projectIdRaw ? Number(projectIdRaw) : null,
      });
    }
    form.reset();
    setMessage(`Sačuvano: ${subcategory || title} · ${formatMoney(money.amount)}`);
    setSubcategory("");
    await onChange();
  }

  async function removeExpense(id: number) {
    if (!confirm("Obrisati trošak?")) return;
    await db.expenses.delete(id);
    await onChange();
  }

  async function removeIncome(id: number) {
    if (!confirm("Obrisati prihod?")) return;
    await db.incomes.delete(id);
    await onChange();
  }

  const history: Array<Expense | Income> =
    mode === "prihod"
      ? incomes
      : category
        ? expenses.filter((e) => e.category === category)
        : expenses;
  const filteredHistory = subcategory
    ? history.filter((h) => h.subcategory === subcategory)
    : history;
  const historyTotal = filteredHistory.reduce((s, h) => s + h.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">
          {mode === "prihod" ? "Prihodi" : "Troškovi"}
        </h1>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Iste kategorije kao u MoneyManager-u.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-1">
        {(
          [
            ["trosak", "Troškovi"],
            ["prihod", "Prihodi"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => switchMode(value)}
            className={cn(
              "min-h-9 rounded-md text-sm font-semibold transition-colors",
              mode === value
                ? "bg-[var(--ink)] text-[var(--bg)]"
                : "text-[var(--muted)] active:bg-[var(--surface)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900">
          {message}
        </div>
      ) : null}

      {!formOpen ? (
        <section className="grid grid-cols-2 gap-2">
          {FEROX_CATEGORIES.map((c) => {
            const s = CATEGORY_STYLE[c.value];
            const Icon = s.icon;
            const subs = customSubcategories[c.value] ?? [];
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => pick(c.value)}
                className={cn(
                  "flex min-h-[6.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2.5 text-center shadow-sm transition-transform active:scale-[0.97]",
                  s.tile,
                )}
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-white", s.chip)}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[13px] font-bold leading-tight">{c.label}</span>
                {subs.length ? (
                  <span className="line-clamp-2 text-[10px] leading-tight opacity-70">
                    {subs.join(", ")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </section>
      ) : style ? (
        <Card className="!p-3 sm:!p-4">
          <div className="mb-3 flex items-center gap-2">
            {mode === "trosak" ? (
              <button
                type="button"
                onClick={() => pick(null)}
                aria-label="Nazad na kategorije"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-2)]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white", style.chip)}>
              <style.icon className="h-5 w-5" />
            </span>
            <h2 className="min-w-0 truncate font-[family-name:var(--font-display)] text-lg font-semibold">
              {title}
            </h2>
          </div>

          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Podkategorija
            </p>
            <div className="flex flex-wrap gap-1.5">
              {subcats.map((s) => {
                const selected = subcategory === s;
                return (
                  <span
                    key={s}
                    className={cn(
                      "inline-flex items-center rounded-full border text-sm font-medium",
                      selected
                        ? cn(style.chip, "border-transparent text-white")
                        : "border-[var(--line)] bg-[var(--surface)]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSubcategory(selected ? "" : s)}
                      className="py-1.5 pr-1 pl-3"
                    >
                      {s}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeSubcategory(s)}
                      aria-label={`Ukloni ${s}`}
                      className="py-1.5 pr-2 pl-1 opacity-60"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
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
            key={`${mode}-${category}`}
            onSubmit={create}
            className="grid grid-cols-2 gap-2.5 border-t border-[var(--line)] pt-3"
          >
            <Field label="Iznos">
              <Input
                name="amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
              />
            </Field>
            <Field label="Valuta">
              <Select name="currency" defaultValue="RSD">
                <option value="RSD">RSD</option>
                <option value="EUR">EUR (kurs {eurToRsd})</option>
              </Select>
            </Field>
            <Field label="Datum" className={mode === "prihod" ? "col-span-2" : undefined}>
              <Input name="date" type="date" defaultValue={todayISO()} required />
            </Field>
            {mode === "trosak" ? (
              <Field label="Hala (opciono)">
                <Select name="projectId" defaultValue="">
                  <option value="">— bez hale —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label="Napomena" className="col-span-2">
              <Input
                name="description"
                placeholder={mode === "prihod" ? "npr. 12x6x3m na dve vode" : "opciono"}
              />
            </Field>
            <div className="col-span-2">
              <Button type="submit" className="w-full">
                {mode === "prihod" ? "Sačuvaj prihod" : "Sačuvaj trošak"}
                {subcategory ? ` · ${subcategory}` : ""}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            {mode === "prihod" ? "Svi prihodi" : category ? `Istorija · ${title}` : "Svi troškovi"}
            {subcategory ? ` / ${subcategory}` : ""} ({filteredHistory.length})
          </h2>
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {formatMoney(historyTotal)}
          </span>
        </div>
        {filteredHistory.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">Nema unosa.</p>
          </Card>
        ) : (
          <ul className="space-y-1.5">
            {filteredHistory.slice(0, shown).map((h) => {
              const isIncome = mode === "prihod";
              const e = h as Expense;
              const s = isIncome ? INCOME_STYLE : HISTORY_STYLE[e.category];
              const Icon = s?.icon;
              const catLabel = isIncome
                ? incomeLabel(h as Income)
                : e.originalCategory || expenseCategoryLabel(e.category);
              const foreign = sourceAmountLabel(h);
              return (
                <li
                  key={h.id}
                  className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white",
                      s?.chip ?? "bg-slate-500",
                    )}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {isIncome
                        ? h.description || h.subcategory || catLabel
                        : h.subcategory || h.description || catLabel}
                    </p>
                    <p className="truncate text-[11px] text-[var(--muted)]">
                      {formatDate(h.date)} · {catLabel}
                      {!isIncome && h.subcategory && h.description ? ` · ${h.description}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isIncome && "text-[var(--good)]",
                      )}
                    >
                      {formatMoney(h.amount)}
                    </p>
                    {foreign ? <p className="text-[10px] text-[var(--muted)]">{foreign}</p> : null}
                    <button
                      type="button"
                      className="text-[11px] font-medium text-[var(--danger)]"
                      onClick={() => (isIncome ? removeIncome(h.id!) : removeExpense(h.id!))}
                    >
                      Obriši
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {shown < filteredHistory.length ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => setShown((n) => n + HISTORY_PAGE)}
          >
            Prikaži još ({filteredHistory.length - shown})
          </Button>
        ) : null}
      </section>
    </div>
  );
}
