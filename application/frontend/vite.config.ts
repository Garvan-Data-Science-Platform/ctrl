import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TODO: move into common
const frontendPort = parseInt(process.env.FRONTEND_PORT ?? 3000);
const frontendHost = process.env.FRONTEND_HOST ?? '127.0.0.1';

export default defineConfig({
  plugins: [ react()],
  server: {
    port: frontendPort,
    host: frontendHost,
  },
  preview: {
    port: frontendPort,
    host: frontendHost,
  },
})
