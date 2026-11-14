import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// MOB-1198: unit and component tests of the dashboard. jsdom for the
// components; fetch is always mocked (no call to staging or production).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
  },
});
