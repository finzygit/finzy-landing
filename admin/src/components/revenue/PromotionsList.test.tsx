import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { PromotionsList } from "./PromotionsList";
import { ALL, fakeApi, withConsole } from "./testkit";
import type { PromoList, PromoRow } from "./types";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/promozioni",
  useRouter: () => ({ replace: vi.fn(), push: nav.push }),
  useSearchParams: () => new URLSearchParams(),
}));

const ROWS: PromoRow[] = [
  { id: 3, name: "Natale", code: "NATALE", starts_at: "2026-12-14T00:00:00+01:00", ends_at: "2026-12-26T23:59:59+01:00", countries: ["IT"], statuses: ["free"], formulas_on: ["annual"], state: "scheduled" },
  { id: 2, name: "Black Friday", code: "BLACKFRIDAY", starts_at: "2026-11-27T00:00:00+01:00", ends_at: "2026-11-30T23:59:59+01:00", countries: ["IT", "GB"], statuses: ["trial", "free", "premium"], formulas_on: ["quarterly", "annual"], state: "active" },
  { id: 1, name: "Rientro dalle vacanze", code: "SETTEMBRE", starts_at: "2026-09-01T00:00:00+02:00", ends_at: "2026-09-09T11:20:59+02:00", countries: ["IT", "GB"], statuses: ["free", "premium"], formulas_on: ["quarterly"], state: "ended" },
];
const LIST: PromoList = { rows: ROWS, counts: { all: 3, active: 1, scheduled: 1, ended: 1 }, can_update: true };

function menuOf(name: string) {
  const row = screen.getByText(name).closest("tr") as HTMLElement;
  fireEvent.click(within(row).getByRole("button", { name: "Azioni" }));
  return within(row).getByRole("menu");
}

describe("PromotionsList", () => {
  beforeEach(() => nav.push.mockReset());

  it("lists promotions with their state, period and recipients", async () => {
    withConsole(fakeApi({ get: () => LIST }), <PromotionsList />);
    const row = (await screen.findByText("Black Friday")).closest("tr") as HTMLElement;

    expect(within(row).getByText("BLACKFRIDAY")).toBeTruthy();
    expect(within(row).getByText("27/11 00:00 → 30/11 23:59")).toBeTruthy();
    expect(within(row).getByText("Italia, Regno Unito")).toBeTruthy();
    expect(within(row).getByText("In prova, Free, Premium")).toBeTruthy();
    expect(within(row).getByText("3 mesi · 12 mesi")).toBeTruthy();
    expect(within(row).getByText("Attiva")).toBeTruthy();
    expect(screen.getByText("inizia il 14/12")).toBeTruthy();
    expect(screen.getByText("finita il 09/09")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Tutte\s*3/ })).toBeTruthy();
  });

  it("filters by state on the client", async () => {
    withConsole(fakeApi({ get: () => LIST }), <PromotionsList />);
    fireEvent.click(await screen.findByRole("button", { name: /Finite/ }));

    expect(screen.queryByText("Black Friday")).toBeNull();
    expect(screen.getByText("Rientro dalle vacanze")).toBeTruthy();
  });

  it("menu items follow the state: end a running one, delete only a scheduled one", async () => {
    withConsole(fakeApi({ get: () => LIST }), <PromotionsList />);
    await screen.findByText("Black Friday");

    const running = menuOf("Black Friday");
    expect(within(running).getAllByRole("menuitem").map((b) => b.textContent?.trim())).toEqual(["Modifica", "Duplica", "Termina ora"]);
    fireEvent.click(screen.getByText("Natale"));
    expect(nav.push).toHaveBeenCalledWith("/promozioni?id=3");
    const scheduled = menuOf("Natale");
    expect(within(scheduled).getAllByRole("menuitem").map((b) => b.textContent?.trim())).toEqual(["Modifica", "Duplica", "Elimina"]);
    const ended = menuOf("Rientro dalle vacanze");
    expect(within(ended).getAllByRole("menuitem").map((b) => b.textContent?.trim())).toEqual(["Apri", "Duplica"]);
  });

  it("ends a running promotion after the confirmation and reloads", async () => {
    const api = fakeApi({ get: () => LIST, post: () => ({}) });
    withConsole(api, <PromotionsList />);
    await screen.findByText("Black Friday");
    fireEvent.click(within(menuOf("Black Friday")).getByRole("menuitem", { name: /Termina ora/ }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Terminare «Black Friday» adesso?")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Termina ora" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/promotions/2/end"));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(api.get.mock.calls.filter(([p]: unknown[]) => p === "/promotions").length).toBe(2);
  });

  it("a failed delete keeps the dialog with its error", async () => {
    const api = fakeApi({ get: () => LIST, del: () => { throw new ApiError(500, null); } });
    withConsole(api, <PromotionsList />);
    await screen.findByText("Natale");
    fireEvent.click(within(menuOf("Natale")).getByRole("menuitem", { name: /Elimina/ }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Elimina" }));

    expect(await screen.findByText("Non eliminata: riprova tra poco.")).toBeTruthy();
    expect(api.del).toHaveBeenCalledWith("/promotions/3");
  });

  it("a role that only sees gets the read-only note, no «Nuova promozione», only «Apri»", async () => {
    const perms = ALL.filter((p) => p !== "console.promotions.update");
    withConsole(fakeApi({ get: () => ({ ...LIST, can_update: false }) }, perms), <PromotionsList />);
    await screen.findByText("Black Friday");

    await waitFor(() => expect(screen.getByText(/Puoi vedere le promozioni ma non cambiarle/)).toBeTruthy());
    expect(screen.queryByRole("button", { name: /Nuova promozione/ })).toBeNull();
    expect(within(menuOf("Black Friday")).getAllByRole("menuitem").map((b) => b.textContent?.trim())).toEqual(["Apri"]);
  });

  it("no promotion yet: the empty state", async () => {
    withConsole(fakeApi({ get: () => ({ rows: [], counts: { all: 0, active: 0, scheduled: 0, ended: 0 }, can_update: true }) }), <PromotionsList />);

    expect(await screen.findByText("Nessuna promozione")).toBeTruthy();
  });
});
