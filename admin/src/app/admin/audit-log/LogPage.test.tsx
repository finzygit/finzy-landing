// MOB-1487: the activity log says every event in words. The chip and the
// detail's «Evento» line never show a code like users.plan.gift.
import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fakeApi, renderPage } from "@/components/content/testkit";
import { eventName } from "@/lib/activity";
import LogPage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/audit-log",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const row = (id: number, event: string, kind: string, area: string, summary: string) => ({ id, at: "2026-11-17T10:18:00+01:00", who: { id: 1, name: "Valentina Russo" }, event, kind, area, summary });
const ROWS = [
  row(9800, "users.plan.gift", "plan", "users", "Unlimited per 30 giorni all’utente n. 18422"),
  row(9799, "promotions.promotion.end", "update", "promotions", "Promozione «Autunno» terminata"),
  row(9798, "users.user.suspend", "security", "users", "Utente n. 20117 sospeso"),
  row(9797, "users.user.reactivate", "security", "users", "Utente n. 20117 riattivato"),
];
const DETAIL = { ...ROWS[0], before: { plan: "free" }, after: { plan: "unlimited" }, reason: "Rimborso", ip: "203.0.113.24", user_agent: "Chrome 131 su macOS" };

describe("Registro attività", () => {
  it("names every event in words, in the list and in the detail", async () => {
    renderPage(<LogPage />, fakeApi(["console.home.view", "console.admin.view"], { "GET /activity": { rows: ROWS, total: 4, page: 1, per_page: 50 }, "GET /activity/9800": DETAIL }).api);
    await screen.findByText("Ha terminato", {}, { timeout: 2000 }); // the list loads after a 300 ms pause
    const table = screen.getByRole("table");
    expect(within(table).getByText("Ha sospeso")).toBeTruthy();
    expect(within(table).getByText("Ha riattivato")).toBeTruthy();
    expect(table.textContent).not.toMatch(/[a-z_]+\.[a-z_]+\.[a-z_]+/);

    fireEvent.click(within(table).getByText(/Unlimited per 30 giorni/));
    const drawer = await screen.findByRole("dialog");
    await within(drawer).findByText("Evento");
    const line = within(drawer).getByText("Evento").parentElement!;
    expect(line.textContent).toBe("EventoHa regalato un piano");
    expect(drawer.textContent).not.toContain("users.plan.gift");
  });

  it("MOB-1488: the detail names each field in words, never the backend key", async () => {
    const stock = { ...row(9801, "stocks.stock.update", "update", "stocks", "GOOG · nome comune «Google»"), before: { common_name: null, common_name_locked: false, expires_at: "2026-12-01" }, after: { common_name: "Google", common_name_locked: true, expires_at: "2027-01-01" }, reason: null, ip: null, user_agent: null };
    renderPage(<LogPage />, fakeApi(["console.home.view", "console.admin.view"], { "GET /activity": { rows: [stock], total: 1, page: 1, per_page: 50 }, "GET /activity/9801": stock }).api);
    fireEvent.click(await screen.findByText(/GOOG · nome comune/, {}, { timeout: 2000 }));
    const drawer = await screen.findByRole("dialog");
    const fields = (await within(drawer).findAllByRole("row")).slice(1).map((r) => r.firstElementChild?.textContent);
    expect(fields).toEqual(["Nome comune", "Nome bloccato", "Scadenza"]);
    expect(drawer.textContent).not.toMatch(/common_name|expires_at/);
  });

  it("falls back to words for an event it does not know", () => {
    expect(eventName("users.plan.gift")).toBe("Ha regalato un piano");
    expect(eventName("admin.person.two_factor.reset")).toBe("Ha azzerato la verifica in due passaggi di una persona");
    expect(eventName("access.session.signin")).toBe("Accesso alla console");
    expect(eventName("stocks.something_new.update")).toBe("Ha modificato");
    expect(eventName("weird")).toBe("Altro");
  });
});
