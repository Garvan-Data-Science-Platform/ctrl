import { defineConfig } from '@playwright/test';


const frontendPort = parseInt(process.env.FRONTEND_PORT ?? 3000);
const frontendHost = process.env.FRONTEND_HOST ?? '127.0.0.1';

const frontendUrl = `http://${frontendHost}:${frontendPort}`;

export default defineConfig({
  // Run your local dev server before starting the tests
  webServer: {
    command: 'cd .. && yarn dev',
    url: frontendUrl,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  use: {
    baseURL: frontendUrl,
  },
});
