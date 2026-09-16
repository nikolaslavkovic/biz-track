import { useState, type FormEvent } from "react";
import { db } from "../db";
import { Button, Card, Field, Input, Select } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  formatDate,
  formatHours,
  formatMoney,
  formatWeekRange,
  recentWeekOptions,
  weekStartISO,
} from "../lib/utils";

export function RadniciPage({
  data,
  onChange,
}: {
  data: DashboardData;
  onChange: () => Promise<void>;
}) {
  const { workers, workLogs, weekly } = data;
  const active = workers.filter((w) => w.active);
  const currentWeekStart = weekStartISO();
  const currentWeek = weekly.find((w) => w.weekStart === currentWeekStart);
  const weekOptions = recentWeekOptions(20);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      // restore default satnica after reset
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
    const form = e.currentTarget;
    const fd = new FormData(form);
    const weekStart = String(fd.get("weekStart") || weekStartISO());
    const label = formatWeekRange(weekStart);
    const noteExtra = String(fd.get("note") || "").trim();
    const now = new Date().toISOString();
    const rows = [];
    for (const [key, value] of fd.entries()) {
      if (!key.startsWith("hours_")) continue;
      const workerId = Number(key.slice(6));
      const hours = Number(value);
      if (!workerId || !hours) continue;
      rows.push({
        workerId,
        date: weekStart,
        hours,
        note: noteExtra ? `Nedelja ${label} · ${noteExtra}` : `Nedelja ${label}`,
        createdAt: now,
      });
    }
    if (!rows.length) {
      setMessage("Unesite sate za bar jednog radnika.");
      return;
    }
    setSaving(true);
    try {
      await db.workLogs.bulkAdd(rows);
      form.reset();
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
    const form = e.currentTarget;
    const fd = new FormData(form);
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

  async function removeLog(id: number) {
    if (!confirm("Obrisati unos?")) return;
    await db.workLogs.delete(id);
    await onChange();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Radnici i sati
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Nedeljni unos sati za isplatu — bez podele po projektu.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
          {message}
        </div>
      ) : null}

      {currentWeek ? (
        <Card className="border-[var(--accent)]/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            Tekuća nedelja · {currentWeek.label}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-[var(--muted)]">Ukupno sati</p>
              <p className="text-2xl font-semibold">{formatHours(currentWeek.totalHours)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Za isplatu</p>
              <p className="text-2xl font-semibold text-[var(--accent)]">
                {formatMoney(currentWeek.totalCost)}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="order-1 lg:col-span-2 lg:order-none">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
            Novi radnik
          </h2>
          <form onSubmit={addWorker} className="grid gap-3">
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
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Čuvam…" : "Sačuvaj radnika"}
            </Button>
          </form>
        </Card>

        <Card className="order-2 lg:col-span-3 lg:order-none">
          <h2 className="mb-1 font-[family-name:var(--font-display)] text-lg font-semibold">
            Nedeljni unos sati
          </h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Svi rade na svim projektima — samo sati po radniku.
          </p>
          {active.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Prvo sačuvajte bar jednog radnika iznad.
            </p>
          ) : (
            <form onSubmit={saveWeekly} className="space-y-4">
              <Field label="Radna nedelja">
                <Select name="weekStart" defaultValue={currentWeekStart} required>
                  {weekOptions.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="space-y-3">
                {active.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)]/40 p-3"
                  >
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <p className="font-medium">{w.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatMoney(w.hourlyRate)}/h
                      </p>
                    </div>
                    <Field label="Sati ove nedelje">
                      <Input
                        name={`hours_${w.id}`}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.5"
                        placeholder="0"
                      />
                    </Field>
                  </div>
                ))}
              </div>
              <Field label="Napomena">
                <Input name="note" placeholder="opciono" />
              </Field>
              <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                Sačuvaj nedeljne sate
              </Button>
            </form>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          Pregled po nedeljama
        </h2>
        {weekly.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">Još nema unosa sati.</p>
          </Card>
        ) : (
          weekly.map((week) => (
            <Card key={week.weekStart} className="overflow-x-auto p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--surface-2)]/60 px-4 py-3">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  {week.label}
                </h3>
                <p className="text-sm">
                  {formatHours(week.totalHours)} ·{" "}
                  <strong className="text-[var(--accent)]">
                    {formatMoney(week.totalCost)}
                  </strong>
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {week.workers.map((w) => (
                    <tr key={w.workerId} className="border-t border-[var(--line)]">
                      <td className="px-4 py-2 font-medium">{w.workerName}</td>
                      <td className="px-4 py-2 text-right">{formatHours(w.hours)}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatMoney(w.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))
        )}
      </div>

      <Card>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
          Spisak radnika ({workers.length})
        </h2>
        <div className="space-y-3">
          {workers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nema radnika.</p>
          ) : (
            workers.map((w) => (
              <form
                key={w.id}
                onSubmit={(e) => updateWorker(e, w.id!)}
                className="grid gap-3 rounded-lg border border-[var(--line)] p-3 sm:flex sm:flex-wrap sm:items-end"
              >
                <Field label="Ime" className="min-w-[160px] sm:flex-1">
                  <Input name="name" defaultValue={w.name} required />
                </Field>
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

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Detaljni unosi
          </h2>
        </div>
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-[var(--surface-2)] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 text-left">Nedelja</th>
              <th className="px-4 py-3 text-left">Radnik</th>
              <th className="px-4 py-3 text-right">Sati</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {workLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted)]">
                  Nema unosa.
                </td>
              </tr>
            ) : (
              workLogs.map((l) => {
                const w = workers.find((x) => x.id === l.workerId);
                return (
                  <tr key={l.id} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">
                      {formatWeekRange(weekStartISO(l.date))}
                      <span className="block text-xs text-[var(--muted)]">
                        {formatDate(l.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{w?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{formatHours(l.hours)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-[var(--danger)]"
                        onClick={() => removeLog(l.id!)}
                      >
                        Obriši
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
