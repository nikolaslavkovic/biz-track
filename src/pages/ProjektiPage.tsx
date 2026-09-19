import { useState, type FormEvent } from "react";
import { db, setEurToRsdRate, type Project } from "../db";
import { Button, Card, Field, Input, Select } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  HALL_WIDTH_COLORS,
  PROJECT_STATUSES,
  ROOF_TYPES,
  SALE_CURRENCIES,
  formatDate,
  formatDimensions,
  formatSalePrice,
  hallColor,
  projectRate,
  roofLabel,
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
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const ordered = [...projects].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  const selected = ordered.find((p) => p.id === selectedId) ?? null;

  async function saveRate(e: FormEvent) {
    e.preventDefault();
    await setEurToRsdRate(Number(rate));
    await onChange();
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const id = await db.projects.add({
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
    setSelectedId(id as number);
    await onChange();
  }

  async function update(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
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
    await onChange();
  }

  async function remove(id: number) {
    if (!confirm("Obrisati porudžbinu?")) return;
    await db.projects.delete(id);
    if (selectedId === id) setSelectedId(null);
    await onChange();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
          Hale — porudžbine
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Klikni na dimenzije da otvoriš detalje ispod
        </p>
      </div>

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
              const colors = hallColor(p.widthM);
              const active = selectedId === p.id;
              const dashed = p.roofType === "jedna_voda";

              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedId(active ? null : (p.id ?? null))
                    }
                    className="flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-shadow"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      borderStyle: dashed ? "dashed" : "solid",
                      color: colors.text,
                      boxShadow: active
                        ? `0 0 0 2px ${colors.chip}`
                        : undefined,
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: colors.chip }}
                    >
                      #{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight sm:text-lg">
                        {formatDimensions(p.lengthM, p.widthM, p.heightM)}
                      </p>
                      <p className="mt-0.5 text-xs opacity-75">
                        {p.roofType === "jedna_voda" ? "1 voda" : "2 vode"}
                        {p.client ? ` · ${p.client}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold uppercase opacity-60">
                      {active ? "▲" : "▼"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Detalji ispod liste */}
        {selected ? (
          <Card className="!p-3 sm:!p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
                  {formatDimensions(
                    selected.lengthM,
                    selected.widthM,
                    selected.heightM,
                  )}
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  {selected.name || "Bez naziva"} · {roofLabel(selected.roofType)}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {selected.client}
                  {selected.clientPhone ? ` · ${selected.clientPhone}` : ""}
                </p>
                <p className="mt-1 font-semibold text-[var(--accent)]">
                  {formatSalePrice(
                    selected.revenue,
                    selected.revenueCurrency,
                    projectRate(selected, eurToRsd),
                  )}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {formatDate(selected.startDate)}
                  {selected.endDate ? ` – ${formatDate(selected.endDate)}` : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedId(null)}
              >
                Zatvori
              </Button>
            </div>

            <form
              key={selected.id}
              onSubmit={(e) => update(e, selected.id!)}
              className="space-y-3 border-t border-[var(--line)] pt-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Naziv">
                  <Input name="name" defaultValue={selected.name} required />
                </Field>
                <Field label="Klijent">
                  <Input name="client" defaultValue={selected.client} />
                </Field>
                <Field label="Telefon">
                  <Input
                    name="clientPhone"
                    defaultValue={selected.clientPhone}
                  />
                </Field>
                <Field label="Širina (m)">
                  <Input
                    name="widthM"
                    type="number"
                    step="0.1"
                    defaultValue={selected.widthM}
                  />
                </Field>
                <Field label="Dužina (m)">
                  <Input
                    name="lengthM"
                    type="number"
                    step="0.1"
                    defaultValue={selected.lengthM}
                  />
                </Field>
                <Field label="Visina (m)">
                  <Input
                    name="heightM"
                    type="number"
                    step="0.1"
                    defaultValue={selected.heightM}
                  />
                </Field>
                <Field label="Krov">
                  <Select name="roofType" defaultValue={selected.roofType}>
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
                    defaultValue={selected.revenue}
                  />
                </Field>
                <Field label="Valuta">
                  <Select
                    name="revenueCurrency"
                    defaultValue={selected.revenueCurrency}
                  >
                    {SALE_CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Status">
                  <Select name="status" defaultValue={selected.status}>
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
                    defaultValue={selected.startDate}
                  />
                </Field>
                <Field label="Završetak">
                  <Input
                    name="endDate"
                    type="date"
                    defaultValue={selected.endDate ?? ""}
                  />
                </Field>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Zaključan kurs:{" "}
                <strong>
                  1 EUR = {projectRate(selected, eurToRsd)} RSD
                </strong>
              </p>
              <div className="flex gap-2">
                <Button type="submit" variant="secondary">
                  Sačuvaj izmene
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[var(--danger)]"
                  onClick={() => remove(selected.id!)}
                >
                  Obriši
                </Button>
              </div>
            </form>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-[var(--muted)]">
          {Object.entries(HALL_WIDTH_COLORS).map(([w, c]) => (
            <span key={w} className="inline-flex items-center gap-1">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: c.chip }}
              />
              {w}m
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-5 rounded border-2 border-slate-500 border-solid" />
            2 vode
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-5 rounded border-2 border-slate-500 border-dashed" />
            1 voda
          </span>
        </div>
      </section>

      <Card>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
          Nova porudžbina
        </h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          EUR cena koristi trenutni kurs ({eurToRsd}) i zaključava se na
          porudžbini.
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
