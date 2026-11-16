// MOB-1378: shared set-up for the Report AI page tests: a console with a fake
// API (routes answered from a table; anything else fails the test) and a
// signed-in admin with «Report AI».

import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { ApiError, type Api, type Query } from "@/lib/api";
import { ConsoleProvider, type Me } from "@/lib/console";

export const REPORTS_ADMIN = ["console.home.view", "console.reports.view", "console.reports.export"];

export function me(perms: string[] = REPORTS_ADMIN, role = { id: 1, key: "super_admin", label: "Super amministratore" }): Me {
  return { user: { id: 7, name: "Marta Ferri", email: "m.ferri@esempio.it" }, role, permissions: perms, two_factor: { confirmed: true, verified: true, recovery_left: 8 }, idle_minutes: 30 };
}

type Handler = (query?: Query) => unknown;

/** A fake API: GET routes from `routes` ("/reports" or "/reports/3"); a value that is an ApiError is thrown. */
export function fakeApi(routes: Record<string, unknown | Handler>, who: Me = me(), blobs: Record<string, Blob | ApiError> = {}) {
  const get = vi.fn(async (path: string, query?: Query) => {
    if (path === "/me") return who;
    if (!(path in routes)) throw new Error(`unexpected GET ${path}`);
    const r = routes[path];
    const v = typeof r === "function" ? (r as Handler)(query) : r;
    if (v instanceof ApiError) throw v;
    return structuredClone(v);
  });
  const blob = vi.fn(async (path: string) => {
    const b = blobs[path];
    if (!b) throw new Error(`unexpected blob ${path}`);
    if (b instanceof ApiError) throw b;
    return b;
  });
  const fail = vi.fn(async (path: string) => {
    throw new Error(`no write expected from the Report AI pages: ${path}`);
  });
  const api: Api = { get: get as Api["get"], post: fail as Api["post"], put: fail as Api["put"], del: vi.fn(async (path: string) => (path === "/session" ? null : fail(path))) as Api["del"], blob: blob as Api["blob"] };
  return { api, get, blob, writes: fail };
}

export function renderPage(node: ReactNode, api: Api) {
  return render(<ConsoleProvider api={api}>{node}</ConsoleProvider>);
}
