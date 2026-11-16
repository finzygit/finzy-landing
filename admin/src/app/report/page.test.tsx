import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REPORTS_ADMIN, fakeApi, me, renderPage } from "@/components/ai-reports/testing";
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
  total: 214, page: 1, per_page: 25, counts: { all: 214, completed: 167, failed: 11, archived: 36, pending: 0 },
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
    expect(nav.push).toHaveBeenCalledWith("/report/detail?id=1");
    expect(writes).not.toHaveBeenCalled();
  });

  it("a coverage counter opens «Universo» with that region and group", async () => {
    const { api, get } = fakeApi({ "/report-coverage": coverage, "/reports": reports, "/report-coverage/members": members });
    const view = renderPage(<ReportsPage />, api);
    fireEvent.click(await screen.findByRole("button", { name: "Stati Uniti: Senza documento 2" }));
    expect(nav.replace).toHaveBeenCalledWith("/report?tab=universe");
    nav.search = "tab=universe";
    view.rerender(<ConsoleProvider api={api}><ReportsPage /></ConsoleProvider>);
    await screen.findByText("SPOT");
    expect(get).toHaveBeenCalledWith("/report-coverage/members", expect.objectContaining({ region: "US", group: "no_filing", scope: "in_scope" }));
    expect(screen.getByText("10-K non ancora scaricato dalla SEC")).toBeTruthy();
    expect(screen.getByText("$112,4 Mld")).toBeTruthy();
  });

  it("the Universo selects filter region and coverage each on its own", async () => {
    nav.search = "tab=universe";
    const { api, get } = fakeApi({ "/report-coverage": coverage, "/reports": reports, "/report-coverage/members": members });
    renderPage(<ReportsPage />, api);
    await screen.findByText("SPOT");
    fireEvent.change(screen.getByRole("combobox", { name: "Regione" }), { target: { value: "EU" } });
    await waitFor(() => expect(get).toHaveBeenLastCalledWith("/report-coverage/members", expect.objectContaining({ region: "EU", group: "" })));
    expect((screen.getByRole("combobox", { name: "Copertura" }) as HTMLSelectElement).value).toBe("");
    fireEvent.change(screen.getByRole("combobox", { name: "Regione" }), { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Copertura" }), { target: { value: "no_filing" } });
    await waitFor(() => expect(get).toHaveBeenLastCalledWith("/report-coverage/members", expect.objectContaining({ region: "", group: "no_filing" })));
    expect((screen.getByRole("combobox", { name: "Regione" }) as HTMLSelectElement).value).toBe("");
  });

  it("a coverage counter clicked on page 2 of «Universo» starts again from page 1", async () => {
    nav.search = "tab=universe";
    const { api, get } = fakeApi({ "/report-coverage": coverage, "/reports": reports, "/report-coverage/members": { ...members, total: 60 } });
    renderPage(<ReportsPage />, api);
    await screen.findByText("SPOT");
    fireEvent.click(screen.getByRole("button", { name: "Pagina successiva" }));
    await waitFor(() => expect(get).toHaveBeenLastCalledWith("/report-coverage/members", expect.objectContaining({ page: 2 })));
    fireEvent.click(screen.getByRole("button", { name: "Stati Uniti: Senza documento 2" }));
    await waitFor(() => expect(get).toHaveBeenLastCalledWith("/report-coverage/members", expect.objectContaining({ region: "US", group: "no_filing", page: 1 })));
  });

  it("a universe row opens its report through a link; a row without a report is not clickable", async () => {
    nav.search = "tab=universe";
    const withReport = { ...members.rows[0], symbol: "AAPL", group: "complete", report_status: "generated", reason: null, azione_id: 6, report_id: 9 };
    const { api } = fakeApi({ "/report-coverage": coverage, "/reports": reports, "/report-coverage/members": { ...members, rows: [withReport, members.rows[0]], total: 2 } });
    renderPage(<ReportsPage />, api);
    await screen.findByText("SPOT");
    expect(screen.getByText("AAPL").closest("a")?.getAttribute("href")).toBe("/report/detail?id=9");
    expect(screen.getByText("SPOT").closest("a")).toBeNull();
    expect(screen.getByText("SPOT").closest("tr")?.getAttribute("tabindex")).toBeNull();
  });

  it("the link to «Costi e servizi» shows only to who can open it", async () => {
    const first = fakeApi({ "/report-coverage": coverage, "/reports": reports });
    const view = renderPage(<ReportsPage />, first.api);
    await screen.findByText("XOM");
    expect(screen.queryByText("Quanto costano: Costi e servizi")).toBeNull();
    view.unmount();
    const second = fakeApi({ "/report-coverage": coverage, "/reports": reports }, me([...REPORTS_ADMIN, "console.spend.view"]));
    renderPage(<ReportsPage />, second.api);
    await screen.findByText("XOM");
    expect(screen.getByText("Quanto costano: Costi e servizi").closest("a")?.getAttribute("href")).toBe("/spend");
  });

  it("an empty universe and no report yet say when they arrive", async () => {
    const { api } = fakeApi({
      "/report-coverage": { regions: { US: { size: 0, complete: 0, incomplete: 0, no_filing: 0, snapshot_date: null } }, target: { US: 100 }, computed_at: null },
      "/reports": { rows: [], total: 0, page: 1, per_page: 25, counts: { all: 0, completed: 0, failed: 0, archived: 0, pending: 0 } },
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
