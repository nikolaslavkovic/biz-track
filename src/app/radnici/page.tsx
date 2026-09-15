import { DeleteButton } from "@/components/form-buttons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import {
  createWorkLog,
  createWorker,
  deleteWorkLog,
  deleteWorker,
  updateWorker,
} from "@/lib/actions";
import { listProjects, listWorkLogs, listWorkers } from "@/lib/analytics";
import { formatDate, formatHours, formatMoney, todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RadniciPage() {
  const [workerList, logs, projectList] = await Promise.all([
    listWorkers(),
    listWorkLogs(),
    listProjects(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Radnici i sati
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Dodajte radnike sa satnicom, pa svaki dan unosite odrađene sate po
          projektu. Sistem računa trošak rada i neto zaradu po satu.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
            Novi radnik
          </h2>
          <form action={createWorker} className="grid gap-3 sm:grid-cols-2">
            <Field label="Ime i prezime">
              <Input name="name" required placeholder="npr. Nikola Jovanović" />
            </Field>
            <Field label="Satnica (RSD/h)">
              <Input
                name="hourlyRate"
                type="number"
                min="0"
                step="1"
                required
                defaultValue="1000"
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Dodaj radnika</Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
            Unos radnih sati
          </h2>
          {workerList.filter((w) => w.active).length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Prvo dodajte bar jednog radnika.
            </p>
          ) : (
            <form action={createWorkLog} className="grid gap-3 sm:grid-cols-2">
              <Field label="Datum">
                <Input name="date" type="date" required defaultValue={todayISO()} />
              </Field>
              <Field label="Radnik">
                <Select name="workerId" required defaultValue="">
                  <option value="" disabled>
                    Izaberite...
                  </option>
                  {workerList
                    .filter((w) => w.active)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatMoney(w.hourlyRate)}/h)
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Sati">
                <Input
                  name="hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  defaultValue="8"
                />
              </Field>
              <Field label="Projekat">
                <Select name="projectId" defaultValue="">
                  <option value="">— bez projekta —</option>
                  {projectList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Napomena" className="sm:col-span-2">
                <Input name="note" placeholder="Opciono" />
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit">Sačuvaj sate</Button>
              </div>
            </form>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
          Spisak radnika
        </h2>
        <div className="space-y-3">
          {workerList.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nema radnika.</p>
          ) : (
            workerList.map((w) => (
              <form
                key={w.id}
                action={updateWorker}
                className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)]/50 p-3"
              >
                <input type="hidden" name="id" value={w.id} />
                <Field label="Ime" className="min-w-[180px] flex-1">
                  <Input name="name" defaultValue={w.name} required />
                </Field>
                <Field label="Satnica">
                  <Input
                    name="hourlyRate"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={w.hourlyRate}
                    required
                  />
                </Field>
                <Field label="Aktivan">
                  <Select name="active" defaultValue={w.active ? "true" : "false"}>
                    <option value="true">Da</option>
                    <option value="false">Ne</option>
                  </Select>
                </Field>
                <Button type="submit" variant="secondary" size="sm">
                  Sačuvaj
                </Button>
                <DeleteButton
                  onDelete={async () => {
                    "use server";
                    await deleteWorker(w.id);
                  }}
                />
              </form>
            ))
          )}
        </div>
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Istorija radnih sati
          </h2>
        </div>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Radnik</th>
              <th className="px-4 py-3 font-medium">Projekat</th>
              <th className="px-4 py-3 font-medium text-right">Sati</th>
              <th className="px-4 py-3 font-medium text-right">Trošak</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                  Nema unosa sati.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.date)}</td>
                  <td className="px-4 py-3 font-medium">{l.workerName}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {l.projectName || "—"}
                    {l.note ? (
                      <span className="block text-xs">{l.note}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">{formatHours(l.hours)}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatMoney(Number(l.cost))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton
                      onDelete={async () => {
                        "use server";
                        await deleteWorkLog(l.id);
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
