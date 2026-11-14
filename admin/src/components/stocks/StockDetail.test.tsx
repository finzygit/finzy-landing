import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { ConsoleProvider } from "@/lib/console";
import { StockDetail } from "./StockDetail";
import { EDIT, VIEW, fakeApi, page } from "./testing";

const nav = vi.hoisted(() => ({ search: "id=1" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/titoli/scheda",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const TABS = {
  "/stocks/1/chart": { range: "6M", points: [["2026-06-01", 180], ["2026-11-13", 221.3]] },
  "/stocks/1/prices": { rows: [{ day: "2026-11-13", open: 228.1, high: 229.44, low: 219.9, close: 221.3, volume: 212400000, source: "twelvedata" }], total: 2514, page: 1, per_page: 20 },
  "/stocks/1/documents": { rows: [] },
  "/stocks/1/reports": { counts: { completed: 2, failed: 1 }, rows: [{ id: 5, type: "ten_k_analysis", type_label: "Stock Snapshot", period: "FY 2026", status: "failed", at: "2026-08-06T02:02:00+00:00" }] },
  "/stocks/1/news": { total: 0, rows: [] },
};

function setup(perms: string[], stock: unknown, more: Record<string, unknown> = {}) {
  const api = fakeApi(perms, { "/stocks/1": stock, ...TABS, ...more });
  render(<ConsoleProvider api={api}><StockDetail /></ConsoleProvider>);
  return api;
}

describe("Stock page (MOB-1377)", () => {
  beforeEach(() => {
    nav.search = "id=1";
  });

  it("reads identity, price with source and time, sync and last changes; the price is never a field", async () => {
    setup(EDIT, page());
    expect(await screen.findByRole("heading", { name: "Nvidia" })).toBeTruthy();
    expect(screen.getByText("NVDA · Nasdaq (XNAS) · Azione · Stati Uniti")).toBeTruthy();
    expect(screen.getByText("$221,30")).toBeTruthy();
    expect(screen.getByText("Twelve Data · 14/11/2026, 22:05")).toBeTruthy();
    expect(screen.getByText("Sola lettura: lo scrive la sincronizzazione")).toBeTruthy();
    expect(screen.getByText("Bloccato a mano: l’AI non lo cambia")).toBeTruthy();
    expect(screen.getByText("Nome comune: «NVIDIA» → «Nvidia», bloccato")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Modifica/ })).toBeTruthy();
    expect(document.querySelector("main input, input")).toBeNull();
    const prices = await screen.findByRole("table", { name: "Righe di prezzo" });
    expect(within(prices).getByText("221,30")).toBeTruthy();
    expect(within(prices).getByText("212,4 M")).toBeTruthy();
    expect(screen.getByText("1–20 di 2.514 giorni")).toBeTruthy();
  });

  it("a role without «Titoli · Modifica» sees no Modifica, and why", async () => {
    setup(VIEW, page());
    expect(await screen.findByText("Per modificare serve il permesso «Titoli · Modifica».")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Modifica/ })).toBeNull();
  });

  it("a stale price says since when and why, in amber, never with a repair button", async () => {
    setup(VIEW, page({ price_state: "stale", price_at: "2026-08-24T00:00:00+02:00", price_day_only: true, last_row_on: "2026-08-24", not_found_at: "2026-11-10T03:00:00+00:00" }));
    expect(await screen.findByText(/Il prezzo è fermo dal 24\/08\/2026: il fornitore non lo trova dal 10\/11\/2026/)).toBeTruthy();
    expect(screen.getByText(/Ultima chiusura il 24\/08\/2026/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Rileggi|Ripara/ })).toBeNull();
  });

  it("a stock without a price has no chart and says so", async () => {
    setup(VIEW, page({ price: null, change: null, price_state: "never", price_at: null, last_row_on: null }), { "/stocks/1/prices": { rows: [], total: 0, page: 1, per_page: 20 } });
    expect(await screen.findByText(/la sincronizzazione non ne ha mai trovato uno/)).toBeTruthy();
    expect(screen.getByText("Senza prezzo: nessuna chiusura da mostrare")).toBeTruthy();
    expect(await screen.findByText("La sincronizzazione non ha ancora trovato prezzi per questo titolo.")).toBeTruthy();
  });

  it("«‹ Titoli» returns to the list with its filters", async () => {
    window.sessionStorage.setItem("console.stocks.list", "price=stale&sort=oldest");
    setup(VIEW, page());
    await screen.findByRole("heading", { name: "Nvidia" });
    expect(screen.getByRole("link", { name: "Titoli" }).getAttribute("href")).toBe("/titoli?price=stale&sort=oldest");
  });

  it("tabs: reports with their state and the link to Report AI; empty news", async () => {
    setup([...VIEW, "console.reports.view"], page());
    fireEvent.click(await screen.findByRole("tab", { name: "Report 4" }));
    expect(await screen.findByText("Non riuscito")).toBeTruthy();
    expect(screen.getByText("2 completati · 1 non riuscito")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Apri in Report AI/ }).getAttribute("href")).toBe("/report");
    fireEvent.click(screen.getByRole("tab", { name: "Notizie 38" }));
    expect(await screen.findByText("Nessun articolo collegato")).toBeTruthy();
  });

  it("no link to Report AI for a role that cannot open it", async () => {
    setup(VIEW, page());
    fireEvent.click(await screen.findByRole("tab", { name: "Report 4" }));
    expect(await screen.findByText("Non riuscito")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Apri in Report AI/ })).toBeNull();
  });

  it("a stock that does not exist", async () => {
    setup(VIEW, new ApiError(404, "not_found"));
    expect(await screen.findByText("Titolo non trovato")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Vai ai Titoli" })).toBeTruthy();
  });

  it("a failed load offers «Riprova»", async () => {
    let n = 0;
    setup(VIEW, () => (++n === 1 ? new ApiError(500, null) : page()));
    fireEvent.click(await screen.findByRole("button", { name: "Riprova" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Nvidia" })).toBeTruthy());
  });
});
