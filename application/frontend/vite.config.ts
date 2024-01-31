import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// TODO: Move into common module, perhaps
const backendPort = parseInt(process.env.BACKEND_PORT ?? 5000);
const backendHost = process.env.BACKEND_HOST ?? "127.0.0.1";

const frontendPort = parseInt(process.env.FRONTEND_PORT ?? 3000);
const frontendHost = process.env.FRONTEND_HOST ?? "127.0.0.1";

export default defineConfig({
  plugins: [react()],
  server: {
    port: frontendPort,
    host: frontendHost,
  },
  preview: {
    port: frontendPort,
    host: frontendHost,
  },
  define: {
    __API_HOST__: JSON.stringify(backendHost),
    __API_PORT__: JSON.stringify(backendPort),
  },
});
