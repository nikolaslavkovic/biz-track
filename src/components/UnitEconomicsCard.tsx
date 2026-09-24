import { Card } from "./ui";
import type { UnitEconomics } from "../lib/insights";
import { cn, formatMoney } from "../lib/utils";

function dinars(value: number): string {
  return `${Math.round(value).toLocaleString("sr-RS")} RSD`;
}

function SplitBar({
  radnici,
  ostalo,
  neto,
}: {
  radnici: number;
  ostalo: number;
  neto: number;
}) {
  const labor = Math.max(0, radnici);
  const other = Math.max(0, ostalo);
  const keep = Math.max(0, neto);
  const sum = labor + other + keep;
  if (!sum) return null;
  return (
    <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
      {labor > 0 ? (
        <div className="h-full bg-rose-500" style={{ width: `${(labor / sum) * 100}%` }} />
      ) : null}
      {other > 0 ? (
        <div className="h-full bg-slate-400" style={{ width: `${(other / sum) * 100}%` }} />
      ) : null}
      {keep > 0 ? (
        <div className="h-full bg-emerald-600" style={{ width: `${(keep / sum) * 100}%` }} />
      ) : null}
    </div>
  );
}

function Row({
  color,
  label,
  value,
  hint,
  tone,
}: {
  color: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", color)} />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-right">
        <span
          className={cn(
            "font-[family-name:var(--font-display)] text-sm font-semibold tabular-nums",
            tone === "good" && "text-[var(--good)]",
            tone === "bad" && "text-[var(--danger)]",
          )}
        >
          {value}
        </span>
        {hint ? <span className="ml-1 text-[10px] text-[var(--muted)]">{hint}</span> : null}
      </span>
    </div>
  );
}

export function UnitEconomicsCard({
  unit,
  hint,
}: {
  unit: UnitEconomics;
  hint?: string;
}) {
  if (!unit.per100 && !unit.perHour) return null;

  return (
    <Card className="!p-3 sm:!p-4">
      <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
        Od svakog dinara
      </h2>
      <p className="mt-0.5 text-xs text-[var(--muted)]">
        {hint ?? "Koliko od prodaje ide radnicima, koliko ostalim troškovima, koliko ostane tebi."}
      </p>

      {unit.per100 ? (
        <div className="mt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
            Na 100 RSD prodaje
          </p>
          <SplitBar
            radnici={unit.per100.radnici}
            ostalo={unit.per100.ostalo}
            neto={unit.per100.neto}
          />
          <div className="mt-2 space-y-1">
            <Row
              color="bg-rose-500"
              label="Radnici"
              value={dinars(unit.per100.radnici)}
            />
            <Row
              color="bg-slate-400"
              label="Ostali troškovi"
              value={dinars(unit.per100.ostalo)}
            />
            <Row
              color="bg-emerald-600"
              label="Tebi ostane"
              value={dinars(unit.per100.neto)}
              tone={unit.per100.neto >= 0 ? "good" : "bad"}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">Nema prodaje u ovom periodu.</p>
      )}

      {unit.perHour ? (
        <div className="mt-3 border-t border-[var(--line)] pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
            Po satu rada
          </p>
          <p className="mb-2 text-[10px] text-[var(--muted)]">
            Na osnovu {unit.perHour.hours.toLocaleString("sr-RS", { maximumFractionDigits: 1 })} unetih sati
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Plaćaš radnike</p>
              <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-rose-700">
                {formatMoney(unit.perHour.radnici)}
                <span className="text-[10px] font-medium text-[var(--muted)]"> /h</span>
              </p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Ti zaradiš</p>
              <p
                className={cn(
                  "font-[family-name:var(--font-display)] text-sm font-semibold",
                  unit.perHour.neto >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]",
                )}
              >
                {formatMoney(unit.perHour.neto)}
                <span className="text-[10px] font-medium text-[var(--muted)]"> /h</span>
              </p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Prodaja</p>
              <p className="font-[family-name:var(--font-display)] text-sm font-semibold">
                {formatMoney(unit.perHour.prodaja)}
                <span className="text-[10px] font-medium text-[var(--muted)]"> /h</span>
              </p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Ostali troškovi</p>
              <p className="font-[family-name:var(--font-display)] text-sm font-semibold">
                {formatMoney(unit.perHour.ostalo)}
                <span className="text-[10px] font-medium text-[var(--muted)]"> /h</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-[var(--muted)]">
          Unesi sate na Radnici da vidiš koliko zaradiš po satu.
        </p>
      )}
    </Card>
  );
}
