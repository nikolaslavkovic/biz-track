import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "FirmaRačun",
        short_name: "FirmaRačun",
        description:
          "Praćenje troškova, radnih sati i čeličnih hala — offline na telefonu",
        theme_color: "#0f766e",
        background_color: "#eef2f4",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
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
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 43127,
  },
  preview: {
    host: "0.0.0.0",
    port: 43127,
  },
});
