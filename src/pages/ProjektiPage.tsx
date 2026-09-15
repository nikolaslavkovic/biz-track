import { useState, type FormEvent } from "react";
import { db, setEurToRsdRate, type Project } from "../db";
import { Button, Card, Field, Input, Select } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  PROJECT_STATUSES,
  ROOF_TYPES,
  SALE_CURRENCIES,
  formatDate,
  formatDimensions,
  formatSalePrice,
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

  async function saveRate(e: FormEvent) {
    e.preventDefault();
    await setEurToRsdRate(Number(rate));
    await onChange();
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await db.projects.add({
      name: String(fd.get("name") || "").trim(),
      client: String(fd.get("client") || "").trim(),
      clientPhone: String(fd.get("clientPhone") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      startDate: String(fd.get("startDate") || todayISO()),
      endDate: String(fd.get("endDate") || "") || null,
      status: String(fd.get("status") || "aktivan") as Project["status"],
      revenue: Number(fd.get("revenue") || 0),
      revenueCurrency: String(fd.get("revenueCurrency") || "RSD") as Project["revenueCurrency"],
      lengthM: Number(fd.get("lengthM") || 0),
      widthM: Number(fd.get("widthM") || 0),
      heightM: Number(fd.get("heightM") || 0),
      roofType: String(fd.get("roofType") || "dve_vode") as Project["roofType"],
      createdAt: new Date().toISOString(),
    });
    e.currentTarget.reset();
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
      revenueCurrency: String(fd.get("revenueCurrency") || "RSD") as Project["revenueCurrency"],
      lengthM: Number(fd.get("lengthM") || 0),
      widthM: Number(fd.get("widthM") || 0),
      heightM: Number(fd.get("heightM") || 0),
      roofType: String(fd.get("roofType") || "dve_vode") as Project["roofType"],
    });
    await onChange();
  }

  async function remove(id: number) {
    if (!confirm("Obrisati projekat?")) return;
    await db.projects.delete(id);
    await onChange();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Projekti — čelične hale
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Dimenzije, krov, klijent i cena u dinarima ili evrima.
        </p>
      </div>

      <Card className="flex flex-wrap items-end gap-4">
        <div className="min-w-[180px] flex-1">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Kurs EUR → RSD
          </h2>
        </div>
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

      <Card>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
          Nova hala
        </h2>
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <Input name="startDate" type="date" defaultValue={todayISO()} required />
          </Field>
          <Field label="Završetak">
            <Input name="endDate" type="date" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit">Sačuvaj</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        {projects.map((p) => (
          <Card key={p.id}>
            <form onSubmit={(e) => update(e, p.id!)} className="space-y-3">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                    {p.name}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    {formatDimensions(p.lengthM, p.widthM, p.heightM)} ·{" "}
                    {roofLabel(p.roofType)}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {p.client}
                    {p.clientPhone ? ` · ${p.clientPhone}` : ""} ·{" "}
                    {formatDate(p.startDate)}
                  </p>
                  <p className="font-medium text-[var(--accent)]">
                    {formatSalePrice(p.revenue, p.revenueCurrency, eurToRsd)}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Naziv">
                  <Input name="name" defaultValue={p.name} required />
                </Field>
                <Field label="Klijent">
                  <Input name="client" defaultValue={p.client} />
                </Field>
                <Field label="Telefon">
                  <Input name="clientPhone" defaultValue={p.clientPhone} />
                </Field>
                <Field label="Širina">
                  <Input name="widthM" type="number" step="0.1" defaultValue={p.widthM} />
                </Field>
                <Field label="Dužina">
                  <Input name="lengthM" type="number" step="0.1" defaultValue={p.lengthM} />
                </Field>
                <Field label="Visina">
                  <Input name="heightM" type="number" step="0.1" defaultValue={p.heightM} />
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
                  <Input name="revenue" type="number" step="0.01" defaultValue={p.revenue} />
                </Field>
                <Field label="Valuta">
                  <Select name="revenueCurrency" defaultValue={p.revenueCurrency}>
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
                  <Input name="startDate" type="date" defaultValue={p.startDate} />
                </Field>
                <Field label="Završetak">
                  <Input name="endDate" type="date" defaultValue={p.endDate ?? ""} />
                </Field>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="secondary">
                  Ažuriraj
                </Button>
                <Button type="button" variant="ghost" className="text-[var(--danger)]" onClick={() => remove(p.id!)}>
                  Obriši
                </Button>
              </div>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
