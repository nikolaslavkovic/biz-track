import { DeleteButton } from "@/components/form-buttons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/lib/actions";
import { listProjects } from "@/lib/analytics";
import {
  PROJECT_STATUSES,
  formatDate,
  formatMoney,
  todayISO,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjektiPage() {
  const items = await listProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Projekti
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Unesite projekte koje radite, početak, završetak i zaradu sa projekta.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
          Novi projekat
        </h2>
        <form action={createProject} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Naziv">
            <Input name="name" required placeholder="npr. Kuća Petrović" />
          </Field>
          <Field label="Klijent">
            <Input name="client" placeholder="Ime klijenta" />
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
          <Field label="Zarada / prihod (RSD)">
            <Input name="revenue" type="number" min="0" step="1" defaultValue="0" />
          </Field>
          <Field label="Opis" className="sm:col-span-2 lg:col-span-3">
            <Textarea name="description" placeholder="Šta se radi na projektu..." />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit">Sačuvaj projekat</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        {items.length === 0 ? (
          <Card>
            <p className="text-[var(--muted)]">Još nema projekata. Unesite prvi iznad.</p>
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
                      {p.client || "Bez klijenta"} · trenutno {formatMoney(p.revenue)}
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
                  <Field label="Klijent">
                    <Input name="client" defaultValue={p.client} />
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
                  <Field label="Zarada (RSD)">
                    <Input
                      name="revenue"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={p.revenue}
                    />
                  </Field>
                  <Field label="Opis" className="sm:col-span-2 lg:col-span-3">
                    <Textarea name="description" defaultValue={p.description} />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="secondary">
                    Ažuriraj
                  </Button>
                  <DeleteButton onDelete={async () => {
                    "use server";
                    await deleteProject(p.id);
                  }} />
                </div>
              </form>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
