import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeApi, me, renderPage } from "@/components/ai-reports/testing";
import { ConsoleProvider } from "@/lib/console";
import ReportsPage from "./page";

const nav = vi.hoisted(() => ({ pathname: "/report", search: "", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const coverage = {
  regions: {
    US: { size: 100, complete: 98, incomplete: 0, no_filing: 2, snapshot_date: "2026-11-14" },
    EU: { size: 100, complete: 0, incomplete: 0, no_filing: 100, snapshot_date: "2026-11-14" },
  },
  target: { US: 100, EU: 100 },
  computed_at: "2026-11-14T04:45:00+00:00",
};
const row = (id: number, symbol: string, extra: object = {}) => ({
  id, symbol, name: `${symbol} Inc.`, type: "deck", status: "completed", fiscal_year: 2025, filing_date: null,
  generated_at: "2026-11-13T05:01:00+00:00", tried_at: "2026-11-13T05:01:00+00:00", reason: null, ...extra,
});
const reports = {
  rows: [row(1, "XOM"), row(2, "ORCL", { type: "10k", status: "failed", fiscal_year: null, reason: "credit" })],
  total: 214, page: 1, per_page: 25, counts: { all: 214, completed: 167, failed: 11, archived: 36 },
};
const members = {
  rows: [{ rank: 41, symbol: "SPOT", name: "Spotify Technology S.A.", exchange: "XNYS", market_cap: 112.4e9, region: "US", group: "no_filing", filing_type: "10-K",
    filing_period: null, report_status: null, reason: "us_not_synced", scope: "in_scope", azione_id: 5, report_id: null }],
  total: 1, page: 1, per_page: 25,
};

describe("Report e copertura", () => {
  beforeEach(() => {
    nav.search = "";
    nav.replace.mockReset();
    nav.push.mockReset();
  });

  it("shows the coverage, the status tabs with counts and a failure reason under the ticker", async () => {
    const { api, get, writes } = fakeApi({ "/report-coverage": coverage, "/reports": reports });
    renderPage(<ReportsPage />, api);
    await screen.findByText("XOM");
    expect(screen.getByRole("button", { name: "Stati Uniti: Coperti 98" })).toBeTruthy();
    expect(screen.getByText("I documenti delle società europee non sono ancora collegati: per ora l’Europa non ha report.")).toBeTruthy();
    const tabs = screen.getByRole("tablist", { name: "Stato dei report" });
    expect(within(tabs).getByRole("tab", { name: "Non riusciti 11" })).toBeTruthy();
    expect(screen.getByText("Il fornitore AI ha rifiutato la richiesta: credito esaurito.")).toBeTruthy();
    expect(screen.getByText("1–25 di 214 report")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Rigenera|Riprova la generazione/ })).toBeNull();

    fireEvent.click(within(tabs).getByRole("tab", { name: "Non riusciti 11" }));
    await waitFor(() => expect(get).toHaveBeenCalledWith("/reports", expect.objectContaining({ status: "failed", page: 1 })));
    await screen.findByText("Tentato il");

    fireEvent.click(screen.getByText("XOM"));
    expect(nav.push).toHaveBeenCalledWith("/report/scheda?id=1");
    expect(writes).not.toHaveBeenCalled();
  });

  it("a coverage counter opens «Universo» with that region and group", async () => {
    const { api, get } = fakeApi({ "/report-coverage": coverage, "/reports": reports, "/report-coverage/members": members });
    const view = renderPage(<ReportsPage />, api);
    fireEvent.click(await screen.findByRole("button", { name: "Stati Uniti: Senza documento 2" }));
    expect(nav.replace).toHaveBeenCalledWith("/report?tab=universo");
    nav.search = "tab=universo";
    view.rerender(<ConsoleProvider api={api}><ReportsPage /></ConsoleProvider>);
    await screen.findByText("SPOT");
    expect(get).toHaveBeenCalledWith("/report-coverage/members", expect.objectContaining({ region: "US", group: "no_filing", scope: "in_scope" }));
    expect(screen.getByText("10-K non ancora scaricato dalla SEC")).toBeTruthy();
    expect(screen.getByText("$112,4 Mld")).toBeTruthy();
  });

  it("an empty universe and no report yet say when they arrive", async () => {
    const { api } = fakeApi({
      "/report-coverage": { regions: { US: { size: 0, complete: 0, incomplete: 0, no_filing: 0, snapshot_date: null } }, target: { US: 100 }, computed_at: null },
      "/reports": { rows: [], total: 0, page: 1, per_page: 25, counts: { all: 0, completed: 0, failed: 0, archived: 0 } },
    });
    renderPage(<ReportsPage />, api);
    await screen.findByText("Ancora nessun report");
    expect(screen.getByText("L’universo non è ancora stato calcolato")).toBeTruthy();
  });

  it("errors say so and offer Riprova", async () => {
    const { ApiError } = await import("@/lib/api");
    const { api } = fakeApi({ "/report-coverage": new ApiError(500, null), "/reports": new ApiError(500, null) });
    renderPage(<ReportsPage />, api);
    await screen.findByText("Non è stato possibile caricare i report");
    expect(screen.getByText("Copertura non disponibile.")).toBeTruthy();
  });

  it("a role without «Report AI» sees the shell's denied state, not the page", async () => {
    const { api, get } = fakeApi({}, me(["console.home.view"], { id: 3, key: "Supporto", label: "Supporto" }));
    renderPage(<ReportsPage />, api);
    await screen.findByText("Non hai accesso a questa pagina");
    expect(get).not.toHaveBeenCalledWith("/reports", expect.anything());
  });
});
