import { useState, type FormEvent } from "react";
import { db, setEurToRsdRate, type Project } from "../db";
import { Button, Card, Field, Input, Select } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  PROJECT_STATUSES,
  ROOF_TYPES,
  SALE_CURRENCIES,
  formatDimensions,
  formatSalePrice,
  hallColor,
  projectRate,
  todayISO,
} from "../lib/utils";

export function ProjektiPage({
  data,
  onChange,
}: {
  data: DashboardData;
  onChange: () => Promise<void>;
}) {
  const { projects, eurToRsd } = data;
  const [rate, setRate] = useState(String(eurToRsd));
  const [editingId, setEditingId] = useState<number | null>(null);

  // Red porudžbine = redosled unosa (id rastuće)
  const ordered = [...projects].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  async function saveRate(e: FormEvent) {
    e.preventDefault();
    await setEurToRsdRate(Number(rate));
    await onChange();
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    await db.projects.add({
      name: String(fd.get("name") || "").trim(),
      client: String(fd.get("client") || "").trim(),
      clientPhone: String(fd.get("clientPhone") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      startDate: String(fd.get("startDate") || todayISO()),
      endDate: String(fd.get("endDate") || "") || null,
      status: String(fd.get("status") || "aktivan") as Project["status"],
      revenue: Number(fd.get("revenue") || 0),
      revenueCurrency: String(
        fd.get("revenueCurrency") || "RSD",
      ) as Project["revenueCurrency"],
      eurRateAtSale: eurToRsd,
      lengthM: Number(fd.get("lengthM") || 0),
      widthM: Number(fd.get("widthM") || 0),
      heightM: Number(fd.get("heightM") || 0),
      roofType: String(fd.get("roofType") || "dve_vode") as Project["roofType"],
      createdAt: new Date().toISOString(),
    });
    form.reset();
    await onChange();
  }

  async function update(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // eurRateAtSale se NE menja — ostaje kurs iz trenutka unosa
    await db.projects.update(id, {
      name: String(fd.get("name") || "").trim(),
      client: String(fd.get("client") || "").trim(),
      clientPhone: String(fd.get("clientPhone") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      startDate: String(fd.get("startDate")),
      endDate: String(fd.get("endDate") || "") || null,
      status: String(fd.get("status") || "aktivan") as Project["status"],
      revenue: Number(fd.get("revenue") || 0),
      revenueCurrency: String(
        fd.get("revenueCurrency") || "RSD",
      ) as Project["revenueCurrency"],
      lengthM: Number(fd.get("lengthM") || 0),
      widthM: Number(fd.get("widthM") || 0),
      heightM: Number(fd.get("heightM") || 0),
      roofType: String(fd.get("roofType") || "dve_vode") as Project["roofType"],
    });
    setEditingId(null);
    await onChange();
  }

  async function remove(id: number) {
    if (!confirm("Obrisati porudžbinu?")) return;
    await db.projects.delete(id);
    if (editingId === id) setEditingId(null);
    await onChange();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
          Hale — porudžbine
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Po redu unosa · boja = širina · ivica: puna = 2 vode, isprekidana = 1
          voda
        </p>
      </div>

      {/* 1) Spisak porudžbina */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Poručene hale ({ordered.length})
        </h2>
        {ordered.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">Još nema porudžbina.</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {ordered.map((p, index) => {
              const colors = hallColor(p.widthM, p.roofType);
              const rateUsed = projectRate(p, eurToRsd);
              const isEdit = editingId === p.id;
              const dashed = p.roofType === "jedna_voda";

              return (
                <li key={p.id}>
                  <div
                    className="overflow-hidden rounded-xl border-2"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      borderStyle: dashed ? "dashed" : "solid",
                      color: colors.text,
                    }}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 px-3 py-3 text-left"
                      onClick={() =>
                        setEditingId(isEdit ? null : (p.id ?? null))
                      }
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: colors.chip }}
                      >
                        #{index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate font-semibold">{p.name}</p>
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white"
                            style={{ backgroundColor: colors.chip }}
                          >
                            {p.widthM}m
                          </span>
                          <span className="rounded border border-current/30 px-1.5 py-0.5 text-[10px] font-semibold">
                            {p.roofType === "jedna_voda" ? "1 voda" : "2 vode"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs opacity-80">
                          {formatDimensions(p.lengthM, p.widthM, p.heightM)} ·{" "}
                          {p.client}
                          {p.clientPhone ? ` · ${p.clientPhone}` : ""}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatSalePrice(
                            p.revenue,
                            p.revenueCurrency,
                            rateUsed,
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] font-medium uppercase opacity-60">
                        {isEdit ? "Zatvori" : "Izmeni"}
                      </span>
                    </button>

                    {isEdit ? (
                      <form
                        onSubmit={(e) => update(e, p.id!)}
                        className="space-y-3 border-t border-black/10 bg-white/70 px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Naziv">
                            <Input name="name" defaultValue={p.name} required />
                          </Field>
                          <Field label="Klijent">
                            <Input name="client" defaultValue={p.client} />
                          </Field>
                          <Field label="Telefon">
                            <Input
                              name="clientPhone"
                              defaultValue={p.clientPhone}
                            />
                          </Field>
                          <Field label="Širina">
                            <Input
                              name="widthM"
                              type="number"
                              step="0.1"
                              defaultValue={p.widthM}
                            />
                          </Field>
                          <Field label="Dužina">
                            <Input
                              name="lengthM"
                              type="number"
                              step="0.1"
                              defaultValue={p.lengthM}
                            />
                          </Field>
                          <Field label="Visina">
                            <Input
                              name="heightM"
                              type="number"
                              step="0.1"
                              defaultValue={p.heightM}
                            />
                          </Field>
                          <Field label="Krov">
                            <Select name="roofType" defaultValue={p.roofType}>
                              {ROOF_TYPES.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </Select>
                          </Field>
                          <Field label="Cena">
                            <Input
                              name="revenue"
                              type="number"
                              step="0.01"
                              defaultValue={p.revenue}
                            />
                          </Field>
                          <Field label="Valuta">
                            <Select
                              name="revenueCurrency"
                              defaultValue={p.revenueCurrency}
                            >
                              {SALE_CURRENCIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </Select>
                          </Field>
                          <Field label="Status">
                            <Select name="status" defaultValue={p.status}>
                              {PROJECT_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </Select>
                          </Field>
                          <Field label="Početak">
                            <Input
                              name="startDate"
                              type="date"
                              defaultValue={p.startDate}
                            />
                          </Field>
                          <Field label="Završetak">
                            <Input
                              name="endDate"
                              type="date"
                              defaultValue={p.endDate ?? ""}
                            />
                          </Field>
                        </div>
                        <p className="text-[11px] text-[var(--muted)]">
                          Zaključan kurs ove porudžbine:{" "}
                          <strong>1 EUR = {rateUsed} RSD</strong> (ne menja se)
                        </p>
                        <div className="flex gap-2">
                          <Button type="submit" variant="secondary">
                            Sačuvaj izmene
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-[var(--danger)]"
                            onClick={() => remove(p.id!)}
                          >
                            Obriši
                          </Button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Legenda */}
        <div className="flex flex-wrap gap-3 pt-1 text-[10px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-6 rounded border-2 border-teal-700 border-solid" />
            2 vode
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-6 rounded border-2 border-teal-700 border-dashed" />
            1 voda
          </span>
          <span>Boja kartice = širina hale</span>
        </div>
      </section>

      {/* 2) Nova porudžbina */}
      <Card>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
          Nova porudžbina
        </h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Ako je cena u EUR, koristi se trenutni kurs ({eurToRsd}) i zaključava
          se na ovoj porudžbini.
        </p>
        <form
          onSubmit={create}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Field label="Naziv">
            <Input name="name" required placeholder="Hala Petrović" />
          </Field>
          <Field label="Klijent">
            <Input name="client" required />
          </Field>
          <Field label="Telefon">
            <Input name="clientPhone" />
          </Field>
          <Field label="Širina (m)">
            <Input name="widthM" type="number" step="0.1" required />
          </Field>
          <Field label="Dužina (m)">
            <Input name="lengthM" type="number" step="0.1" required />
          </Field>
          <Field label="Visina (m)">
            <Input name="heightM" type="number" step="0.1" required />
          </Field>
          <Field label="Krov">
            <Select name="roofType" defaultValue="dve_vode">
              {ROOF_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prodajna cena">
            <Input name="revenue" type="number" step="0.01" required />
          </Field>
          <Field label="Valuta">
            <Select name="revenueCurrency" defaultValue="RSD">
              {SALE_CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="aktivan">
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Početak">
            <Input
              name="startDate"
              type="date"
              defaultValue={todayISO()}
              required
            />
          </Field>
          <Field label="Završetak">
            <Input name="endDate" type="date" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit">Sačuvaj porudžbinu</Button>
          </div>
        </form>
      </Card>

      {/* 3) Kurs na kraju */}
      <Card>
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Kurs EUR → RSD
        </h2>
        <p className="mt-1 mb-3 text-xs text-[var(--muted)]">
          Važi samo za <strong>nove</strong> porudžbine. Stare EUR hale ostaju
          na kursu koji je važio kad su unete.
        </p>
        <form onSubmit={saveRate} className="flex flex-wrap items-end gap-2">
          <Field label="1 EUR =">
            <Input
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              type="number"
              min="1"
              step="0.01"
              required
              className="w-36"
            />
          </Field>
          <span className="mb-2 text-sm text-[var(--muted)]">RSD</span>
          <Button type="submit" variant="secondary">
            Sačuvaj kurs
          </Button>
        </form>
      </Card>
    </div>
  );
}
