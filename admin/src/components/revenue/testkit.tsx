// MOB-1375: a console with a fake API for the page tests (see AdminFrame.test.tsx).

import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi, type Mock } from "vitest";
import { ApiError, type Api } from "@/lib/api";
import { ConsoleProvider, type Me } from "@/lib/console";

export const ALL = ["console.revenue.view", "console.revenue.export", "console.promotions.view", "console.promotions.update", "console.users.view"];

export function me(perms: string[] = ALL): Me {
  return { user: { id: 1, name: "Marta Ferri", email: "m.ferri@esempio.it" }, role: { id: 1, key: "super_admin", label: "Super amministratore" }, permissions: perms, two_factor: { confirmed: true, verified: true, recovery_left: 8 }, idle_minutes: 30 };
}

type Handler = (path: string, arg?: unknown) => unknown;

/** Each handler answers a path (a thrown value is thrown); unknown paths fail the test. */
export type FakeApi = { [K in keyof Api]: Api[K] & Mock };

export function fakeApi(h: { get?: Handler; post?: Handler; put?: Handler; del?: Handler; blob?: Handler }, perms: string[] = ALL): FakeApi {
  const wrap = (fn: Handler | undefined, name: string) =>
    vi.fn(async (path: string, arg?: unknown) => {
      if (name === "get" && path === "/me") return me(perms);
      if (!fn) throw new Error(`unexpected ${name} ${path}`);
      return fn(path, arg);
    });
  return { get: wrap(h.get, "get"), post: wrap(h.post, "post"), put: wrap(h.put, "put"), del: wrap(h.del, "del"), blob: wrap(h.blob, "blob") } as never;
}

export function invalid(errors: Record<string, string>): ApiError {
  return new ApiError(422, "invalid", { code: "invalid", errors });
}

export function withConsole(api: Api, ui: ReactNode) {
  return render(<ConsoleProvider api={api}>{ui}</ConsoleProvider>);
}
