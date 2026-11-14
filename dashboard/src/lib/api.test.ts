// MOB-1198 (FZW-WEB-01): the dashboard's API client. Same origin, cookies
// only (credentials 'same-origin'), the CSRF header on every state-changing
// call and on /api/web/*, one refresh on a 401, the Unlimited page on a 402.
// fetch is mocked: no call ever leaves the test.
import { describe, expect, it, vi } from "vitest";
import { ApiError, createApi } from "./api.ts";

type Call = { url: string; init: RequestInit };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function mockFetch(answer: (url: string, init: RequestInit, n: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    return answer(url, init, calls.length);
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

function header(init: RequestInit, name: string): string | null {
  return new Headers(init.headers).get(name);
}

describe("requests", () => {
  it("sends cookies of the same origin and unwraps the envelope", async () => {
    const { fn, calls } = mockFetch(() => json(200, { success: true, data: [{ symbol: "NVDA" }], message: "ok" }));
    const api = createApi({ fetch: fn });
    const data = await api.get<{ symbol: string }[]>("/dashboard/search", { q: "nvi dia" });
    expect(data).toEqual([{ symbol: "NVDA" }]);
    expect(calls[0].url).toBe("/api/dashboard/search?q=nvi+dia");
    expect(calls[0].init.credentials).toBe("same-origin");
  });

  it("adds X-Finzy-Web on POST and DELETE, not on a plain GET", async () => {
    const { fn, calls } = mockFetch(() => json(200, { success: true, data: null }));
    const api = createApi({ fetch: fn });
    await api.get("/watch-aziones");
    await api.post("/watch-aziones", { azione_id: 7 });
    await api.del("/watch-aziones/7");
    expect(header(calls[0].init, "X-Finzy-Web")).toBeNull();
    expect(header(calls[1].init, "X-Finzy-Web")).toBe("1");
    expect(header(calls[1].init, "Content-Type")).toBe("application/json");
    expect(calls[1].init.body).toBe(JSON.stringify({ azione_id: 7 }));
    expect(calls[2].init.method).toBe("DELETE");
    expect(header(calls[2].init, "X-Finzy-Web")).toBe("1");
  });

  it("adds X-Finzy-Web on every /api/web/* call, GET me included", async () => {
    const { fn, calls } = mockFetch(() => json(200, { success: true, data: { id: 1 } }));
    const api = createApi({ fetch: fn });
    await api.get("/web/me");
    expect(header(calls[0].init, "X-Finzy-Web")).toBe("1");
  });

  it("throws an ApiError with the status on other failures, calling no handler", async () => {
    const onSignedOut = vi.fn();
    const onUnlimitedRequired = vi.fn();
    const { fn } = mockFetch(() => json(404, { success: false, message: "Stock not in the dashboard." }));
    const api = createApi({ fetch: fn, onSignedOut, onUnlimitedRequired });
    const err = (await api.get("/dashboard/stocks/ZZZ").catch((e: ApiError) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(onSignedOut).not.toHaveBeenCalled();
    expect(onUnlimitedRequired).not.toHaveBeenCalled();
  });

  it("turns a network failure into an ApiError with status 0", async () => {
    const { fn } = mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    const api = createApi({ fetch: fn });
    const err = (await api.get("/dashboard/search").catch((e: ApiError) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });
});

describe("401: refresh once", () => {
  it("refreshes the web session and repeats the call", async () => {
    let refreshed = false;
    const { fn, calls } = mockFetch((url) => {
      if (url === "/api/web/refresh") {
        refreshed = true;
        return json(200, { success: true });
      }
      return refreshed ? json(200, { success: true, data: { ok: 1 } }) : json(401, { success: false });
    });
    const onSignedOut = vi.fn();
    const api = createApi({ fetch: fn, onSignedOut });
    await expect(api.get("/dashboard/stocks/NVDA")).resolves.toEqual({ ok: 1 });
    expect(calls.map((c) => c.url)).toEqual(["/api/dashboard/stocks/NVDA", "/api/web/refresh", "/api/dashboard/stocks/NVDA"]);
    expect(calls[1].init.method).toBe("POST");
    expect(header(calls[1].init, "X-Finzy-Web")).toBe("1");
    expect(onSignedOut).not.toHaveBeenCalled();
  });

  it("signs out when the refresh is refused", async () => {
    const { fn, calls } = mockFetch(() => json(401, { success: false }));
    const onSignedOut = vi.fn();
    const api = createApi({ fetch: fn, onSignedOut });
    const err = (await api.get("/watch-aziones").catch((e: ApiError) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
    expect(onSignedOut).toHaveBeenCalledTimes(1);
    expect(calls.map((c) => c.url)).toEqual(["/api/watch-aziones", "/api/web/refresh"]);
  });

  it("does not loop when the repeated call is refused again", async () => {
    const { fn, calls } = mockFetch((url) => (url === "/api/web/refresh" ? json(200, { success: true }) : json(401, {})));
    const onSignedOut = vi.fn();
    const api = createApi({ fetch: fn, onSignedOut });
    await api.get("/watch-aziones").catch(() => undefined);
    expect(calls.filter((c) => c.url === "/api/web/refresh")).toHaveLength(1);
    expect(onSignedOut).toHaveBeenCalledTimes(1);
  });

  it("shares one refresh between calls refused at the same time", async () => {
    let refreshed = false;
    const { fn, calls } = mockFetch(async (url) => {
      if (url === "/api/web/refresh") {
        await new Promise((r) => setTimeout(r, 5));
        refreshed = true;
        return json(200, { success: true });
      }
      return refreshed ? json(200, { success: true, data: url }) : json(401, {});
    });
    const api = createApi({ fetch: fn });
    await Promise.all([api.get("/a"), api.get("/b"), api.get("/c")]);
    expect(calls.filter((c) => c.url === "/api/web/refresh")).toHaveLength(1);
  });

  it("does not refresh after a refused sign-in (wrong password)", async () => {
    const { fn, calls } = mockFetch(() => json(401, { success: false, message: "Invalid credentials" }));
    const onSignedOut = vi.fn();
    const api = createApi({ fetch: fn, onSignedOut });
    const err = (await api.post("/web/login", { email: "a@b.it", password: "x" }).catch((e: ApiError) => e)) as ApiError;
    expect(err.status).toBe(401);
    expect(calls).toHaveLength(1);
    expect(onSignedOut).not.toHaveBeenCalled();
  });
});

describe("402: the page reserved to Unlimited", () => {
  it("calls the Unlimited handler with the backend's code", async () => {
    const { fn } = mockFetch(() =>
      json(402, { success: false, error: "unlimited_required", message: "This feature requires a Finzy Unlimited subscription." }),
    );
    const onUnlimitedRequired = vi.fn();
    const api = createApi({ fetch: fn, onUnlimitedRequired });
    const err = (await api.get("/dashboard/stocks/NVDA").catch((e: ApiError) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(402);
    expect(err.code).toBe("unlimited_required");
    expect(onUnlimitedRequired).toHaveBeenCalledTimes(1);
    expect(onUnlimitedRequired).toHaveBeenCalledWith("unlimited_required");
  });
});
