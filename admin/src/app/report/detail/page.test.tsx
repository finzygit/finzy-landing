import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REPORTS_ADMIN, fakeApi, me, renderPage } from "@/components/ai-reports/testing";
import { ApiError } from "@/lib/api";
import ReportPage from "./page";

const nav = vi.hoisted(() => ({ pathname: "/report/detail", search: "id=3", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const base = {
  id: 3, symbol: "NVDA", name: "NVIDIA Corporation", type: "10k", status: "completed", fiscal_year: 2026, filing_date: "2026-02-26",
  generated_at: "2026-11-12T03:41:00+00:00", tried_at: "2026-11-12T03:41:00+00:00", reason: null, azione_id: 44, title: "Analisi NVDA",
  filing: { accession: "0001045810-26-000012", date: "2026-02-26" }, provider: "anthropic", model: "claude-sonnet-5", has_pdf: false,
  preview: { kind: "html", languages: ["it", "en"], html: { it: "<h2>Ricavi</h2><p>Italiano</p>", en: "<h2>Revenue</h2><p>English</p>" } },
  failure: null,
};

describe("Report page", () => {
  beforeEach(() => {
    nav.search = "id=3";
  });

  it("puts the 10-K analysis in a sandboxed frame with its own CSP, Italian first, with IT/EN", async () => {
    const { api } = fakeApi({ "/reports/3": base }, me([...REPORTS_ADMIN, "console.stocks.view"]));
    renderPage(<ReportPage />, api);
    const frame = (await screen.findByTitle("Anteprima: Analisi NVDA")) as HTMLIFrameElement;
    expect(frame.getAttribute("sandbox")).toBe("");
    expect(frame.getAttribute("srcdoc")).toContain("default-src 'none'");
    expect(frame.getAttribute("srcdoc")).toContain("<p>Italiano</p>");
    expect(screen.getByText("NVDA · Analisi del 10-K")).toBeTruthy();
    expect(screen.getByText("10-K del 26/02/2026 · 0001045810-26-000012")).toBeTruthy();
    expect(screen.getByText("Anthropic · claude-sonnet-5")).toBeTruthy();
    expect(screen.getByText("Italiano e inglese")).toBeTruthy();
    expect(screen.getByText("Scheda del titolo").closest("a")?.getAttribute("href")).toBe("/stocks/detail?id=44");
    expect(screen.queryByText("Scarica PDF")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(frame.getAttribute("srcdoc")).toContain("<p>English</p>");
  });

  it("a deck shows its PDF from the API and downloads it", async () => {
    const pdf = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    const deck = { ...base, type: "deck", has_pdf: true, preview: { kind: "pdf", languages: [], html: null }, title: "XOM Financial Report", symbol: "XOM", fiscal_year: null };
    URL.createObjectURL = vi.fn(() => "blob:pdf");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const { api, blob } = fakeApi({ "/reports/3": deck }, undefined, { "/reports/3/pdf": pdf });
    renderPage(<ReportPage />, api);
    const frame = (await screen.findByTitle("Anteprima: XOM Financial Report")) as HTMLIFrameElement;
    expect(frame.getAttribute("src")).toBe("blob:pdf");
    expect(screen.queryByText("Isolata dal pannello: nessuno script del documento viene eseguito")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Scarica PDF" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(blob).toHaveBeenCalledWith("/reports/3/pdf");
  });

  it("a failed report says why, what the app keeps, folds the technical text and offers no retry", async () => {
    const failed = {
      ...base, status: "failed", fiscal_year: null, reason: "credit", preview: { kind: "none", languages: [], html: null },
      failure: { reason: "credit", technical: "OpenAI error: You have no credits remaining.", app_keeps: { id: 2, filing_date: "2025-06-20", generated_at: null } },
    };
    const { api, writes } = fakeApi({ "/reports/3": failed });
    renderPage(<ReportPage />, api);
    await screen.findByText("Il report non è stato generato");
    expect(screen.getByText("Il fornitore AI ha rifiutato la richiesta: credito esaurito.")).toBeTruthy();
    expect(screen.getByText(/Nell’app resta l’analisi precedente, sul 10-K del 20\/06\/2025/)).toBeTruthy();
    expect(screen.queryByText("OpenAI error: You have no credits remaining.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dettaglio tecnico" }));
    expect(screen.getByText("OpenAI error: You have no credits remaining.")).toBeTruthy();
    expect(screen.getByText("Tentato il")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Rigenera|Riprova/ })).toBeNull();
    expect(writes).not.toHaveBeenCalled();
  });

  it("an archived report says so; a report without text or PDF says there is no preview", async () => {
    const archived = { ...base, type: "cum", status: "archived", preview: { kind: "none", languages: [], html: null } };
    const { api } = fakeApi({ "/reports/3": archived });
    renderPage(<ReportPage />, api);
    await screen.findByText("Archiviato: è un tipo di report che l’app non mostra più. Resta qui per consultazione.");
    expect(screen.getByText("Nessuna anteprima per questo report")).toBeTruthy();
  });

  it("a missing report", async () => {
    const { api } = fakeApi({ "/reports/3": new ApiError(404, "not_found") });
    renderPage(<ReportPage />, api);
    await screen.findByText("Report non trovato");
    expect(screen.getByText("Torna ai report").getAttribute("href")).toBe("/report");
  });
  it("«Scheda del titolo» shows only to who can open «Titoli»", async () => {
    const { api } = fakeApi({ "/reports/3": base });
    renderPage(<ReportPage />, api);
    await screen.findByTitle("Anteprima: Analisi NVDA");
    expect(screen.queryByText("Scheda del titolo")).toBeNull();
  });
});
