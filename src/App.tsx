import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppNav } from "./components/AppNav";
import { loadDashboardData, type DashboardData } from "./lib/data";
import { initCloudStatus, pullCloud, pushCloud, schedulePush } from "./lib/cloudSync";
import { initDatabase } from "./seed";
import { HomePage } from "./pages/HomePage";
import { ProjektiPage } from "./pages/ProjektiPage";
import { TroskoviPage } from "./pages/TroskoviPage";
import { RadniciPage } from "./pages/RadniciPage";

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);

  async function refresh() {
    setData(await loadDashboardData());
  }

  async function persistChange() {
    setData(await loadDashboardData());
    schedulePush();
  }

  useEffect(() => {
    void (async () => {
      await initDatabase();
      await initCloudStatus();
      const pulled = await pullCloud();
      if (pulled === "empty") await pushCloud(true);
      await refresh();
    })();
  }, []);

  useEffect(() => {
    async function syncIfNeeded() {
      const pulled = await pullCloud();
      if (pulled === "updated") await refresh();
      else if (pulled === "empty") await pushCloud(true);
    }
    function onVisible() {
      if (document.visibilityState === "visible") void syncIfNeeded();
    }
    window.addEventListener("online", syncIfNeeded);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", syncIfNeeded);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Učitavam FEROX konstrukcije…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 overflow-x-hidden px-3 py-3 pb-28 sm:px-6 sm:py-8">
        <Routes>
          <Route path="/" element={<HomePage data={data} onChange={persistChange} />} />
          <Route
            path="/projekti"
            element={<ProjektiPage data={data} onChange={persistChange} />}
          />
          <Route
            path="/troskovi"
            element={<TroskoviPage data={data} onChange={persistChange} />}
          />
          <Route
            path="/radnici"
            element={<RadniciPage data={data} onChange={persistChange} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="hidden border-t border-[var(--line)] py-4 pb-24 text-center text-xs text-[var(--muted)] lg:block">
        FEROX konstrukcije · radi i offline · uključi sinhronizaciju da deliš podatke između uređaja
      </footer>
    </div>
  );
}
