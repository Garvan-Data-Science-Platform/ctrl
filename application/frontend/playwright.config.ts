import { defineConfig } from "@playwright/test";

// TODO: Get this from the common module, perhaps
const frontendPort = parseInt(process.env.FRONTEND_PORT ?? 3000);
const frontendHost = process.env.FRONTEND_HOST ?? "127.0.0.1";

const frontendUrl = `http://${frontendHost}:${frontendPort}`;

export default defineConfig({
  webServer: {
    command: "cd .. && yarn build && yarn start",
    url: frontendUrl,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
  use: {
    baseURL: frontendUrl,
  },
});
