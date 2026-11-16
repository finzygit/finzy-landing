// MOB-1380: test helpers for the «Contenuti app» pages: a fake console API
// answering per "METHOD /path", a signed-in admin with the given permissions,
// and the page rendered inside the shell's ConsoleProvider.
// Each test file mocks next/navigation itself (vi.mock is hoisted per file).

import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { ApiError, type Api } from "@/lib/api";
import { ConsoleProvider, type Me } from "@/lib/console";

export const EDITOR = ["console.content.view", "console.content.update"];
export const READER = ["console.content.view"];

export function me(perms: string[]): Me {
  return { user: { id: 7, name: "Marta Ferri", email: "m.ferri@esempio.it" }, role: { id: 2, key: "Contenuti", label: "Contenuti" }, permissions: perms, two_factor: { confirmed: true, verified: true, recovery_left: 8 }, idle_minutes: 30 };
}

type Handler = (body: unknown, query?: unknown) => unknown;
export type Routes = Record<string, unknown | Handler>;

/** A fake Api: routes["GET /lessons"] is a value or a function of the body; an Error value is thrown; a missing route throws. */
export function fakeApi(perms: string[], routes: Routes) {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  const answer = async (method: string, path: string, body?: unknown, query?: unknown) => {
    calls.push({ method, path, body: body ?? query });
    if (method === "GET" && path === "/me") return me(perms);
    const key = `${method} ${path}`;
    if (!(key in routes)) throw new Error(`unexpected ${key}`);
    const r = routes[key];
    const v = typeof r === "function" ? (r as Handler)(body, query) : r;
    if (v instanceof Error) throw v;
    return structuredClone(v);
  };
  const api: Api = {
    get: vi.fn((p: string, q?: unknown) => answer("GET", p, undefined, q)) as Api["get"],
    post: vi.fn((p: string, b?: unknown) => answer("POST", p, b)) as Api["post"],
    put: vi.fn((p: string, b?: unknown) => answer("PUT", p, b)) as Api["put"],
    del: vi.fn((p: string) => answer("DELETE", p)) as Api["del"],
    blob: vi.fn() as Api["blob"],
  };
  return { api, calls, writes: () => calls.filter((c) => c.method !== "GET") };
}

export const notFound = () => new ApiError(404, null);
export const serverError = () => new ApiError(500, null);

export function renderPage(ui: ReactElement, api: Api) {
  return render(<ConsoleProvider api={api}>{ui}</ConsoleProvider>);
}
