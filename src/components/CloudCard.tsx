import { useEffect, useState } from "react";
import { Check, Cloud, Copy, Link2, RefreshCw, Unplug } from "lucide-react";
import {
  disableCloud,
  enableCloud,
  getCloudStatus,
  joinCloud,
  pullCloud,
  pushCloud,
  subscribeCloud,
  type CloudStatus,
} from "../lib/cloudSync";
import { Button, Card, Input } from "./ui";

function formatSyncTime(iso: string | null): string {
  if (!iso) return "još nije poslato";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "još nije poslato";
  return d.toLocaleString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CloudCard({ onChange }: { onChange: () => Promise<void> }) {
  const [cloud, setCloud] = useState<CloudStatus>(getCloudStatus);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => subscribeCloud(setCloud), []);

  async function enable() {
    setMessage(null);
    try {
      const code = await enableCloud();
      setMessage({
        ok: true,
        text: `Sinhronizacija je uključena. Unesi šifru ${code} na drugim uređajima.`,
      });
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : "Uključivanje nije uspelo.",
      });
    }
  }

  async function join() {
    setMessage(null);
    try {
      const result = await joinCloud(joinCode);
      setJoinCode("");
      await onChange();
      setMessage({
        ok: true,
        text:
          result === "updated"
            ? "Podaci su preuzeti sa drugog uređaja."
            : "Povezano. Lokalni podaci su poslati online.",
      });
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : "Povezivanje nije uspelo.",
      });
    }
  }

  async function syncNow() {
    setMessage(null);
    const pulled = await pullCloud();
    if (pulled === "updated") {
      await onChange();
      setMessage({ ok: true, text: "Preuzeta je novija verzija sa servera." });
      return;
    }
    if (pulled === "empty") {
      const ok = await pushCloud(true);
      setMessage(
        ok
          ? { ok: true, text: "Online baza je bila prazna — poslati su lokalni podaci." }
          : { ok: false, text: cloud.error || "Slanje nije uspelo." },
      );
      return;
    }
    if (pulled === "offline") {
      setMessage({ ok: false, text: cloud.error || "Nema veze sa serverom." });
      return;
    }
    const ok = await pushCloud();
    setMessage(
      ok
        ? { ok: true, text: "Podaci su usklađeni." }
        : { ok: false, text: cloud.error || "Sinhronizacija nije uspela." },
    );
  }

  async function disable() {
    if (!confirm("Isključiti sinhronizaciju samo na ovom uređaju? Podaci ostaju online i na drugim uređajima.")) {
      return;
    }
    await disableCloud();
    setMessage({ ok: true, text: "Ovaj uređaj više nije povezan." });
  }

  async function copyCode() {
    if (!cloud.code) return;
    try {
      await navigator.clipboard.writeText(cloud.code);
    } catch {
      const input = document.createElement("input");
      input.value = cloud.code;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Card className="!p-3 sm:!p-4">
      <div className="flex items-start gap-2">
        <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
            Sinhronizacija
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Ista šifra na telefonu i računaru. Podaci se čuvaju online, a app i dalje radi offline.
          </p>
        </div>
      </div>

      {cloud.code ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
              Šifra radnog prostora
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="font-mono text-lg font-semibold tracking-wide">{cloud.code}</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => void copyCode()}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Kopirano" : "Kopiraj"}
              </Button>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Poslednja sinhronizacija: {formatSyncTime(cloud.lastSync)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={cloud.busy} onClick={() => void syncNow()}>
              <RefreshCw className="h-4 w-4" />
              {cloud.busy ? "Sinhronizujem…" : "Sinhronizuj sad"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-[var(--danger)]"
              disabled={cloud.busy}
              onClick={() => void disable()}
            >
              <Unplug className="h-4 w-4" />
              Isključi ovde
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <Button type="button" size="sm" disabled={cloud.busy} onClick={() => void enable()}>
            <Cloud className="h-4 w-4" />
            {cloud.busy ? "Radim…" : "Uključi sinhronizaciju"}
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ab12-cd34-ef56"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={cloud.busy || !joinCode.trim()}
              onClick={() => void join()}
            >
              <Link2 className="h-4 w-4" />
              Poveži uređaj
            </Button>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Ako već imaš šifru sa drugog uređaja, unesi je ovde. Ako nemaš — prvo uključi sinhronizaciju.
          </p>
        </div>
      )}

      {cloud.error && !message ? (
        <p className="mt-2 rounded-md bg-red-50 px-2.5 py-1.5 text-sm text-red-800">{cloud.error}</p>
      ) : null}
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
    </Card>
  );
}
