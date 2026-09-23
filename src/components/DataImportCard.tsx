import { useRef, useState } from "react";
import { CheckCircle2, Download, Upload, XCircle } from "lucide-react";
import {
  buildExport,
  importMoneyManagerJson,
  removeImportedData,
  type ImportResult,
} from "../lib/moneyManager";
import { cn } from "../lib/utils";

const exact = (value: number) =>
  `${value.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`;
import { Button, Card } from "./ui";

function VerificationTable({ result }: { result: ImportResult }) {
  const v = result.verification;
  return (
    <div
      className={cn(
        "mt-3 rounded-lg border p-2.5",
        v.ok ? "border-emerald-200 bg-emerald-50/70" : "border-red-200 bg-red-50/70",
      )}
    >
      <p
        className={cn(
          "mb-2 flex items-center gap-1.5 text-sm font-semibold",
          v.ok ? "text-emerald-800" : "text-red-800",
        )}
      >
        {v.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {v.ok ? "Provera: svi podaci su tačni" : "Provera: pronađene razlike"}
      </p>
      <table className="w-full text-xs">
        <thead className="text-[10px] uppercase text-[var(--muted)]">
          <tr>
            <th className="pb-1 text-left font-medium" />
            <th className="pb-1 text-right font-medium">U fajlu</th>
            <th className="pb-1 text-right font-medium">U aplikaciji</th>
            <th className="w-5" />
          </tr>
        </thead>
        <tbody>
          {v.rows.map((r) => (
            <tr key={r.label} className="border-t border-black/5">
              <td className="py-1 font-medium">{r.label}</td>
              <td className="py-1 text-right tabular-nums">
                {r.money ? exact(r.file) : r.file}
              </td>
              <td className="py-1 text-right tabular-nums">
                {r.money ? exact(r.app) : r.app}
              </td>
              <td className="py-1 text-right">{r.ok ? "✓" : "✗"}</td>
            </tr>
          ))}
          <tr className="border-t border-black/5">
            <td className="py-1 font-medium">Meseci</td>
            <td className="py-1 text-right tabular-nums" colSpan={2}>
              {v.monthsOk} / {v.monthsChecked} isti
            </td>
            <td className="py-1 text-right">{v.monthsOk === v.monthsChecked ? "✓" : "✗"}</td>
          </tr>
          <tr className="border-t border-black/5">
            <td className="py-1 font-medium">Kategorije</td>
            <td className="py-1 text-right tabular-nums" colSpan={2}>
              {v.groupsOk} / {v.groupsChecked} iste
            </td>
            <td className="py-1 text-right">{v.groupsOk === v.groupsChecked ? "✓" : "✗"}</td>
          </tr>
          {v.fileTotalsOk != null ? (
            <tr className="border-t border-black/5">
              <td className="py-1 font-medium" colSpan={3}>
                Zbirovi upisani u fajl odgovaraju transakcijama
              </td>
              <td className="py-1 text-right">{v.fileTotalsOk ? "✓" : "✗"}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {v.mismatches.length ? (
        <p className="mt-2 text-xs text-red-800">Razlike: {v.mismatches.slice(0, 8).join(", ")}</p>
      ) : null}
    </div>
  );
}

export function DataImportCard({
  hasImported,
  onChange,
}: {
  hasImported: boolean;
  onChange: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onFile(file: File) {
    setBusy(true);
    setMessage(null);
    setResult(null);
    try {
      const r = await importMoneyManagerJson(await file.text());
      await onChange();
      const parts = [
        r.expenses || r.incomes
          ? `Uvezeno: ${r.expenses} troškova i ${r.incomes} prihoda.`
          : "Nema novih stavki.",
      ];
      if (r.skipped) parts.push(`Preskočeno ${r.skipped} već uvezenih.`);
      if (r.replacedLegacy) parts.push(`Zamenjeno ${r.replacedLegacy} stavki iz ranijeg uvoza.`);
      if (r.restored && r.restored.projects + r.restored.workers + r.restored.workLogs > 0) {
        parts.push(
          `Vraćeno: ${r.restored.projects} hala, ${r.restored.workers} radnika, ${r.restored.workLogs} unosa sati.`,
        );
      }
      if (r.restoreSkipped) {
        parts.push("Hale i radnici iz fajla nisu vraćeni jer ih već imaš u aplikaciji.");
      }
      setMessage({ ok: true, text: parts.join(" ") });
      setResult(r);
    } catch (err) {
      console.error(err);
      setMessage({
        ok: false,
        text: `Uvoz nije uspeo: ${err instanceof Error ? err.message : "neispravan fajl"}`,
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function exportFile() {
    setBusy(true);
    try {
      const { json, filename, count } = await buildExport();
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage({ ok: true, text: `Izvezeno ${count} transakcija u ${filename}.` });
    } finally {
      setBusy(false);
    }
  }

  async function removeImported() {
    if (!confirm("Obrisati SVE uvezene troškove i prihode iz fajla? Ručno uneti podaci ostaju.")) return;
    setBusy(true);
    try {
      const n = await removeImportedData();
      await onChange();
      setResult(null);
      setMessage({ ok: true, text: `Obrisano ${n} uvezenih stavki.` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="!p-3 sm:!p-4">
      <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
        Uvoz i izvoz podataka
      </h2>
      <p className="mt-0.5 mb-3 text-xs text-[var(--muted)]">
        Isti format kao MoneyManager fajl. Izvoz sadrži sve troškove i prihode, plus hale, radnike i
        sate — služi i kao rezervna kopija. Ponovni uvoz istog fajla ne pravi duplikate.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" />
          {busy ? "Radim…" : "Uvezi (.json)"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void exportFile()}
        >
          <Download className="h-4 w-4" />
          Izvezi (.json)
        </Button>
        {hasImported ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-[var(--danger)]"
            disabled={busy}
            onClick={() => void removeImported()}
          >
            Obriši uvezene
          </Button>
        ) : null}
      </div>

      {message ? (
        <p
          className={
            message.ok
              ? "mt-2 rounded-md bg-teal-50 px-2.5 py-1.5 text-sm text-teal-900"
              : "mt-2 rounded-md bg-red-50 px-2.5 py-1.5 text-sm text-red-800"
          }
        >
          {message.text}
        </p>
      ) : null}

      {result ? <VerificationTable result={result} /> : null}
    </Card>
  );
}
