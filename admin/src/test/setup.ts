import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// No test may reach the network: a fetch that a test did not mock fails.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      throw new Error(`Unmocked fetch in a test: ${String(input)}`);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  try {
    window.localStorage.clear();
  } catch {
    // storage blocked: nothing to clear
  }
});
