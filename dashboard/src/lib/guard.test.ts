// MOB-1198 (FZW-WEB-01): who sees which page. Not signed in: the sign-in
// page. Signed in without Unlimited (or with a plan that lapsed): the page
// reserved to Unlimited, and no stock page. Unlimited: the dashboard.
import { describe, expect, it } from "vitest";
import { pageAccess, routeFor, safeNext, type Session } from "./guard.ts";

const loading: Session = { status: "loading" };
const anonymous: Session = { status: "anonymous" };
const free: Session = { status: "signed", unlimited: false };
const unlimited: Session = { status: "signed", unlimited: true };

describe("pageAccess", () => {
  it("knows the open, the signed-in and the Unlimited pages", () => {
    expect(pageAccess("/accedi")).toBe("public");
    expect(pageAccess("/password")).toBe("public");
    expect(pageAccess("/riservata")).toBe("signed");
    expect(pageAccess("/")).toBe("unlimited");
    expect(pageAccess("/titolo")).toBe("unlimited");
    expect(pageAccess("/osservati")).toBe("unlimited");
    expect(pageAccess("/anything-else")).toBe("unlimited");
  });
});

describe("routeFor", () => {
  it("waits while the session is loading", () => {
    expect(routeFor("unlimited", loading, "/")).toBeNull();
    expect(routeFor("public", loading, "/accedi")).toBeNull();
  });

  it("sends a visitor who is not signed in to the sign-in page, keeping where they were going", () => {
    expect(routeFor("unlimited", anonymous, "/titolo?s=NVDA&tab=profilo")).toBe("/accedi?next=%2Ftitolo%3Fs%3DNVDA%26tab%3Dprofilo");
    expect(routeFor("unlimited", anonymous, "/")).toBe("/accedi");
    expect(routeFor("signed", anonymous, "/riservata")).toBe("/accedi");
  });

  it("sends a user without Unlimited to the reserved page, never to a stock", () => {
    expect(routeFor("unlimited", free, "/titolo?s=NVDA")).toBe("/riservata");
    expect(routeFor("unlimited", free, "/osservati")).toBe("/riservata");
    expect(routeFor("public", free, "/accedi")).toBe("/riservata");
    expect(routeFor("signed", free, "/riservata")).toBeNull();
  });

  it("lets an Unlimited user in and moves them off the sign-in and reserved pages", () => {
    expect(routeFor("unlimited", unlimited, "/titolo?s=NVDA")).toBeNull();
    expect(routeFor("public", unlimited, "/accedi")).toBe("/");
    expect(routeFor("public", unlimited, "/accedi?next=%2Fosservati")).toBe("/osservati");
    expect(routeFor("public", unlimited, "/accedi?next=%2F%09%2Fevil.example")).toBe("/");
    expect(routeFor("signed", unlimited, "/riservata")).toBe("/");
  });

  it("leaves the sign-in pages open to visitors", () => {
    expect(routeFor("public", anonymous, "/accedi")).toBeNull();
    expect(routeFor("public", anonymous, "/password")).toBeNull();
  });
});

describe("safeNext", () => {
  it("accepts only paths of this site", () => {
    expect(safeNext("/osservati")).toBe("/osservati");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext(null)).toBe("/");
    expect(safeNext("/accedi")).toBe("/");
    expect(safeNext("/titolo?s=NVDA&tab=finanza")).toBe("/titolo?s=NVDA&tab=finanza");
  });

  it("refuses control characters the URL parser would drop (/\t/evil.com → //evil.com)", () => {
    expect(safeNext("/\t/evil.example")).toBe("/");
    expect(safeNext("/\n/evil.example")).toBe("/");
    expect(safeNext("/\r\n/evil.example")).toBe("/");
    expect(safeNext(decodeURIComponent("%2F%09%2Fevil.example"))).toBe("/");
  });
});
