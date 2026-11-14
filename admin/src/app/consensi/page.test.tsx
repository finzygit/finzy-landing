import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REPORTS_ADMIN, fakeApi, me, renderPage } from "@/components/ai-reports/testing";
import { ApiError } from "@/lib/api";
import ConsentsPage from "./page";

const nav = vi.hoisted(() => ({ pathname: "/consensi", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(),
}));

const register = {
  rows: [
    { id: 1, user_id: 18, email: "giulia.bianchi@example.com", version: 1, os: "iOS", accepted_at: "2026-11-11T19:16:00Z" },
    { id: 2, user_id: null, email: null, version: 1, os: "iOS", accepted_at: "2026-09-30T11:12:00Z" },
  ],
  total: 10, page: 1, per_page: 50, with_email: 9, versions: [1],
};

describe("Consensi", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:csv");
    URL.revokeObjectURL = vi.fn();
  });

  it("a role with «Report AI» but not super admin sees why, and the register is never asked for", async () => {
    const { api, get } = fakeApi({}, me(REPORTS_ADMIN, { id: 4, key: "Amministratore", label: "Amministratore" }));
    renderPage(<ConsentsPage />, api);
    await screen.findByText("Il registro dei consensi lo vede solo il super amministratore");
    expect(get).not.toHaveBeenCalledWith("/portfolio-consents", expect.anything());
  });

  it("the super admin reads the register; a deleted account has no email", async () => {
    const { api } = fakeApi({ "/portfolio-consents": register });
    renderPage(<ConsentsPage />, api);
    await screen.findByText("giulia.bianchi@example.com");
    expect(screen.getByText("giulia.bianchi@example.com").getAttribute("href")).toBe("/utenti/scheda?id=18");
    expect(screen.getByText("Account eliminato")).toBeTruthy();
    expect(screen.getByText("10 consensi · tutti alla versione 1 dell’avviso")).toBeTruthy();
    expect(screen.getByText("11/11/2026, 20:16")).toBeTruthy();
  });

  it("export asks first, says what the file holds, downloads and confirms", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const { api, blob } = fakeApi({ "/portfolio-consents": register }, undefined, { "/portfolio-consents.csv": new Blob(["Email"]) });
    renderPage(<ConsentsPage />, api);
    await screen.findByText("giulia.bianchi@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Esporta CSV" }));
    expect(screen.getByText("Esportare i consensi?")).toBeTruthy();
    expect(screen.getByText(/Il file ha 10 righe, con i filtri di adesso, e le email di 9 utenti/)).toBeTruthy();
    expect(blob).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Esporta" }));
    await screen.findByText("File pronto");
    expect(blob).toHaveBeenCalledWith("/portfolio-consents.csv", expect.objectContaining({ q: "" }));
    expect(click).toHaveBeenCalled();
    expect(screen.getByText(/consensi-portfolio-\d{4}-\d{2}-\d{2}\.csv · 10 righe/)).toBeTruthy();
  });

  it("a failed export keeps the dialog with the error", async () => {
    const { api } = fakeApi({ "/portfolio-consents": register }, undefined, { "/portfolio-consents.csv": new ApiError(500, null) });
    renderPage(<ConsentsPage />, api);
    await screen.findByText("giulia.bianchi@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Esporta CSV" }));
    fireEvent.click(screen.getByRole("button", { name: "Esporta" }));
    await screen.findByText("Esportazione non riuscita. Riprova.");
    expect(screen.getByText("Esportare i consensi?")).toBeTruthy();
  });

  it("a search with no hit names it; the backend's 403 shows the denied state", async () => {
    const { api, get } = fakeApi({ "/portfolio-consents": (q?: Record<string, unknown>) => (q?.q ? { ...register, rows: [], total: 0, with_email: 0 } : register) });
    renderPage(<ConsentsPage />, api);
    await screen.findByText("giulia.bianchi@example.com");
    fireEvent.change(screen.getByLabelText("Cerca per email"), { target: { value: "zzz" } });
    await screen.findByText("Nessun consenso con «zzz»", undefined, { timeout: 2000 });
    expect(get).toHaveBeenCalledWith("/portfolio-consents", expect.objectContaining({ q: "zzz" }));

    const denied = fakeApi({ "/portfolio-consents": new ApiError(403, "forbidden") });
    renderPage(<ConsentsPage />, denied.api);
    await waitFor(() => expect(screen.getAllByText("Il registro dei consensi lo vede solo il super amministratore").length).toBeGreaterThan(0));
  });
});
