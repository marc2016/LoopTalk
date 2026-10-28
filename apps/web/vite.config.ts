import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const backend = process.env.BACKEND_URL ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  server: {
    port: 5173,
    // Im Docker-Container erreichen Dateiänderungen vom Host Vite nicht zuverlässig als Events.
    watch: process.env.VITE_POLLING ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      "/api": { target: backend },
      "/auth": { target: backend },
      "/healthz": { target: backend },
    },
  },
});
