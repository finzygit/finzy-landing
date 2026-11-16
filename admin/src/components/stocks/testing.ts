// MOB-1377: a fake console API and fixtures for the Titoli tests (fetch stays mocked by src/test/setup.ts).
import { vi } from "vitest";
import { ApiError, type Api } from "@/lib/api";
import type { Me } from "@/lib/console";
import type { StockListPage, StockPage, StockRow } from "@/lib/stocks";

export const VIEW = ["console.stocks.view"];
export const EDIT = ["console.stocks.view", "console.stocks.update"];

export function me(perms: string[]): Me {
  return { user: { id: 3, name: "Marta Ferri", email: "m.ferri@esempio.it" }, role: { id: 2, key: "Dati", label: "Dati" }, permissions: perms, two_factor: { confirmed: true, verified: true, recovery_left: 8 }, idle_minutes: 30 };
}

export function row(over: Partial<StockRow> = {}): StockRow {
  return {
    id: 1, symbol: "NVDA", name: "Nvidia Corp", common_name: "Nvidia", type: "stock", mic: "XNAS", area: "USA", country: "US", price: 221.3, change: -3.16,
    price_state: "fresh", price_at: "2026-11-14T21:05:00+00:00", price_day_only: false, not_found_at: null, market_cap: 4e12, hidden: false, secondary: false,
    logo_url: null, reports: { snapshots: 2, ten_k: true, universe: true }, ...over,
  };
}

export function list(rows: StockRow[], over: Partial<StockListPage> = {}): StockListPage {
  return { rows, total: rows.length, page: 1, per_page: 50, summary: { all: 32620, stale: 2972, never: 412, last_quote_at: null }, ...over };
}

export function page(over: Partial<StockPage> = {}): StockPage {
  return {
    ...row(),
    name: "NVIDIA Corporation", common_name: "Nvidia", common_name_source: "manual", common_name_locked: true, alternatives: ["NVDA.US"], cik: "0001045810",
    sector: "Technology", price_source: "twelvedata", last_row_on: "2026-11-13", exchange_dropped: false,
    sync: { history_checked_at: null, history_not_found_at: null, fundamentals_checked_at: null, ten_k_checked_at: null },
    universe: { in: true, day: "2026-11-14" }, logo: { provider_url: null, uploaded_url: null }, banner: { url: null },
    counts: { documents: 1, reports: 4, news: 38 },
    activity: [{ id: 9, at: "2026-11-12T09:20:00+00:00", who: "Marta Ferri", event: "stocks.stock.update", kind: "update", summary: "NVDA · Nome comune: «NVIDIA» → «Nvidia», bloccato" }],
    ...over,
  };
}

/** routes: path → value, or a function of (path, query/body). An Error value is thrown. */
export function fakeApi(perms: string[], routes: Record<string, unknown>): Api & { calls: { method: string; path: string; arg: unknown }[] } {
  const calls: { method: string; path: string; arg: unknown }[] = [];
  const answer = async (method: string, path: string, arg?: unknown) => {
    calls.push({ method, path, arg });
    if (path === "/me") return me(perms);
    const key = `${method} ${path}`;
    const hit = key in routes ? routes[key] : routes[path];
    if (hit === undefined) throw new ApiError(404, "not_found");
    const v = typeof hit === "function" ? (hit as (a: unknown) => unknown)(arg) : hit;
    if (v instanceof Error) throw v;
    return v;
  };
  return {
    calls,
    get: vi.fn((p: string, q?: unknown) => answer("GET", p, q)) as Api["get"],
    post: vi.fn((p: string, b?: unknown) => answer("POST", p, b)) as Api["post"],
    put: vi.fn((p: string, b?: unknown) => answer("PUT", p, b)) as Api["put"],
    del: vi.fn((p: string) => answer("DELETE", p)) as Api["del"],
    blob: vi.fn() as Api["blob"],
  };
}
