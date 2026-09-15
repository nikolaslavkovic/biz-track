import { DeleteButton } from "@/components/form-buttons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import {
  createWeeklyWorkLogs,
  createWorker,
  deleteWorkLog,
  deleteWorker,
  updateWorker,
} from "@/lib/actions";
import {
  getWeeklyPayroll,
  listWorkLogs,
  listWorkers,
} from "@/lib/analytics";
import {
  formatDate,
  formatHours,
  formatMoney,
  formatWeekRange,
  toWeekInputValue,
  weekStartISO,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RadniciPage() {
  const [workerList, logs, weekly] = await Promise.all([
    listWorkers(),
    listWorkLogs(),
    getWeeklyPayroll(),
  ]);

  const activeWorkers = workerList.filter((w) => w.active);
  const currentWeekStart = weekStartISO();
  const currentWeek = weekly.find((w) => w.weekStart === currentWeekStart);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Radnici i sati
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Na kraju radne nedelje unesite sate za sve radnike — odmah vidite koliko
          koga treba da platite.
        </p>
      </div>

      {currentWeek ? (
        <Card className="border-[var(--accent)]/30 bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Tekuća nedelja · {currentWeek.label}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
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
            <div>
              <p className="text-xs text-[var(--muted)]">Radnika sa satima</p>
              <p className="text-2xl font-semibold">{currentWeek.workers.length}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
            Novi radnik
          </h2>
          <form action={createWorker} className="grid gap-3">
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
            <Button type="submit">Dodaj radnika</Button>
          </form>
        </Card>

        <Card className="lg:col-span-3">
          <h2 className="mb-1 font-[family-name:var(--font-display)] text-lg font-semibold">
            Nedeljni unos sati
          </h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Izaberite nedelju (pon–ned), upišite sate pored svakog radnika i sačuvajte.
            Svi rade na svim projektima — sati se vode samo po radniku.
          </p>
          {activeWorkers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Prvo dodajte bar jednog radnika.
            </p>
          ) : (
            <form action={createWeeklyWorkLogs} className="space-y-4">
              <Field label="Radna nedelja">
                <Input
                  name="week"
                  type="week"
                  required
                  defaultValue={toWeekInputValue()}
                />
              </Field>

              <div className="overflow-x-auto rounded-lg border border-[var(--line)]">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Radnik</th>
                      <th className="px-3 py-2 font-medium">Satnica</th>
                      <th className="px-3 py-2 font-medium text-right">Sati ove nedelje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeWorkers.map((w) => (
                      <tr key={w.id} className="border-t border-[var(--line)]">
                        <td className="px-3 py-2 font-medium">{w.name}</td>
                        <td className="px-3 py-2 text-[var(--muted)]">
                          {formatMoney(w.hourlyRate)}/h
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Input
                            name={`hours_${w.id}`}
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="0"
                            className="ml-auto max-w-[120px] text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Field label="Napomena (opciono)">
                <Input name="note" placeholder="npr. isplata u petak" />
              </Field>

              <Button type="submit">Sačuvaj nedeljne sate</Button>
            </form>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            Pregled po nedeljama
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Koliko je ko radio i koliko treba isplatiti za tu nedelju.
          </p>
        </div>

        {weekly.length === 0 ? (
          <Card>
            <p className="text-[var(--muted)]">
              Još nema unosa. Sačuvajte prvu nedelju iznad.
            </p>
          </Card>
        ) : (
          weekly.map((week) => (
            <Card key={week.weekStart} className="overflow-x-auto p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--surface-2)]/60 px-4 py-3">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                    {week.label}
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {week.weekStart === currentWeekStart
                      ? "Tekuća nedelja"
                      : "Završena nedelja"}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>
                    <span className="text-[var(--muted)]">Sati: </span>
                    <strong>{formatHours(week.totalHours)}</strong>
                  </p>
                  <p>
                    <span className="text-[var(--muted)]">Isplata: </span>
                    <strong className="text-[var(--accent)]">
                      {formatMoney(week.totalCost)}
                    </strong>
                  </p>
                </div>
              </div>
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-2 font-medium">Radnik</th>
                    <th className="px-4 py-2 font-medium text-right">Sati</th>
                    <th className="px-4 py-2 font-medium text-right">Satnica</th>
                    <th className="px-4 py-2 font-medium text-right">Za isplatu</th>
                  </tr>
                </thead>
                <tbody>
                  {week.workers.map((w) => (
                    <tr key={w.workerId} className="border-t border-[var(--line)]">
                      <td className="px-4 py-2.5 font-medium">{w.workerName}</td>
                      <td className="px-4 py-2.5 text-right">{formatHours(w.hours)}</td>
                      <td className="px-4 py-2.5 text-right text-[var(--muted)]">
                        {formatMoney(w.hourlyRate)}/h
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
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
            Detaljni unosi
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Pojedinačni zapisi (možete obrisati grešku).
          </p>
        </div>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Nedelja / datum</th>
              <th className="px-4 py-3 font-medium">Radnik</th>
              <th className="px-4 py-3 font-medium">Napomena</th>
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium">{formatWeekRange(weekStartISO(l.date))}</span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">
                      {formatDate(l.date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{l.workerName}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{l.note || "—"}</td>
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
