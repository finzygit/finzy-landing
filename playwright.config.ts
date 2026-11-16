import { defineConfig } from "@playwright/test";

// Browser tests of the site (MOB-1447). They run the production build
// (`next build` + `next start`) on a free port, so `next dev` never rewrites
// AGENTS.md. E2E_BASE_URL points them at a server that is already running.
// Two engines: Chromium through an installed browser (PW_CHANNEL, "chrome" by
// default, so no Chromium download is needed on the Mac; PW_CHANNEL= empty
// uses Playwright's own Chromium) and WebKit, the engine of Safari on the
// iPhone (`pnpm exec playwright install webkit` once on a new machine).
const port = Number(process.env.E2E_PORT ?? 3147);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const channel = process.env.PW_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium", channel: channel || undefined } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm build && pnpm start -p ${port} -H 127.0.0.1`,
        url: baseURL,
        timeout: 300_000,
        reuseExistingServer: false,
      },
});
