import { db } from "../db";
import { mergeSnapshots, readSnapshot, snapshotIsEmpty, writeSnapshot, type AppSnapshot } from "./snapshot";

export type CloudStatus = {
  lastSync: string | null;
  busy: boolean;
  error: string | null;
};

type CloudFile = { updatedAt: string; payload: AppSnapshot };

let status: CloudStatus = { lastSync: null, busy: false, error: null };
const listeners = new Set<(s: CloudStatus) => void>();
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPush = false;

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

export async function initCloudStatus() {
  const last = await db.settings.get("cloud_updated_at");
  setStatus({ lastSync: last?.value ?? null });
}

async function saveLastSync(updatedAt: string | null) {
  if (updatedAt) await db.settings.put({ key: "cloud_updated_at", value: updatedAt });
  else await db.settings.delete("cloud_updated_at");
  setStatus({ lastSync: updatedAt, error: null });
}

async function request(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  const data = (await res.json().catch(() => ({}))) as CloudFile & { error?: string };
  if (!res.ok && res.status !== 404 && res.status !== 409) {
    throw new Error(data.error || `Greška ${res.status}`);
  }
  return { res, data };
}

export async function pullCloud(): Promise<"empty" | "updated" | "same" | "merged" | "offline"> {
  setStatus({ busy: true, error: null });
  try {
    const { res, data } = await request("/api/sync");
    if (res.status === 404 || !data.payload) {
      setStatus({ busy: false });
      return "empty";
    }
    const localAt = status.lastSync;
    if (localAt && data.updatedAt <= localAt) {
      setStatus({ busy: false });
      return "same";
    }
    const local = await readSnapshot();
    if (!localAt && !snapshotIsEmpty(local) && !snapshotIsEmpty(data.payload)) {
      await writeSnapshot(mergeSnapshots(local, data.payload));
      await saveLastSync(data.updatedAt);
      setStatus({ busy: false });
      return "merged";
    }
    await writeSnapshot(data.payload);
    await saveLastSync(data.updatedAt);
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
  setStatus({ busy: true, error: null });
  try {
    const payload = await readSnapshot();
    const updatedAt = new Date().toISOString();
    const { res, data } = await request("/api/sync", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updatedAt, payload, force }),
    });
    if (res.status === 409 && data.payload && !force) {
      const local = await readSnapshot();
      await writeSnapshot(mergeSnapshots(local, data.payload));
      await saveLastSync(data.updatedAt);
      setStatus({ busy: false });
      pendingPush = true;
      schedulePush();
      return true;
    }
    if (!res.ok) throw new Error(data.error || "Slanje nije uspelo.");
    await saveLastSync(updatedAt);
    setStatus({ busy: false });
    return true;
  } catch (err) {
    pendingPush = true;
    setStatus({
      busy: false,
      error: err instanceof Error ? err.message : "Nema veze sa serverom.",
    });
    return false;
  }
}

export function schedulePush() {
  pendingPush = true;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pendingPush = false;
    void pushCloud();
  }, 800);
}

export async function syncNow(): Promise<"updated" | "same" | "empty" | "merged" | "offline"> {
  const pulled = await pullCloud();
  if (pulled === "offline") {
    if (pendingPush) void pushCloud();
    return pulled;
  }
  if (pulled === "updated") return pulled;
  await pushCloud(pulled === "empty" || pulled === "merged");
  return pulled;
}
