import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fakeApi, renderPage } from "@/components/ai-reports/testing";
import { ApiError } from "@/lib/api";
import BuilderPage from "./page";
import GenerationPage from "./generazione/page";

const nav = vi.hoisted(() => ({ pathname: "/portfolio-builder", search: "", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const card = (key: string, name: string, extra: object = {}) => ({
  key, name, risk_profile: "Segue i trend", enabled: true,
  latest: { id: 30, status: "published", started_at: "2026-11-14T03:28:00Z", published_at: "2026-11-14T03:29:00Z" },
  published: { id: 30, published_at: "2026-11-14T03:29:00Z", prompt_version: 2, categories: { stocks: 40, bonds: 60 }, instruments: 24 },
  ...extra,
});
const builder = {
  portfolios: [card("momentum", "Momentum"), card("all_weather", "All Weather", { enabled: false, latest: null, published: null, risk_profile: "Bilanciato" })],
  next_run: "2026-12-01T03:30:00+01:00",
  history: {
    rows: [
      { id: 31, portfolio: "growth", name: "Growth", status: "failed", reason: { code: "weight_sum", category: "stocks", sum: 55, expected: 50 }, prompt_version: 2,
        list: { list: "2026-09-v1", risk_date: "2026-11-08" }, started_at: "2026-11-14T03:27:00Z", published_at: null },
    ],
    total: 15, page: 1, per_page: 10,
  },
};
const allocation = {
  categories: [{ category: "stocks", weight: 40, rationale: "Trend positivo." }, { category: "forex", weight: 60, rationale: "Valute." }],
  instruments: [
    { category: "stocks", symbol: "SHW", name: "The Sherwin-Williams Company", risk: "medium", weight: 40, rationale: "Tendenza rialzista." },
    { category: "forex", symbol: "C:EURSGD", name: "Euro - Singapore dollar", risk: "low", weight: 60, rationale: "Coppia regolare." },
  ],
};
const generation = (extra: object) => ({
  id: 30, portfolio: "momentum", name: "Momentum", status: "published", reason: null, prompt_version: 2, list: { list: "2026-09-v1", risk_date: "2026-11-08" },
  started_at: "2026-11-14T03:28:00Z", published_at: "2026-11-14T03:29:00Z", risk_profile: "Segue i trend", in_app: true, failure: null, ...allocation, ...extra,
});

describe("Portfolio Builder", () => {
  it("cards for every portfolio (All Weather off), the next run and the history with a readable reason", async () => {
    const { api, writes } = fakeApi({ "/portfolios": builder });
    renderPage(<BuilderPage />, api);
    await screen.findByText("Momentum");
    expect(screen.getByText("Prossima generazione automatica: 1° dicembre alle 03:30")).toBeTruthy();
    expect(screen.getByText("24 strumenti · prompt v2 · pubblicato 14/11/2026")).toBeTruthy();
    expect(screen.getByText("Non attivo")).toBeTruthy();
    expect(screen.getByText("Non attivo: nessuna generazione finché non viene acceso.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Momentum: apri l’ultima generazione" }).getAttribute("href")).toBe("/portfolio-builder/generazione?id=30");
    expect(screen.getByText("Azioni al 55% invece di 50%")).toBeTruthy();
    expect(screen.getByText("set 2026 · rischio dell’08/11")).toBeTruthy();
    expect(screen.getByText("1–10 di 15 generazioni")).toBeTruthy();
    fireEvent.click(screen.getByText("Growth"));
    expect(nav.push).toHaveBeenCalledWith("/portfolio-builder/generazione?id=31");
    expect(screen.queryByRole("button", { name: /Genera|Rigenera/ })).toBeNull();
    expect(writes).not.toHaveBeenCalled();
  });

  it("an error replaces the page", async () => {
    const { api } = fakeApi({ "/portfolios": new ApiError(500, null) });
    renderPage(<BuilderPage />, api);
    await screen.findByText("Non è stato possibile caricare il Portfolio Builder");
  });
});

describe("Generation", () => {
  it("a published generation reads as tables, with the total", async () => {
    nav.search = "id=30";
    const { api } = fakeApi({ "/portfolios/30": generation({}) });
    renderPage(<GenerationPage />, api);
    await screen.findByText("Allocazione per classe");
    expect(screen.getByText("Momentum · 14/11/2026, 04:29")).toBeTruthy();
    expect(screen.getByText("Segue i trend · prompt v2 · elenco strumenti di settembre, rischio dell’08/11")).toBeTruthy();
    expect(screen.getByText("Pubblicata alle 04:29 · nell’app da allora")).toBeTruthy();
    expect(screen.getByText("2 classi · 2 strumenti")).toBeTruthy();
    expect(screen.getByText("Totale")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.getByText("The Sherwin-Williams Company")).toBeTruthy();
    expect(screen.getByText("Medio")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Forex/ }));
    expect(screen.queryByText("Euro - Singapore dollar")).toBeNull();
  });

  it("a failed generation says why, what the app showed and links the next published one", async () => {
    nav.search = "id=31";
    const failed = generation({
      id: 31, portfolio: "growth", name: "Growth", status: "failed", published_at: null, started_at: "2026-11-14T03:27:00Z", in_app: false, categories: [], instruments: [],
      failure: { reason: { code: "weight_sum", category: "stocks", sum: 55, expected: 50 }, technical: "instruments of 'stocks' sum to 55, expected 50", first: true, app_had: null,
        next_published: { id: 32, published_at: "2026-11-14T03:30:00Z" } },
    });
    const { api } = fakeApi({ "/portfolios/31": failed });
    renderPage(<GenerationPage />, api);
    await screen.findByText("La generazione non è riuscita");
    expect(screen.getByText("Il modello ha dato alle azioni pesi che sommano 55% invece di 50%: il controllo prima della pubblicazione l’ha fermata.")).toBeTruthy();
    expect(screen.getByText(/Era la prima generazione di Growth/)).toBeTruthy();
    expect(screen.getByText("instruments of 'stocks' sum to 55, expected 50")).toBeTruthy();
    expect(screen.getByText("Apri la generazione pubblicata").closest("a")?.getAttribute("href")).toBe("/portfolio-builder/generazione?id=32");
  });

  it("not found", async () => {
    nav.search = "id=99";
    const { api } = fakeApi({ "/portfolios/99": new ApiError(404, null) });
    renderPage(<GenerationPage />, api);
    await screen.findByText("Generazione non trovata");
  });
});
