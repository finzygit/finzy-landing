import { describe, expect, it } from "vitest";
import {
  dateTime, dayAt, delDay, freshness, generationNext, listLabel, longPortfolioReason, marketCap, pct, period, previewDocument, reportNext, shortPortfolioReason,
  type Generation, type ReportDetail,
} from "./ai-reports";

describe("ai-reports words", () => {
  it("dates are Rome time, Italian style", () => {
    expect(dateTime("2026-11-13T05:01:00Z")).toBe("13/11/2026, 06:01");
    expect(dateTime(null)).toBe("—");
    expect(dayAt("2026-12-01T03:30:00+01:00")).toBe("1° dicembre alle 03:30");
    expect(delDay("08/11")).toBe("dell’08/11");
    expect(delDay("25/10")).toBe("del 25/10");
  });

  it("money, weights and periods", () => {
    expect(marketCap(4410.2e9, "US")).toBe("$4.410,2 Mld");
    expect(marketCap(268.1e9, "EU")).toBe("€268,1 Mld");
    expect(marketCap(null, "US")).toBe("—");
    expect(pct(40)).toBe("40%");
    expect(pct(39.5)).toBe("39,5%");
    expect(period({ type: "10k", fiscal_year: 2026, filing_date: "2026-02-26" })).toBe("FY2026 · 10-K del 26/02/2026");
    expect(period({ type: "deck", fiscal_year: 2025, filing_date: null })).toBe("FY2025");
    expect(period({ type: "deck", fiscal_year: null, filing_date: null })).toBe("—");
  });

  it("the instrument list of a generation", () => {
    expect(listLabel({ list: "2026-09-v1", risk_date: "2026-11-08" })).toBe("set 2026 · rischio dell’08/11");
    expect(listLabel({ list: "2026-09-v1", risk_date: "2026-11-08" }, true)).toBe("elenco strumenti di settembre, rischio dell’08/11");
    expect(listLabel({ list: "2026-09-v1", risk_date: null })).toBe("set 2026");
  });

  it("a failed generation in a row and in a sentence", () => {
    const r = { code: "weight_sum" as const, category: "stocks", sum: 55, expected: 50 };
    expect(shortPortfolioReason(r)).toBe("Azioni al 55% invece di 50%");
    expect(longPortfolioReason(r)).toBe("Il modello ha dato alle azioni pesi che sommano 55% invece di 50%: il controllo prima della pubblicazione l’ha fermata.");
    expect(longPortfolioReason({ code: "generic" })).toBe("La generazione si è interrotta senza un motivo preciso.");
    const g = { name: "Growth", failure: { reason: r, technical: "x", first: true, app_had: null, next_published: { id: 9, published_at: "2026-11-14T03:30:00Z" } } } as unknown as Generation;
    expect(generationNext(g)).toBe("Era la prima generazione di Growth: l’app non mostrava ancora questo portafoglio. Il tentativo successivo, alle 04:30, è stato pubblicato.");
  });

  it("what the app keeps after a failed report", () => {
    const base = { type: "10k", failure: { reason: "credit", technical: "x", app_keeps: { id: 1, filing_date: "2025-06-20", generated_at: null } } } as unknown as ReportDetail;
    expect(reportNext(base)).toBe("Nell’app resta l’analisi precedente, sul 10-K del 20/06/2025. Rigenerarla è una chiamata AI a pagamento: dal pannello non si fa.");
    expect(reportNext({ ...base, failure: { ...base.failure!, app_keeps: null } })).toBe("Nell’app questo titolo resta senza analisi del 10-K.");
  });

  it("freshness says today or the day", () => {
    const now = new Date("2026-11-14T10:00:00Z");
    expect(freshness("2026-11-14T04:45:00Z", now)).toBe("Calcolata oggi alle 05:45 · si ricalcola ogni notte");
    expect(freshness("2026-11-13T04:45:00Z", now)).toBe("Calcolata il 13/11 alle 05:45 · si ricalcola ogni notte");
  });

  it("the preview document loads and runs nothing", () => {
    const doc = previewDocument("<p>Ciao</p>", "it");
    expect(doc).toContain(`content="default-src 'none'; style-src 'unsafe-inline'"`);
    expect(doc).toContain('<html lang="it">');
    expect(doc).toContain("<body><p>Ciao</p></body>");
  });
});
