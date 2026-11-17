import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { ConsoleProvider } from "@/lib/console";
import { StockCell } from "./parts";
import { StocksList } from "./StocksList";
import { VIEW, fakeApi, list, row } from "./testing";

const nav = vi.hoisted(() => ({ search: "", push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/stocks",
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const FACETS = { types: { stock: 21237, fund: 7521, bond: 2616, forex: 821, commodity: 229, crypto: 196 }, areas: { USA: 11840, Europe: 8490, "Asia-Pacific": 2284, America: 0, none: 10006 }, mics: [{ mic: "XNAS", n: 5821 }, { mic: "XETR", n: 3194 }] };

function setup(routes: Record<string, unknown>) {
  const api = fakeApi(VIEW, { "/stocks/facets": FACETS, ...routes });
  render(<ConsoleProvider api={api}><StocksList /></ConsoleProvider>);
  return api;
}

describe("Titoli list (MOB-1377)", () => {
  beforeEach(() => {
    nav.search = "";
    nav.push.mockReset();
    window.history.replaceState(null, "", "/stocks");
  });

  it("shows the rows with price, its time, report marks and the freshness line; prices are text, never inputs", async () => {
    setup({ "/stocks": list([row(), row({ id: 2, symbol: "AVB", name: "AvalonBay Communities, Inc.", common_name: null, price: 68.14, change: null, price_state: "stale", price_at: "2026-08-24T00:00:00+02:00", price_day_only: true, not_found_at: "2026-11-10T03:00:00+00:00", reports: { snapshots: 0, ten_k: true, universe: false } })], { total: 32620 }) });
    const table = await screen.findByRole("table", { name: "Titoli" });
    expect(await within(table).findByText("NVDA")).toBeTruthy();
    expect(within(table).getByText("$221,30")).toBeTruthy();
    expect(within(table).getByText("−3,16%")).toBeTruthy();
    expect(within(table).getByLabelText("Snapshot 2")).toBeTruthy();
    expect(within(table).getByText("24/08")).toBeTruthy();
    expect(within(table).getByText("non trovato dal 10/11")).toBeTruthy();
    expect(table.querySelector("input")).toBeNull();
    expect(screen.getByText("2.972 fermi da più di 3 giorni")).toBeTruthy();
    expect(screen.getByText("32.620")).toBeTruthy();
  });

  it("a filter asks the server with the menu's values and shows «N di total»; «Togli i filtri» clears them", async () => {
    const api = setup({ "/stocks": (q: Record<string, unknown>) => (q?.type ? list([row()], { total: 21237 }) : list([row()], { total: 32620 })) });
    await screen.findByRole("table", { name: "Titoli" });
    fireEvent.click(screen.getByRole("button", { name: /^Tipo/ }));
    fireEvent.click(await screen.findByLabelText(/Azione/));
    await waitFor(() => expect(api.calls.some((c) => c.path === "/stocks" && (c.arg as Record<string, unknown>)?.type === "stock")).toBe(true));
    expect(await screen.findByText("21.237 di 32.620")).toBeTruthy();
    expect(window.location.search).toBe("?type=stock");
    fireEvent.click(screen.getByRole("button", { name: "Togli i filtri" }));
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("the stale link applies the Prezzo filter", async () => {
    const api = setup({ "/stocks": list([row()]) });
    fireEvent.click(await screen.findByText("2.972 fermi da più di 3 giorni"));
    await waitFor(() => expect(api.calls.some((c) => (c.arg as Record<string, unknown>)?.price === "stale")).toBe(true));
  });

  it("a search without results says what was searched", async () => {
    nav.search = "q=nvdia";
    setup({ "/stocks": list([], { total: 0 }) });
    expect(await screen.findByText("Nessun titolo per «nvdia»", undefined, { timeout: 2000 })).toBeTruthy();
  });

  it("a failed load offers «Riprova»", async () => {
    let n = 0;
    setup({ "/stocks": () => (++n === 1 ? new ApiError(500, null) : list([row()])) });
    fireEvent.click(await screen.findByRole("button", { name: "Riprova" }));
    expect(await screen.findByText("NVDA")).toBeTruthy();
  });

  it("only the latest answer is shown: a slow older search never overwrites a newer one", async () => {
    let release: (v: unknown) => void = () => undefined;
    const slow = new Promise((r) => (release = r));
    const api = setup({ "/stocks": (q: Record<string, unknown>) => (q?.q === "nv" ? slow : list([row({ symbol: q?.q === "nvda" ? "NVDA" : "AAPL" })])) });
    await screen.findByText("AAPL");
    const box = screen.getByLabelText("Cerca un titolo");
    fireEvent.change(box, { target: { value: "nv" } });
    await waitFor(() => expect(api.calls.some((c) => (c.arg as Record<string, unknown>)?.q === "nv")).toBe(true), { timeout: 2000 });
    fireEvent.change(box, { target: { value: "nvda" } });
    expect(await screen.findByText("NVDA", undefined, { timeout: 2000 })).toBeTruthy();
    release(list([row({ symbol: "SLOW" })]));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("SLOW")).toBeNull();
    expect(screen.getByText("NVDA")).toBeTruthy();
  });

  it("an exchange and an area never add up to nothing: picking one kind clears the other", async () => {
    const api = setup({ "/stocks": list([row()]) });
    await screen.findByText("NVDA");
    fireEvent.click(screen.getByRole("button", { name: /^Area e borsa/ }));
    fireEvent.click(await screen.findByLabelText(/^USA/));
    await waitFor(() => expect(api.calls.some((c) => (c.arg as Record<string, unknown>)?.area === "USA")).toBe(true));
    fireEvent.click(screen.getByLabelText(/XETR/));
    await waitFor(() => {
      const last = api.calls.filter((c) => c.path === "/stocks").pop()?.arg as Record<string, unknown>;
      expect(last).toMatchObject({ mic: "XETR" });
      expect(last.area).toBeUndefined();
    });
  });

  it("the list's query is kept for «‹ Titoli»", async () => {
    setup({ "/stocks": list([row()]) });
    fireEvent.click(await screen.findByText("2.972 fermi da più di 3 giorni"));
    await waitFor(() => expect(window.sessionStorage.getItem("console.stocks.list")).toBe("price=stale"));
  });

  it("a row opens the stock page", async () => {
    setup({ "/stocks": list([row({ id: 7 })]) });
    const cell = await screen.findByText("NVDA");
    fireEvent.click(cell.closest("tr") as HTMLElement);
    expect(nav.push).toHaveBeenCalledWith("/stocks/detail?id=7");
  });
});

describe("Titoli list chips (MOB-1489)", () => {
  it("two chips under the name wrap to a new line instead of being cut", () => {
    render(<StockCell row={{ symbol: "GOOG", name: "Alphabet Inc. Class C", common_name: null, hidden: true, secondary: true, logo_url: null }} />);
    const chip = screen.getByText("Secondaria");
    const line = chip.parentElement as HTMLElement;
    expect(screen.getByText("Nascosto nell’app").parentElement).toBe(line);
    expect(line.style.flexWrap).toBe("wrap");
    expect(line.style.overflow).not.toBe("hidden");
    expect(chip.style.flexShrink).toBe("0");
    // the name stays beside the last chip and is cut there, rather than dropping to a line of its own
    expect(screen.getByText("Alphabet Inc. Class C").style.flex).toBe("1 1 60px");
  });
});
