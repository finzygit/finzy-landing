// MOB-1376: shared set-up of the News page tests (imported by tests only):
// a signed-in console user with the News permissions and a fake API whose
// answers each test gives by path.

import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import type { Api } from "@/lib/api";
import { ConsoleProvider, type Me } from "@/lib/console";

export const EDITOR = ["console.news.view", "console.news.update"];
export const READER = ["console.news.view"];

export function me(perms: string[]): Me {
  return { user: { id: 7, name: "Marta Ferri", email: "m.ferri@esempio.it" }, role: { id: 4, key: "Redazione", label: "Redazione" }, permissions: perms, two_factor: { confirmed: true, verified: true, recovery_left: 8 }, idle_minutes: 30 };
}

type Handler = (path: string, body?: unknown, query?: Record<string, unknown>) => unknown;

/** A fake API: GET /me answers the user; any other call goes to `on` (throw to fail it). */
export function fakeApi(perms: string[], on: Handler) {
  const call = (path: string, body?: unknown, query?: Record<string, unknown>) => {
    if (path === "/me") return Promise.resolve(me(perms));
    try {
      return Promise.resolve(on(path, body, query));
    } catch (e) {
      return Promise.reject(e);
    }
  };
  const api = {
    get: vi.fn((path: string, query?: Record<string, unknown>) => call(path, undefined, query)),
    post: vi.fn((path: string, body?: unknown) => call(`POST ${path}`, body)),
    put: vi.fn((path: string, body?: unknown) => call(`PUT ${path}`, body)),
    del: vi.fn((path: string) => call(`DELETE ${path}`)),
    blob: vi.fn(),
  };
  return api as unknown as Api & { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; del: ReturnType<typeof vi.fn> };
}

export function renderPage(node: ReactNode, api: Api) {
  return render(<ConsoleProvider api={api}>{node}</ConsoleProvider>);
}
