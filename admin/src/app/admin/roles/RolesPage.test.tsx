// MOB-1487: the roles table. The header row and every area row are grids with
// the same columns, so each header must take a real grid cell: a visually
// hidden corner cell (position: absolute) leaves the grid, and every role name
// then sits one column off its data.
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fakeApi, renderPage } from "@/components/content/testkit";
import RolesPage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/roles",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const ROLES = {
  roles: [
    { id: 1, key: "super_admin", name: "Super amministratore", description: null, locked: true, people: 2, grants: { home: "all", users: "all" }, extras: [] },
    { id: 2, key: "operations", name: "Operazioni", description: null, locked: false, people: 1, grants: { home: "view", users: "edit" }, extras: [] },
  ],
};
const AREAS = { areas: [{ area: "home", edit: false, extras: [] }, { area: "users", edit: true, extras: ["export"] }] };

describe("Ruoli e permessi", () => {
  it("puts every role name over its own column", async () => {
    renderPage(<RolesPage />, fakeApi(["console.home.view", "console.admin.view", "console.admin.update"], { "GET /roles": ROLES, "GET /permissions": AREAS }).api);
    const table = await screen.findByRole("table", { name: "Ruoli e permessi" });
    const [head, ...rows] = within(table).getAllByRole("row");
    const headCells = Array.from(head.children);
    // a grid cell that is position:absolute (.sr-only) is not a column
    expect(headCells.filter((c) => c.classList.contains("sr-only"))).toEqual([]);
    for (const row of rows) expect(row.children.length).toBe(headCells.length);
    expect(headCells[1].textContent).toContain("Super amministratore");
    expect(within(rows[0]).getAllByRole("cell")[0].textContent).toContain("Tutto");
    expect(headCells[0].textContent).toBe("Area");
  });
});
