import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppNav } from "./components/AppNav";
import { loadDashboardData, type DashboardData } from "./lib/data";
import { seedIfEmpty } from "./seed";
import { HomePage } from "./pages/HomePage";
import { ProjektiPage } from "./pages/ProjektiPage";
import { TroskoviPage } from "./pages/TroskoviPage";
import { RadniciPage } from "./pages/RadniciPage";

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);

  async function refresh() {
    setData(await loadDashboardData());
  }

  useEffect(() => {
    void (async () => {
      await seedIfEmpty();
      await refresh();
    })();
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Učitavam FirmaRačun…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-8 md:pb-8">
        <Routes>
          <Route path="/" element={<HomePage data={data} />} />
          <Route
            path="/projekti"
            element={<ProjektiPage data={data} onChange={refresh} />}
          />
          <Route
            path="/troskovi"
            element={<TroskoviPage data={data} onChange={refresh} />}
          />
          <Route
            path="/radnici"
            element={<RadniciPage data={data} onChange={refresh} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer
        className="hidden border-t border-[var(--line)] py-4 text-center text-xs text-[var(--muted)] md:block"
      >
        FirmaRačun · podaci ostaju na ovom uređaju · radi offline
      </footer>
    </div>
  );
}
