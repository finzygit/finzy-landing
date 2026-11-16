import { describe, expect, it } from "vitest";
import { NAV, firstRoute, locate, permissionFor, visibleNav } from "./nav";

const all = new Set(NAV.flatMap((s) => s.groups.flatMap((g) => [g.perm, ...g.pages.map((p) => p.perm ?? g.perm)])));

describe("console menu", () => {
  it("the super admin sees the 9 groups in 4 sections, in Italian", () => {
    const nav = visibleNav(all);
    expect(nav.map((s) => s.label)).toEqual(["Panoramica", "Clienti e ricavi", "Contenuti e dati", "Sistema"]);
    expect(nav.flatMap((s) => s.groups.map((g) => g.label))).toEqual([
      "Home", "Utenti", "Ricavi e promozioni", "Notizie", "Titoli", "Report AI", "Contenuti app", "Costi e servizi", "Amministrazione",
    ]);
  });

  it("the marketing role sees Home, Promozioni and Strumenti esterni, never Ricavi", () => {
    const nav = visibleNav(new Set(["console.home.view", "console.promotions.view", "console.promotions.update", "console.tools.view"]));
    const items = nav.flatMap((s) => s.groups);
    expect(items.map((g) => [g.label, g.route])).toEqual([
      ["Home", "/"],
      ["Promozioni", "/promotions"],
      ["Strumenti esterni", "/admin/tools"],
    ]);
    expect(JSON.stringify(nav)).not.toContain("Ricavi");
  });

  it("a group opens on its first page the role can open", () => {
    const nav = visibleNav(new Set(["console.admin.view"]));
    const admin = nav.flatMap((s) => s.groups).find((g) => g.id === "admin")!;
    expect(admin.pages.map((p) => p.id)).toEqual(["roles", "people", "log"]);
  });

  it("finds the active item and the permission of a route", () => {
    expect(locate("/admin/audit-log")).toEqual({ group: "admin", page: "log" });
    expect(locate("/users/detail?id=4")).toEqual({ group: "users", page: null });
    expect(locate("/")).toEqual({ group: "home", page: null });
    expect(permissionFor("/promotions")).toBe("console.promotions.view");
    expect(permissionFor("/admin/tools")).toBe("console.tools.view");
    expect(permissionFor("/admin/roles")).toBe("console.admin.view");
    expect(permissionFor("/account")).toBeUndefined();
  });
});

describe("routes inside a group", () => {
  it("the longest route wins", () => {
    expect(locate("/news/articles")).toEqual({ group: "news", page: "articles" });
    expect(locate("/news")).toEqual({ group: "news", page: "today" });
    expect(locate("/revenue")).toEqual({ group: "revenue", page: "revenue" });
  });
});

describe("where an admin lands", () => {
  it("Home when the role opens it, else its first page", () => {
    expect(firstRoute(all)).toBe("/");
    expect(firstRoute(new Set(["console.promotions.view", "console.tools.view"]))).toBe("/promotions");
    expect(firstRoute(new Set(["console.news.view"]))).toBe("/news");
  });
});
