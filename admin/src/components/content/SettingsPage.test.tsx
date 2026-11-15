import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AppSettings } from "@/lib/content/types";
import { SettingsPage, validUrl } from "./SettingsPage";
import { EDITOR, READER, fakeApi, renderPage } from "./testkit";

vi.mock("next/navigation", () => ({
  usePathname: () => "/content/settings",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const std = (v: string) => ({ value: v, default: v, custom: false });
const DATA: AppSettings = {
  maintenance: { on: false, since: null, by: null },
  legal: [
    { key: "privacy_url", version: "2026-10-07", links: { it: std("https://www.iubenda.com/privacy-policy/68699235"), en: std("https://www.iubenda.com/privacy-policy/58107777") } },
    { key: "terms_url", version: "2026-10-23", links: { it: std("https://console.finzyapp.com/eula-it.html"), en: std("https://console.finzyapp.com/eula.html") } },
  ],
  ask_review: false,
  ask_review_android: true,
  min_version: 58,
  last_change: null,
};

describe("Impostazioni app", () => {
  it("turning maintenance on asks first and then applies at once", async () => {
    const fake = fakeApi(EDITOR, { "GET /app-settings": DATA, "PUT /app-settings": { ...DATA, maintenance: { on: true, since: "2026-11-14T21:30:00+01:00", by: "Marta Ferri" } } });
    renderPage(<SettingsPage />, fake.api);
    fireEvent.click(await screen.findByRole("button", { name: "Accendi la manutenzione" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Accendere la manutenzione?")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Accendi la manutenzione" }));
    await waitFor(() => expect(fake.writes()).toEqual([{ method: "PUT", path: "/app-settings", body: { maintenance: true } }]));
    expect(await screen.findByText(/Manutenzione accesa dal .*: l’app è ferma per tutti\./)).toBeTruthy();
    expect(screen.getByText("L’app mostra la pagina di manutenzione a tutti. Accesa da Marta Ferri.")).toBeTruthy();
  });

  it("a legal address must be https, asks before saving, and «Standard» puts the default back", async () => {
    const fake = fakeApi(EDITOR, { "GET /app-settings": DATA, "PUT /app-settings": DATA });
    renderPage(<SettingsPage />, fake.api);
    const it = await screen.findByLabelText("Termini e condizioni IT");
    fireEvent.change(it, { target: { value: "http://finzyapp.com/termini" } });
    expect(screen.getByText("Scrivi un indirizzo web completo, che inizia con https://")).toBeTruthy();
    fireEvent.change(it, { target: { value: "https://finzyapp.com/termini" } });
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(/Da adesso l’app apre il nuovo indirizzo per «Termini e condizioni»/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Salva l’indirizzo" }));
    await waitFor(() => expect(fake.writes()[0]).toEqual({ method: "PUT", path: "/app-settings", body: { links: { terms_url_it: "https://finzyapp.com/termini" } } }));
  });

  it("toggles and the minimum build wait for «Salva» and send only what changed", async () => {
    const fake = fakeApi(EDITOR, { "GET /app-settings": DATA, "PUT /app-settings": DATA });
    renderPage(<SettingsPage />, fake.api);
    fireEvent.click(await screen.findByRole("switch", { name: "Chiedi la recensione su iPhone" }));
    fireEvent.change(screen.getByLabelText("Numero di build minimo"), { target: { value: "60" } });
    expect(fake.writes()).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() => expect(fake.writes()[0]).toEqual({ method: "PUT", path: "/app-settings", body: { ask_review: true, min_version: 60 } }));
  });

  it("shows no raw key or secret, and a reader cannot change anything", async () => {
    renderPage(<SettingsPage />, fakeApi(READER, { "GET /app-settings": DATA }).api);
    expect(await screen.findByText("Qui ci sono solo le impostazioni che l’app usa. Le chiavi tecniche restano sul server e non si vedono dalla console.")).toBeTruthy();
    expect(screen.queryByText(/mail_|stripe|agora/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Accendi la manutenzione" })).toBeNull();
    expect(((screen.getByLabelText("Numero di build minimo")) as HTMLInputElement).disabled).toBe(true);
  });

  it("checks addresses like the server does", () => {
    expect(validUrl("https://www.iubenda.com/privacy-policy/1")).toBe(true);
    expect(validUrl("http://x.com")).toBe(false);
    expect(validUrl("not a url")).toBe(false);
  });
});
