import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// HashRouter radi na GitHub Pages bez posebnog servera (URL: .../#/projekti)
void import("virtual:pwa-register").then(({ registerSW }) => {
  registerSW({ immediate: true });
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
