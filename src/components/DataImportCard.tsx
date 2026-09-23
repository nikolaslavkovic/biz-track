import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { db, type Income } from "../db";
import { importFeroxJson, removeImportedData } from "../lib/importFerox";
import { formatDate, formatMoney, sourceAmountLabel } from "../lib/utils";
import { Button, Card } from "./ui";

const INCOME_LABEL: Record<Income["category"], string> = {
  prodaja: "Prodaja konstrukcija",
  avans: "Avans",
  ostalo: "Ostali prihod",
};

const PAGE = 30;

export function DataImportCard({
  incomes,
  onChange,
}: {
  incomes: Income[];
  onChange: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [shown, setShown] = useState(PAGE);
  const hasImported = incomes.some((i) => i.importKey);

  async function onFile(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const r = await importFeroxJson(await file.text());
      await onChange();
      setMessage({
        ok: true,
        text:
          r.expenses || r.incomes
            ? `Uvezeno: ${r.expenses} troškova i ${r.incomes} prihoda.${r.skipped ? ` Preskočeno ${r.skipped} već uvezenih.` : ""}`
            : `Nema novih stavki — svih ${r.skipped} je već uvezeno.`,
      });
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

  async function removeImported() {
    if (!confirm("Obrisati SVE uvezene troškove i prihode iz fajla? Ručno uneti podaci ostaju.")) return;
    setBusy(true);
    try {
      const n = await removeImportedData();
      await onChange();
      setMessage({ ok: true, text: `Obrisano ${n} uvezenih stavki.` });
    } finally {
      setBusy(false);
    }
  }

  async function removeIncome(id: number) {
    if (!confirm("Obrisati ovaj prihod?")) return;
    await db.incomes.delete(id);
    await onChange();
  }

  return (
    <Card className="!p-3 sm:!p-4">
      <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
        Podaci
      </h2>
      <p className="mt-0.5 mb-3 text-xs text-[var(--muted)]">
        Uvoz iz MoneyManager JSON fajla. Isti fajl može da se uveze ponovo — duplikati se preskaču.
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
          {busy ? "Uvozim…" : "Uvezi podatke (.json)"}
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

      {incomes.length ? (
        <details className="mt-3 border-t border-[var(--line)] pt-2">
          <summary className="cursor-pointer text-sm font-medium">
            Prihodi i uplate ({incomes.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {incomes.slice(0, shown).map((i) => (
              <li
                key={i.id}
                className="flex items-center gap-2 rounded-md border border-[var(--line)] px-2.5 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {i.description || i.subcategory || INCOME_LABEL[i.category]}
                  </p>
                  <p className="truncate text-[11px] text-[var(--muted)]">
                    {formatDate(i.date)} · {i.subcategory || INCOME_LABEL[i.category]}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-[var(--good)]">
                    {formatMoney(i.amount)}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    {sourceAmountLabel(i)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeIncome(i.id!)}
                  className="shrink-0 text-[11px] font-medium text-[var(--danger)]"
                >
                  Obriši
                </button>
              </li>
            ))}
          </ul>
          {shown < incomes.length ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-2 w-full"
              onClick={() => setShown((n) => n + PAGE)}
            >
              Prikaži još ({incomes.length - shown})
            </Button>
          ) : null}
        </details>
      ) : null}
    </Card>
  );
}
