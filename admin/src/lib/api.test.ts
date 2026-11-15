import { describe, expect, it, vi } from "vitest";
import { ApiError, buildUrl, createApi, redirectFor } from "./api";

function reply(status: number, body: unknown) {
  return vi.fn(async () => new Response(body === null ? "" : JSON.stringify(body), { status }));
}

describe("console api client", () => {
  it("sends the console header and same-origin credentials on every call", async () => {
    const f = reply(200, { ok: true });
    const api = createApi({ fetch: f as unknown as typeof fetch });
    await api.get("/me");
    await api.post("/roles", { name: "x" });
    for (const [, init] of f.mock.calls as unknown as [string, RequestInit][]) {
      expect((init.headers as Record<string, string>)["X-Finzy-Admin"]).toBe("1");
      expect(init.credentials).toBe("same-origin");
    }
    expect((f.mock.calls as unknown as [string][])[0][0]).toBe("/api/admin/me");
  });

  it("maps the shared codes to where the admin must go", () => {
    expect(redirectFor(401, "unauthenticated")).toBe("/sign-in");
    expect(redirectFor(401, "session_expired")).toBe("/sign-in?expired=1");
    expect(redirectFor(403, "two_factor_required")).toBe("/sign-in/code");
    expect(redirectFor(403, "two_factor_setup_required")).toBe("/sign-in/setup");
    expect(redirectFor(403, "forbidden")).toBeNull();
    expect(redirectFor(404, "not_found")).toBeNull();
  });

  it("redirects on a 401 of a page call and still throws", async () => {
    const onRedirect = vi.fn();
    const api = createApi({ fetch: reply(401, { code: "session_expired" }) as unknown as typeof fetch, onRedirect });
    await expect(api.get("/roles")).rejects.toMatchObject({ status: 401, code: "session_expired" });
    expect(onRedirect).toHaveBeenCalledWith("/sign-in?expired=1");
  });

  it("does not redirect when the sign-in itself is refused", async () => {
    const onRedirect = vi.fn();
    const api = createApi({ fetch: reply(422, { code: "invalid_code" }) as unknown as typeof fetch, onRedirect });
    const err = await api.post("/session/two-factor", { code: "000000" }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe("invalid_code");
    expect(onRedirect).not.toHaveBeenCalled();
  });

  it("a network failure is the offline error", async () => {
    const api = createApi({ fetch: vi.fn(async () => Promise.reject(new TypeError("Failed"))) as unknown as typeof fetch });
    await expect(api.get("/me")).rejects.toMatchObject({ status: 0, code: "offline" });
  });

  it("builds query strings without empty values", () => {
    expect(buildUrl("/api/admin", "/activity", { area: "users", q: "", page: 2, who: null })).toBe("/api/admin/activity?area=users&page=2");
  });

  it("a session that ended on the code page still goes to the sign-in", async () => {
    const onRedirect = vi.fn();
    const api = createApi({ fetch: reply(401, { code: "session_expired" }) as unknown as typeof fetch, onRedirect });
    await expect(api.post("/session/two-factor", { code: "123456" })).rejects.toMatchObject({ status: 401 });
    expect(onRedirect).toHaveBeenCalledWith("/sign-in?expired=1");
  });
});
