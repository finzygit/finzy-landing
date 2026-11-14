import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { RevenueView } from "./RevenueView";
import { ALL, fakeApi, withConsole } from "./testkit";
import type { Revenue } from "./types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ricavi",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function revenue(over: Partial<Revenue> = {}): Revenue {
  return {
    month: "2026-11",
    first_month: "2026-06",
    last_month: "2026-11",
    updated_at: "2026-11-28T09:40:00+01:00",
    totals: { gross: 820.64, commission: 123.12, tax: 146.66, net: 550.86, payments: 31, refunds: 2, refunds_gross: -63.67 },
    previous: { month: "2026-10", net: 490.34 },
    trend: Array.from({ length: 12 }, (_, i) => ({ month: `${i < 1 ? 2025 : 2026}-${String(((i + 11) % 12) + 1).padStart(2, "0")}`, net: 100 + i * 20 })),
    by_plan: [{ label: "Premium", net: 30, share: 0.05 }, { label: "Unlimited", net: 520.86, share: 0.95 }],
    by_platform: [{ label: "Android", net: 190.63, share: 0.35 }, { label: "iOS", net: 360.23, share: 0.65 }],
    filters: { plans: ["Premium", "Unlimited"], platforms: ["Android", "iOS"] },
    counts: { all: 33, payments: 31, refunds: 2 },
    rows: [
      { user: { id: 7, name: "Giulia Bianchi" }, plan: "Unlimited", cadence: "monthly", platform: "iOS", at: "2026-11-28T09:00:00+01:00", kind: "payment", currency: "EUR", paid: 9.99, gross: 11.59, net: 7.76 },
      { user: { id: 8, name: "Chiara Moretti" }, plan: "Premium", cadence: "annual", platform: "Android", at: "2026-11-23T10:31:00+01:00", kind: "refund", currency: "EUR", paid: -49.9, gross: -57.88, net: -38.76 },
      { user: null, plan: "Unlimited", cadence: "monthly", platform: "Android", at: "2026-11-19T14:23:00+01:00", kind: "payment", currency: "GBP", paid: 8.99, gross: 12.05, net: 8.23 },
    ],
    total: 33,
    filtered_net: 550.86,
    page: 1,
    per_page: 50,
    can_export: true,
    ...over,
  };
}

describe("RevenueView", () => {
  it("shows the KPIs, the trend, the breakdown and rows that link to the user page", async () => {
    const api = fakeApi({ get: () => revenue() });
    withConsole(api, <RevenueView />);

    expect(await screen.findByText("$820,64")).toBeTruthy();
    expect(screen.getByText("$550,86")).toBeTruthy();
    expect(screen.getByText("+12,34%")).toBeTruthy();
    expect(screen.getByText("Aggiornato il 28/11/2026 alle 09:40")).toBeTruthy();
    expect(screen.getByText("−$63,67 lordo")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Pagamenti e rimborsi di novembre" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Netto, ultimi 12 mesi" })).toBeTruthy();

    const table = screen.getByRole("table", { name: "Pagamenti e rimborsi di novembre" });
    await waitFor(() => expect(within(table).getByRole("link", { name: "Giulia Bianchi" }).getAttribute("href")).toBe("/utenti/scheda?id=7"));
    expect(within(table).getByText("Account eliminato")).toBeTruthy();
    expect(within(table).getByText("−€ 49,90")).toBeTruthy();
    expect(within(table).getByText("£ 8,99")).toBeTruthy();
    expect(within(table).getByText("28/11 09:00")).toBeTruthy();
    expect(within(table).getAllByText("annuale").length).toBe(1);
    expect(document.body.textContent).not.toContain("@");
    expect(api.get).toHaveBeenCalledWith("/revenue", expect.objectContaining({ month: undefined, kind: "", page: 1 }));
  });

  it("filters on the server and offers the filtered export", async () => {
    const api = fakeApi({ get: (_p, q) => ((q as { kind: string }).kind === "refund" ? revenue({ total: 2, filtered_net: -42.64, rows: revenue().rows.slice(1, 2) }) : revenue()) });
    withConsole(api, <RevenueView />);
    fireEvent.click(await screen.findByRole("button", { name: /Rimborsi/ }));

    expect(await screen.findByText("2 righe · Netto −$42,64")).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith("/revenue", expect.objectContaining({ kind: "refund", page: 1 }));
    expect(screen.getByRole("button", { name: /Esporta 2 righe/ })).toBeTruthy();
  });

  it("exports the CSV through the API and says where the file is", async () => {
    const api = fakeApi({ get: () => revenue(), blob: () => new Blob(["a,b"]) });
    URL.createObjectURL = vi.fn(() => "blob:x");
    withConsole(api, <RevenueView />);
    const btn = await screen.findByRole("button", { name: /Esporta CSV/ });
    fireEvent.click(btn);

    await waitFor(() => expect(api.blob).toHaveBeenCalledWith("/revenue/export.csv", expect.objectContaining({ month: "2026-11" })));
  });

  it("hides the export from a role without it", async () => {
    const api = fakeApi({ get: () => revenue({ can_export: false }) }, ALL.filter((p) => p !== "console.revenue.export"));
    withConsole(api, <RevenueView />);
    await screen.findByText("$820,64");

    expect(screen.queryByRole("button", { name: /Esporta/ })).toBeNull();
  });

  it("moves between months and resets the filters", async () => {
    const api = fakeApi({ get: (_p, q) => revenue({ month: (q as { month?: string }).month ?? "2026-11" }) });
    withConsole(api, <RevenueView />);
    fireEvent.click(await screen.findByRole("button", { name: "Mese precedente" }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/revenue", expect.objectContaining({ month: "2026-10", kind: "" })));
    expect(screen.getByRole("button", { name: "Mese successivo" })).toBeTruthy();
  });

  it("an empty month says so, an error offers Riprova", async () => {
    let fail = true;
    const api = fakeApi({
      get: () => {
        if (fail) throw new ApiError(500, null);
        return revenue({ counts: { all: 0, payments: 0, refunds: 0 }, rows: [], total: 0, totals: { gross: 0, commission: 0, tax: 0, net: 0, payments: 0, refunds: 0, refunds_gross: 0 } });
      },
    });
    withConsole(api, <RevenueView />);
    expect(await screen.findByText("Non è stato possibile caricare i ricavi")).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));

    expect(await screen.findByText("Nessun pagamento a novembre")).toBeTruthy();
  });
});
