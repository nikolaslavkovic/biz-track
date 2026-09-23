import { useState, type FormEvent } from "react";
import { Minus, Plus, X } from "lucide-react";
import { db, type WorkLog } from "../db";
import { Button, Card, Field, Input, Select } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  cn,
  formatHours,
  formatMoney,
  formatWeekRange,
  recentWeekOptions,
  weekStartISO,
} from "../lib/utils";

type EntryDraft = { hours: string; adjustment: string; sign: 1 | -1 };

const EMPTY_DRAFT: EntryDraft = { hours: "", adjustment: "", sign: 1 };

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatMoney(Math.abs(value))}`;
}

export function RadniciPage({
  data,
  onChange,
}: {
  data: DashboardData;
  onChange: () => Promise<void>;
}) {
  const { workers, weekly } = data;
  const active = workers.filter((w) => w.active);
  const currentWeekStart = weekStartISO();
  const currentWeek = weekly.find((w) => w.weekStart === currentWeekStart);
  const weekOptions = recentWeekOptions(20);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [note, setNote] = useState("");
  const [drafts, setDrafts] = useState<Record<number, EntryDraft>>({});

  function draftFor(id: number): EntryDraft {
    return drafts[id] ?? EMPTY_DRAFT;
  }

  function patchDraft(id: number, patch: Partial<EntryDraft>) {
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? EMPTY_DRAFT), ...patch } }));
  }

  function draftAdjustment(d: EntryDraft): number {
    return (Number(d.adjustment) || 0) * d.sign;
  }

  const draftTotal = active.reduce((sum, w) => {
    const d = draftFor(w.id!);
    return sum + (Number(d.hours) || 0) * w.hourlyRate + draftAdjustment(d);
  }, 0);

  async function addWorker(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const hourlyRate = Number(fd.get("hourlyRate") || 0);

    if (!name) {
      setMessage("Unesite ime radnika.");
      return;
    }
    if (!hourlyRate || hourlyRate < 0) {
      setMessage("Unesite ispravnu satnicu.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await db.workers.add({
        name,
        hourlyRate,
        active: true,
        createdAt: new Date().toISOString(),
      });
      form.reset();
      const rateInput = form.elements.namedItem("hourlyRate") as HTMLInputElement | null;
      if (rateInput) rateInput.value = "1000";
      await onChange();
      setMessage(`Sačuvan radnik: ${name}`);
    } catch (err) {
      console.error(err);
      setMessage("Greška pri čuvanju radnika. Pokušajte ponovo.");
    } finally {
      setSaving(false);
    }
  }

  async function saveWeekly(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const label = formatWeekRange(weekStart);
    const noteExtra = note.trim();
    const now = new Date().toISOString();
    const rows: WorkLog[] = [];
    for (const w of active) {
      const d = draftFor(w.id!);
      const hours = Number(d.hours) || 0;
      const adjustment = draftAdjustment(d);
      if (!hours && !adjustment) continue;
      rows.push({
        workerId: w.id!,
        date: weekStart,
        hours,
        adjustment,
        note: noteExtra ? `Nedelja ${label} · ${noteExtra}` : `Nedelja ${label}`,
        createdAt: now,
      });
    }
    if (!rows.length) {
      setMessage("Unesite sate ili dodatak za bar jednog radnika.");
      return;
    }
    setSaving(true);
    try {
      await db.workLogs.bulkAdd(rows);
      setDrafts({});
      setNote("");
      await onChange();
      setMessage("Nedeljni sati sačuvani.");
    } catch (err) {
      console.error(err);
      setMessage("Greška pri čuvanju sati.");
    } finally {
      setSaving(false);
    }
  }

  async function updateWorker(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await db.workers.update(id, {
      name: String(fd.get("name") || "").trim(),
      hourlyRate: Number(fd.get("hourlyRate") || 0),
      active: String(fd.get("active")) === "true",
    });
    await onChange();
    setMessage("Radnik ažuriran.");
  }

  async function removeWorker(id: number) {
    if (!confirm("Obrisati radnika i njegove sate?")) return;
    await db.workLogs.where("workerId").equals(id).delete();
    await db.workers.delete(id);
    await onChange();
    setMessage("Radnik obrisan.");
  }

  async function removeWeekEntry(name: string, weekLabel: string, logIds: number[]) {
    if (!confirm(`Obrisati unos za ${name} (${weekLabel})?`)) return;
    await db.workLogs.bulkDelete(logIds);
    await onChange();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">
          Radnici i sati
        </h1>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Nedeljni unos sati za isplatu, uz dodatak ili odbitak.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900">
          {message}
        </div>
      ) : null}

      {currentWeek ? (
        <Card className="!p-3 sm:!p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">
            Tekuća nedelja · {currentWeek.label}
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-[var(--muted)]">Ukupno sati</p>
              <p className="text-xl font-semibold">{formatHours(currentWeek.totalHours)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--muted)]">Za isplatu</p>
              <p className="text-xl font-semibold text-[var(--accent)]">
                {formatMoney(currentWeek.totalCost)}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="!p-3 sm:!p-4">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
          Nedeljni unos sati
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Prvo dodajte bar jednog radnika (na dnu strane).
          </p>
        ) : (
          <form onSubmit={saveWeekly} className="space-y-3">
            <Field label="Radna nedelja">
              <Select
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                required
              >
                {weekOptions.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="space-y-2">
              {active.map((w) => {
                const d = draftFor(w.id!);
                const hours = Number(d.hours) || 0;
                const adj = draftAdjustment(d);
                const payout = hours * w.hourlyRate + adj;
                return (
                  <div
                    key={w.id}
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)]/40 p-2.5"
                  >
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <p className="truncate font-medium">{w.name}</p>
                      <p className="shrink-0 text-[11px] text-[var(--muted)]">
                        {formatMoney(w.hourlyRate)}/h
                      </p>
                    </div>
                    <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                      <Field label="Sati">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.5"
                          placeholder="0"
                          value={d.hours}
                          onChange={(e) => patchDraft(w.id!, { hours: e.target.value })}
                        />
                      </Field>
                      <Field label="Dodatak / odbitak (RSD)">
                        <div className="flex gap-1.5">
                          <div className="flex shrink-0 overflow-hidden rounded-md border border-[var(--line)]">
                            <button
                              type="button"
                              aria-label="Dodaj"
                              aria-pressed={d.sign === 1}
                              onClick={() => patchDraft(w.id!, { sign: 1 })}
                              className={cn(
                                "flex w-10 items-center justify-center",
                                d.sign === 1
                                  ? "bg-emerald-600 text-white"
                                  : "bg-[var(--surface)] text-[var(--muted)]",
                              )}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Oduzmi"
                              aria-pressed={d.sign === -1}
                              onClick={() => patchDraft(w.id!, { sign: -1 })}
                              className={cn(
                                "flex w-10 items-center justify-center border-l border-[var(--line)]",
                                d.sign === -1
                                  ? "bg-red-600 text-white"
                                  : "bg-[var(--surface)] text-[var(--muted)]",
                              )}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          </div>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={d.adjustment}
                            onChange={(e) =>
                              patchDraft(w.id!, { adjustment: e.target.value })
                            }
                          />
                        </div>
                      </Field>
                    </div>
                    {hours || adj ? (
                      <p className="mt-1.5 text-right text-xs text-[var(--muted)]">
                        {formatHours(hours)} × {formatMoney(w.hourlyRate)}
                        {adj ? ` ${adj > 0 ? "+" : "−"} ${formatMoney(Math.abs(adj))}` : ""}
                        {" = "}
                        <strong className="text-[var(--ink)]">{formatMoney(payout)}</strong>
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <Field label="Napomena">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="opciono"
              />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                Ukupno:{" "}
                <strong className="text-[var(--accent)]">{formatMoney(draftTotal)}</strong>
              </p>
              <Button type="submit" disabled={saving}>
                Sačuvaj nedeljne sate
              </Button>
            </div>
          </form>
        )}
      </Card>

      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Pregled po nedeljama
        </h2>
        {weekly.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">Još nema unosa sati.</p>
          </Card>
        ) : (
          weekly.map((week) => (
            <Card key={week.weekStart} className="overflow-hidden !p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--surface-2)]/60 px-3 py-2">
                <h3 className="text-sm font-semibold">{week.label}</h3>
                <p className="text-sm">
                  {formatHours(week.totalHours)} ·{" "}
                  <strong className="text-[var(--accent)]">
                    {formatMoney(week.totalCost)}
                  </strong>
                </p>
              </div>
              <ul>
                {week.workers.map((w) => (
                  <li
                    key={w.workerId}
                    className="flex items-center gap-2 border-t border-[var(--line)] px-3 py-1.5 text-sm first:border-t-0"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {w.workerName}
                    </span>
                    <span className="shrink-0 text-right text-xs text-[var(--muted)]">
                      {formatHours(w.hours)}
                      {w.adjustment ? (
                        <span
                          className={cn(
                            "ml-1 font-medium",
                            w.adjustment > 0 ? "text-emerald-700" : "text-red-700",
                          )}
                        >
                          {formatSigned(w.adjustment)}
                        </span>
                      ) : null}
                    </span>
                    <span className="w-24 shrink-0 text-right font-semibold tabular-nums">
                      {formatMoney(w.cost)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Obriši unos za ${w.workerName}`}
                      onClick={() =>
                        void removeWeekEntry(w.workerName, week.label, w.logIds)
                      }
                      className="shrink-0 rounded p-1 text-[var(--muted)] hover:text-[var(--danger)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}
      </div>

      <Card className="!p-3 sm:!p-4">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
          Spisak radnika ({workers.length})
        </h2>
        <div className="space-y-2">
          {workers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nema radnika.</p>
          ) : (
            workers.map((w) => (
              <form
                key={w.id}
                onSubmit={(e) => updateWorker(e, w.id!)}
                className="grid gap-2.5 rounded-lg border border-[var(--line)] p-2.5 sm:flex sm:flex-wrap sm:items-end"
              >
                <Field label="Ime" className="min-w-[160px] sm:flex-1">
                  <Input name="name" defaultValue={w.name} required />
                </Field>
                <div className="grid grid-cols-2 gap-2.5 sm:contents">
                  <Field label="Satnica">
                    <Input
                      name="hourlyRate"
                      type="number"
                      inputMode="numeric"
                      defaultValue={w.hourlyRate}
                    />
                  </Field>
                  <Field label="Aktivan">
                    <Select name="active" defaultValue={w.active ? "true" : "false"}>
                      <option value="true">Da</option>
                      <option value="false">Ne</option>
                    </Select>
                  </Field>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="secondary" className="flex-1 sm:flex-none">
                    Sačuvaj
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-[var(--danger)]"
                    onClick={() => removeWorker(w.id!)}
                  >
                    Obriši
                  </Button>
                </div>
              </form>
            ))
          )}
        </div>
      </Card>

      <Card className="!p-3 sm:!p-4">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
          Novi radnik
        </h2>
        <form onSubmit={addWorker} className="grid gap-2.5 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
          <Field label="Ime i prezime">
            <Input
              name="name"
              required
              autoComplete="name"
              placeholder="npr. Nikola Jovanović"
            />
          </Field>
          <Field label="Satnica (RSD / sat)">
            <Input
              name="hourlyRate"
              type="number"
              inputMode="numeric"
              defaultValue={1000}
              required
            />
          </Field>
          <Button type="submit" disabled={saving}>
            {saving ? "Čuvam…" : "Sačuvaj radnika"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
