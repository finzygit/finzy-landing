import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Api } from "@/lib/api";
import { ConsoleProvider, type Me } from "@/lib/console";
import { AdminFrame } from "./AdminFrame";

const nav = vi.hoisted(() => ({ pathname: "/", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(),
}));

function me(perms: string[], twoFactor = { confirmed: true, verified: true, recovery_left: 8 }): Me {
  return { user: { id: 3, name: "Giulia Conti", email: "g.conti@esempio.it" }, role: { id: 2, key: "Marketing", label: "Marketing" }, permissions: perms, two_factor: twoFactor, idle_minutes: 30 };
}

function api(meValue: Me): Api {
  return {
    get: vi.fn(async (path: string) => {
      if (path === "/me") return meValue;
      throw new Error(`unexpected ${path}`);
    }) as Api["get"],
    post: vi.fn() as Api["post"],
    put: vi.fn() as Api["put"],
    del: vi.fn(async () => null) as Api["del"],
    blob: vi.fn() as Api["blob"],
  };
}

const MARKETING = ["console.home.view", "console.promotions.view", "console.promotions.update", "console.tools.view"];

describe("AdminFrame", () => {
  beforeEach(() => {
    nav.pathname = "/";
    nav.replace.mockReset();
  });

  it("draws only the pages the role may open", async () => {
    render(
      <ConsoleProvider api={api(me(MARKETING))}>
        <AdminFrame>
          <p>contenuto</p>
        </AdminFrame>
      </ConsoleProvider>,
    );
    await screen.findByText("contenuto");
    const menu = screen.getByLabelText("Menu della console");
    expect(menu.textContent).toContain("Promozioni");
    expect(menu.textContent).toContain("Strumenti esterni");
    expect(menu.textContent).not.toContain("Ricavi");
    expect(menu.textContent).not.toContain("Utenti");
    expect(menu.textContent).toContain("Giulia Conti");
  });

  it("a page the role cannot open shows «Non hai accesso», not the page", async () => {
    nav.pathname = "/admin/roles";
    render(
      <ConsoleProvider api={api(me(MARKETING))}>
        <AdminFrame>
          <p>ruoli segreti</p>
        </AdminFrame>
      </ConsoleProvider>,
    );
    await screen.findByText("Non hai accesso a questa pagina");
    expect(screen.queryByText("ruoli segreti")).toBeNull();
  });

  it("an admin who has not passed the code is sent to the code page", async () => {
    render(
      <ConsoleProvider api={api(me(MARKETING, { confirmed: true, verified: false, recovery_left: 8 }))}>
        <AdminFrame>
          <p>contenuto</p>
        </AdminFrame>
      </ConsoleProvider>,
    );
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/sign-in/code"));
  });

  it("an admin without the authenticator is sent to the set-up", async () => {
    render(
      <ConsoleProvider api={api(me(MARKETING, { confirmed: false, verified: false, recovery_left: 0 }))}>
        <AdminFrame>
          <p>contenuto</p>
        </AdminFrame>
      </ConsoleProvider>,
    );
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/sign-in/setup"));
  });
});
