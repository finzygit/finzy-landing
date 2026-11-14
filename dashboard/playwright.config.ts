import { defineConfig, devices } from "@playwright/test";

// MOB-1198: layout checks and screenshots of the built dashboard (out/),
// with every /api call mocked. Run `pnpm build` first. Uses the Chromium
// that Playwright 1.63 already has in its cache: nothing is installed.
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  workers: 2,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3199", ...devices["Desktop Chrome"], colorScheme: "dark", locale: "it-IT", timezoneId: "Europe/Rome" },
  webServer: { command: "node e2e/serve.mjs", port: 3199, reuseExistingServer: true },
});
