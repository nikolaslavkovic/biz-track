import { db } from "../db";
import { readSnapshot, snapshotIsEmpty, writeSnapshot, type AppSnapshot } from "./snapshot";

const CODE_RE = /^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;

export type CloudStatus = {
  code: string | null;
  lastSync: string | null;
  busy: boolean;
  error: string | null;
};

type CloudFile = { updatedAt: string; payload: AppSnapshot };

let status: CloudStatus = { code: null, lastSync: null, busy: false, error: null };
const listeners = new Set<(s: CloudStatus) => void>();
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  const snap = { ...status };
  listeners.forEach((fn) => fn(snap));
}

function setStatus(patch: Partial<CloudStatus>) {
  status = { ...status, ...patch };
  emit();
}

export function subscribeCloud(fn: (s: CloudStatus) => void) {
  listeners.add(fn);
  fn({ ...status });
  return () => {
    listeners.delete(fn);
  };
}

export function getCloudStatus() {
  return { ...status };
}

export function generateCloudCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

export function normalizeCloudCode(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

async function loadLocalLink() {
  const [code, last] = await Promise.all([
    db.settings.get("cloud_code"),
    db.settings.get("cloud_updated_at"),
  ]);
  setStatus({
    code: code?.value && CODE_RE.test(code.value) ? code.value : null,
    lastSync: last?.value ?? null,
  });
}

export async function initCloudStatus() {
  await loadLocalLink();
}

async function saveLink(code: string | null, updatedAt: string | null) {
  if (code) await db.settings.put({ key: "cloud_code", value: code });
  else await db.settings.delete("cloud_code");
  if (updatedAt) await db.settings.put({ key: "cloud_updated_at", value: updatedAt });
  else await db.settings.delete("cloud_updated_at");
  setStatus({ code, lastSync: updatedAt, error: null });
}

async function request(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  const data = (await res.json().catch(() => ({}))) as CloudFile & { error?: string };
  if (!res.ok && res.status !== 404 && res.status !== 409) {
    throw new Error(data.error || `Greška ${res.status}`);
  }
  return { res, data };
}

export async function pullCloud(): Promise<"empty" | "updated" | "same" | "offline"> {
  if (!status.code) return "offline";
  setStatus({ busy: true, error: null });
  try {
    const { res, data } = await request(`/api/sync?code=${encodeURIComponent(status.code)}`);
    if (res.status === 404) {
      setStatus({ busy: false });
      return "empty";
    }
    if (!res.ok || !data.payload) throw new Error(data.error || "Preuzimanje nije uspelo.");
    const localAt = status.lastSync;
    if (localAt && data.updatedAt <= localAt) {
      setStatus({ busy: false });
      return "same";
    }
    await writeSnapshot(data.payload);
    await saveLink(status.code, data.updatedAt);
    setStatus({ busy: false });
    return "updated";
  } catch (err) {
    setStatus({
      busy: false,
      error: err instanceof Error ? err.message : "Nema veze sa serverom.",
    });
    return "offline";
  }
}

export async function pushCloud(force = false): Promise<boolean> {
  if (!status.code) return false;
  setStatus({ busy: true, error: null });
  try {
    const payload = await readSnapshot();
    const updatedAt = new Date().toISOString();
    const { res, data } = await request("/api/sync", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: status.code, updatedAt, payload }),
    });
    if (res.status === 409 && data.payload && !force) {
      await writeSnapshot(data.payload);
      await saveLink(status.code, data.updatedAt);
      setStatus({ busy: false });
      return true;
    }
    if (!res.ok) throw new Error(data.error || "Slanje nije uspelo.");
    await saveLink(status.code, updatedAt);
    setStatus({ busy: false });
    return true;
  } catch (err) {
    setStatus({
      busy: false,
      error: err instanceof Error ? err.message : "Nema veze sa serverom.",
    });
    return false;
  }
}

export function schedulePush() {
  if (!status.code) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushCloud();
  }, 1200);
}

export async function enableCloud(): Promise<string> {
  const code = generateCloudCode();
  await saveLink(code, null);
  const snapshot = await readSnapshot();
  if (!snapshotIsEmpty(snapshot)) await pushCloud(true);
  return code;
}

export async function joinCloud(raw: string): Promise<"updated" | "empty"> {
  const code = normalizeCloudCode(raw);
  if (!CODE_RE.test(code)) throw new Error("Šifra mora biti u obliku ab12-cd34-ef56.");
  await saveLink(code, null);
  const result = await pullCloud();
  if (result === "empty") {
    const snapshot = await readSnapshot();
    if (!snapshotIsEmpty(snapshot)) await pushCloud(true);
    return "empty";
  }
  if (result === "offline") throw new Error(status.error || "Nema veze.");
  return "updated";
}

export async function disableCloud() {
  if (pushTimer) clearTimeout(pushTimer);
  await saveLink(null, null);
}
