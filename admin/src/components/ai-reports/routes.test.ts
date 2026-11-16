// @vitest-environment node
// MOB-1378: the Report AI pages sit where main's menu sends the admin
// (lib/nav.ts, English routes since #28) and every link these pages draw
// opens a page that exists in the static export.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NAV, locate, permissionFor } from "@/lib/nav";

const APP = fileURLToPath(new URL("../../app", import.meta.url));
const pageFor = (route: string) => `${APP}${route.replace(/\?.*$/, "")}/page.tsx`;

const group = NAV.flatMap((s) => s.groups).find((g) => g.id === "reports");

const SOURCES = [
  "report/page.tsx",
  "report/detail/page.tsx",
  "portfolio-builder/page.tsx",
  "portfolio-builder/detail/page.tsx",
  "consents/page.tsx",
  "../components/ai-reports/Allocation.tsx",
];

describe("Report AI routes", () => {
  it("every menu page of the group has its page", () => {
    expect(group?.pages.map((p) => p.route)).toEqual(["/report", "/portfolio-builder", "/consents"]);
    for (const p of group?.pages ?? []) expect(existsSync(pageFor(p.route)), p.route).toBe(true);
  });

  it("the detail pages light the right menu item and need the group's permission", () => {
    expect(locate("/report/detail?id=3")).toEqual({ group: "reports", page: "reports" });
    expect(locate("/portfolio-builder/detail?id=31")).toEqual({ group: "reports", page: "builder" });
    expect(locate("/consents")).toEqual({ group: "reports", page: "consents" });
    expect(permissionFor("/report/detail?id=3")).toBe("console.reports.view");
    expect(existsSync(pageFor("/report/detail"))).toBe(true);
    expect(existsSync(pageFor("/portfolio-builder/detail"))).toBe(true);
  });

  it("every console link the pages draw opens an existing page", () => {
    const links = new Set<string>();
    for (const file of SOURCES) {
      const src = readFileSync(`${APP}/${file}`, "utf8");
      for (const m of src.matchAll(/(?:href=\{?[`"]|router\.(?:push|replace)\([`"])(\/[a-z0-9/-]*)/g)) links.add(m[1]);
    }
    expect(links.size).toBeGreaterThan(4);
    for (const route of links) expect(existsSync(pageFor(route)), route).toBe(true);
  });
});
