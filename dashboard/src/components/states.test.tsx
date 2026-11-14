// MOB-1198: the key states of the dashboard components, as the boards draw
// them: consensus not available (FZW-WEB-09), a score that cannot be
// computed (FZW-WEB-06), no news (FZW-WEB-11), no documents (FZW-WEB-12),
// the watchlist button off and on (FZW-WEB-08). The API is a mock.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Api } from "@/lib/api";
import { TestAppProvider } from "@/lib/app";
import type { Consensus, Scores, StockHeader } from "@/lib/types";
import { ConsensusCard } from "./Consensus";
import { ScoresView } from "./tabs/ScoresTab";
import { NewsTab } from "./tabs/NewsTab";
import { ReportsTab } from "./tabs/ReportsTab";
import { WatchButton, useWatch } from "./WatchButton";

function mockApi(routes: Record<string, unknown>, post: unknown = null): Api & { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; del: ReturnType<typeof vi.fn> } {
  const get = vi.fn(async (path: string) => {
    if (path in routes) return routes[path];
    throw new Error(`unexpected GET ${path}`);
  });
  return {
    get,
    post: vi.fn(async () => post),
    del: vi.fn(async () => null),
    blob: vi.fn(async () => new Blob()),
  } as never;
}

const NVDA: StockHeader = {
  id: 42,
  symbol: "NVDA",
  name: "Nvidia Corp",
  exchange: "Nasdaq",
  currency: "USD",
  last_price: 221.3,
  day_change_percent: -3.16,
  quoted_at: "2026-11-13T21:00:00Z",
  is_us: true,
  logo_url: null,
};

const CONSENSUS: Consensus = {
  symbol: "NVDA",
  analyst_count: 25,
  distribution: { strong_buy: 4, buy: 14, hold: 6, sell: 1, strong_sell: 0 },
  price_target: { consensus: 212.4, low: 160, high: 275, currency: "USD" },
  analysts: [{ firm: "Cantor Fitzgerald", rating: "buy", price_target: 275, rated_at: "2026-11-12" }],
};

function wrap(ui: React.ReactNode, api: Api, lang: "it" | "en" = "it") {
  return render(<TestAppProvider api={api} lang={lang}>{ui}</TestAppProvider>);
}

describe("ConsensusCard (FZW-WEB-09)", () => {
  it("says the consensus is not available for a stock Benzinga does not cover", () => {
    wrap(<ConsensusCard load={{ status: "ready", data: null }} price={221.3} currency="USD" />, mockApi({}));
    expect(screen.getByText("Consenso degli analisti non disponibile per questo titolo.")).toBeTruthy();
    expect(screen.getByText("Fonte: Benzinga")).toBeTruthy();
    expect(screen.queryByText("Acquisto")).toBeNull();
  });

  it("shows the three counts, the analyst count and the targets when covered", () => {
    wrap(<ConsensusCard load={{ status: "ready", data: CONSENSUS }} price={221.3} currency="USD" />, mockApi({}));
    expect(screen.getByTestId("count-buy").textContent).toBe("18");
    expect(screen.getByTestId("count-hold").textContent).toBe("6");
    expect(screen.getByTestId("count-sell").textContent).toBe("1");
    expect(screen.getByText("Basato su 25 analisti")).toBeTruthy();
    expect(screen.getAllByText("$275,00").length).toBeGreaterThan(0);
    expect(screen.getByText("Cantor Fitzgerald")).toBeTruthy();
  });
});

describe("ScoresView (FZW-WEB-06)", () => {
  const computed = { computable: true as const, reason: null, fiscal_date: "2026-01-25" };

  it("says a score is not computable when annual statements are missing", () => {
    const scores: Scores = {
      symbol: "NVDA",
      fiscal_date: "2026-01-25",
      currency: "USD",
      computed_at: null,
      piotroski: { ...computed, score: 7, max: 9, criteria: [{ key: "roa_positive", passed: true, value: 0.65, compared_to: 0 }] },
      altman: { computable: false, reason: "missing_fields", missing: ["assets.total_assets"], score: null },
      beneish: { ...computed, score: -2.41, threshold: -1.78, above_threshold: false },
    };
    wrap(<ScoresView scores={scores} />, mockApi({}));
    expect(screen.getByText("Non calcolabile: mancano i bilanci annuali che la formula richiede.")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getAllByText("Sotto la soglia di −1,78").length).toBeGreaterThan(0);
  });

  it("shows one line for a financial-sector company", () => {
    const na = { computable: false as const, reason: "financial_sector", missing: [], score: null };
    const scores: Scores = { symbol: "JPM", fiscal_date: null, currency: "USD", computed_at: null, piotroski: na, altman: na, beneish: na };
    wrap(<ScoresView scores={scores} />, mockApi({}));
    expect(screen.getByText("Per le aziende del settore finanziario i tre punteggi non si applicano.")).toBeTruthy();
    expect(screen.queryByText("Piotroski F-Score")).toBeNull();
  });
});

describe("NewsTab (FZW-WEB-11)", () => {
  it("says there is no news for a stock with no linked article", async () => {
    const api = mockApi({ "/blogs": [] });
    wrap(<NewsTab stock={NVDA} />, api);
    expect(await screen.findByText("Nessuna notizia per questo titolo")).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith("/blogs", expect.objectContaining({ azione: 42 }));
  });
});

describe("NewsTab without the azione id", () => {
  it("shows an error, never «no news», when the header has no id", async () => {
    const api = mockApi({});
    wrap(<NewsTab stock={{ ...NVDA, id: null }} />, api);
    expect(await screen.findByText("Non è stato possibile caricare")).toBeTruthy();
    expect(screen.queryByText("Nessuna notizia per questo titolo")).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
  });
});

describe("ReportsTab (FZW-WEB-12)", () => {
  it("says there are no documents for a stock without reports or 10-K", async () => {
    wrap(<ReportsTab stock={{ ...NVDA, symbol: "TSM", is_us: true }} />, mockApi({ "/dashboard/stocks/TSM/documents": [] }));
    expect(await screen.findByText("Nessun documento per questo titolo")).toBeTruthy();
    expect(screen.getByText("Per questo titolo non ci sono report né documenti 10-K.")).toBeTruthy();
  });
});

describe("WatchButton (FZW-WEB-08)", () => {
  it("draws the off and on states", () => {
    const { rerender } = wrap(<WatchButton on={false} saving={false} onToggle={() => undefined} />, mockApi({}));
    const off = screen.getByRole("button", { name: "Aggiungi agli osservati" });
    expect(off.getAttribute("aria-pressed")).toBe("false");
    rerender(
      <TestAppProvider api={mockApi({})}>
        <WatchButton on saving={false} onToggle={() => undefined} />
      </TestAppProvider>,
    );
    const on = screen.getByRole("button", { name: "Negli osservati" });
    expect(on.getAttribute("aria-pressed")).toBe("true");
  });

  function Harness({ stock }: { stock: StockHeader }) {
    const w = useWatch(stock);
    return <WatchButton on={w.on} saving={w.saving} disabled={w.disabled} onToggle={w.toggle} />;
  }

  it("adds the stock to the account's watchlist and confirms with a toast", async () => {
    const api = mockApi({ "/watch-aziones": [] }, { id: 42, symbol: "NVDA" });
    wrap(<Harness stock={NVDA} />, api);
    const button = await screen.findByRole("button", { name: "Aggiungi agli osservati" });
    await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
    fireEvent.click(button);
    expect(await screen.findByRole("button", { name: "Negli osservati" })).toBeTruthy();
    expect(api.post).toHaveBeenCalledWith("/watch-aziones", { azione_id: 42 });
  });

  it("removes a stock that is already in the watchlist", async () => {
    const api = mockApi({ "/watch-aziones": [{ id: 42, symbol: "NVDA", name: "Nvidia Corp" }] });
    wrap(<Harness stock={NVDA} />, api);
    const button = await screen.findByRole("button", { name: "Negli osservati" });
    fireEvent.click(button);
    expect(await screen.findByRole("button", { name: "Aggiungi agli osservati" })).toBeTruthy();
    expect(api.del).toHaveBeenCalledWith("/watch-aziones/42");
  });
});
