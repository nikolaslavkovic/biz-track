import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

/** GitHub Pages: /ime-repozitorijuma/  | lokalno ili custom domain: / */
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon-64.png", "apple-touch-icon.png", "logo.png"],
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: "FEROX konstrukcije",
        short_name: "FEROX",
        description:
          "Praćenje troškova, radnih sati i čeličnih hala — radi u browseru i offline",
        theme_color: "#0f766e",
        background_color: "#eef2f4",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        lang: "sr",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 43127,
    headers: {
      "Cache-Control": "no-store",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 43127,
    headers: {
      "Cache-Control": "no-store",
    },
  },
});