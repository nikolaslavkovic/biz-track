import { DeleteButton } from "@/components/form-buttons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import {
  createProject,
  deleteProject,
  updateEurRate,
  updateProject,
} from "@/lib/actions";
import { getEurToRsdRate, listProjects } from "@/lib/analytics";
import {
  PROJECT_STATUSES,
  ROOF_TYPES,
  SALE_CURRENCIES,
  formatDate,
  formatDimensions,
  formatSalePrice,
  roofLabel,
  todayISO,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjektiPage() {
  const [items, eurToRsd] = await Promise.all([
    listProjects(),
    getEurToRsdRate(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Projekti — čelične hale
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Unesite dimenzije hale, tip krova, klijenta i ukupnu prodajnu cenu u
          dinarima ili evrima (sve se sabira u dinarima).
        </p>
      </div>

      <Card className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Kurs EUR → RSD
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Cene u evrima se množe ovim kursom za grafikone i neto obračun.
          </p>
        </div>
        <form action={updateEurRate} className="flex flex-wrap items-end gap-2">
          <Field label="1 EUR =">
            <Input
              name="eurToRsd"
              type="number"
              min="1"
              step="0.01"
              required
              defaultValue={eurToRsd}
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
          Nova hala / projekat
        </h2>
        <form
          action={createProject}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Field label="Naziv hale / projekta">
            <Input name="name" required placeholder="npr. Hala Petrović" />
          </Field>
          <Field label="Ime klijenta">
            <Input name="client" required placeholder="Ime i prezime" />
          </Field>
          <Field label="Telefon klijenta">
            <Input name="clientPhone" placeholder="06x xxx xxxx" />
          </Field>

          <Field label="Širina (m)">
            <Input name="widthM" type="number" min="0" step="0.1" required placeholder="12" />
          </Field>
          <Field label="Dužina (m)">
            <Input name="lengthM" type="number" min="0" step="0.1" required placeholder="24" />
          </Field>
          <Field label="Visina (m)">
            <Input name="heightM" type="number" min="0" step="0.1" required placeholder="5" />
          </Field>

          <Field label="Tip krova">
            <Select name="roofType" defaultValue="dve_vode">
              {ROOF_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ukupna prodajna cena">
            <Input
              name="revenue"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="npr. 15000"
            />
          </Field>
          <Field label="Valuta cene">
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
            <Input name="startDate" type="date" required defaultValue={todayISO()} />
          </Field>
          <Field label="Završetak">
            <Input name="endDate" type="date" />
          </Field>

          <Field label="Napomena" className="sm:col-span-2 lg:col-span-3">
            <Input name="description" placeholder="Opciono" />
          </Field>

          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit">Sačuvaj projekat</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        {items.length === 0 ? (
          <Card>
            <p className="text-[var(--muted)]">Još nema projekata. Unesite prvu halu iznad.</p>
          </Card>
        ) : (
          items.map((p) => (
            <Card key={p.id}>
              <form action={updateProject} className="space-y-3">
                <input type="hidden" name="id" value={p.id} />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                      #{p.id} · {formatDate(p.startDate)}
                      {p.endDate ? ` → ${formatDate(p.endDate)}` : " → u toku"}
                    </p>
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                      {p.name}
                    </h3>
                    <p className="text-sm text-[var(--muted)]">
                      {formatDimensions(p.lengthM, p.widthM, p.heightM)} ·{" "}
                      {roofLabel(p.roofType)}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {p.client || "Bez klijenta"}
                      {p.clientPhone ? ` · ${p.clientPhone}` : ""}
                    </p>
                    <p className="text-sm font-medium text-[var(--accent)]">
                      {formatSalePrice(p.revenue, p.revenueCurrency, eurToRsd)}
                    </p>
                  </div>
                  <span
                    className={
                      p.status === "aktivan"
                        ? "rounded-md bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-800"
                        : p.status === "zavrsen"
                          ? "rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
                          : "rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800"
                    }
                  >
                    {PROJECT_STATUSES.find((s) => s.value === p.status)?.label}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Naziv">
                    <Input name="name" defaultValue={p.name} required />
                  </Field>
                  <Field label="Ime klijenta">
                    <Input name="client" defaultValue={p.client} />
                  </Field>
                  <Field label="Telefon">
                    <Input name="clientPhone" defaultValue={p.clientPhone} />
                  </Field>
                  <Field label="Širina (m)">
                    <Input
                      name="widthM"
                      type="number"
                      min="0"
                      step="0.1"
                      defaultValue={p.widthM}
                    />
                  </Field>
                  <Field label="Dužina (m)">
                    <Input
                      name="lengthM"
                      type="number"
                      min="0"
                      step="0.1"
                      defaultValue={p.lengthM}
                    />
                  </Field>
                  <Field label="Visina (m)">
                    <Input
                      name="heightM"
                      type="number"
                      min="0"
                      step="0.1"
                      defaultValue={p.heightM}
                    />
                  </Field>
                  <Field label="Tip krova">
                    <Select name="roofType" defaultValue={p.roofType}>
                      {ROOF_TYPES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Ukupna prodajna cena">
                    <Input
                      name="revenue"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={p.revenue}
                    />
                  </Field>
                  <Field label="Valuta">
                    <Select
                      name="revenueCurrency"
                      defaultValue={p.revenueCurrency || "RSD"}
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
                    <Input name="startDate" type="date" defaultValue={p.startDate} required />
                  </Field>
                  <Field label="Završetak">
                    <Input name="endDate" type="date" defaultValue={p.endDate ?? ""} />
                  </Field>
                  <Field label="Napomena" className="sm:col-span-2 lg:col-span-3">
                    <Input name="description" defaultValue={p.description} />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="secondary">
                    Ažuriraj
                  </Button>
                  <DeleteButton
                    onDelete={async () => {
                      "use server";
                      await deleteProject(p.id);
                    }}
                  />
                </div>
              </form>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
