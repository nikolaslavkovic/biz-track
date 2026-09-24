import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

async function purgeServiceWorkersAndCaches() {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

if (import.meta.env.DEV) {
  // Dev: nikad ne registruj SW — i obriši eventualni stari iz production preview-a
  void purgeServiceWorkersAndCaches();
} else {
  // Production: nova verzija se automatski aktivira i osvežava stranicu
  void import("virtual:pwa-register").then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        void updateSW(true);
        window.location.reload();
      },
      onOfflineReady() {
        /* ok */
      },
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
