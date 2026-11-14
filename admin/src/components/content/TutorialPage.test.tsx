import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TutorialStep, Tutorials } from "@/lib/content/types";
import { TutorialPage } from "./TutorialPage";
import { EDITOR, READER, fakeApi, renderPage } from "./testkit";

vi.mock("next/navigation", () => ({
  usePathname: () => "/contenuti/tutorial",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const step = (id: number, page: string, order: number, title_it: string, title_en: string | null, images: Partial<TutorialStep["images"]> = {}): TutorialStep => ({
  id, step_key: `${page}-${order}`, page, order, feature: `f_${id}`, title_it, title_en, body_it: `Testo ${id}`, body_en: title_en ? `Body ${id}` : null,
  images: { it: null, en: null, legacy: null, ...images }, updated_at: null,
});

const DATA: Tutorials = {
  pages: [
    { key: "home", steps: [step(1, "home", 1, "Il tuo briefing quotidiano", "Your daily briefing", { it: "https://x/it.png" }), step(2, "home", 2, "I mercati in un colpo d’occhio", null)] },
    { key: "global_market_map", steps: [] },
  ],
  features: ["daily_news", "highlights"],
  last_change: null,
};

describe("Tutorial", () => {
  it("lists the app pages, the chosen page's steps and the step as the app shows it", async () => {
    renderPage(<TutorialPage />, fakeApi(EDITOR, { "GET /tutorial-steps": DATA }).api);
    expect((await screen.findAllByText("Il tuo briefing quotidiano")).length).toBe(2);
    expect(screen.getByRole("button", { name: /Mappa dei mercati\s*0 passi/ })).toBeTruthy();
    expect(screen.getByText("Manca il testo inglese: chi usa l’app in inglese vede quello italiano.")).toBeTruthy();
    fireEvent.click(within(screen.getByRole("group", { name: "Anteprima nell’app" })).getByRole("button", { name: "EN" }));
    expect(screen.getByText("Your daily briefing")).toBeTruthy();
    expect(screen.getByText("Immagine italiana: manca quella inglese.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Mappa dei mercati/ }));
    expect(screen.getByText("Questa pagina non ha un tutorial")).toBeTruthy();
  });

  it("a new step needs its feature, and goes to the end of the page", async () => {
    const fake = fakeApi(EDITOR, { "GET /tutorial-steps": DATA, "POST /tutorial-steps": step(3, "home", 3, "Le notizie", null) });
    renderPage(<TutorialPage />, fake.api);
    fireEvent.click(await screen.findByRole("button", { name: /Aggiungi passo/ }));
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Home · passo 3 di 3")).toBeTruthy();
    fireEvent.change(within(drawer).getAllByLabelText("Titolo")[0], { target: { value: "Le notizie" } });
    fireEvent.click(within(drawer).getByRole("button", { name: "Aggiungi passo" }));
    expect(within(drawer).getByRole("alert").textContent).toBe("Scegli la funzione che il passo presenta");
    fireEvent.change(within(drawer).getByLabelText("Funzione presentata"), { target: { value: "daily_news" } });
    fireEvent.click(within(drawer).getByRole("button", { name: "Aggiungi passo" }));
    await waitFor(() =>
      expect(fake.writes()[0]).toEqual({ method: "POST", path: "/tutorial-steps", body: { title_it: "Le notizie", body_it: "", title_en: "", body_en: "", page: "home", feature: "daily_news" } }),
    );
  });

  it("moving a step asks to save the page's order", async () => {
    const fake = fakeApi(EDITOR, { "GET /tutorial-steps": DATA, "POST /tutorial-steps/reorder": DATA });
    renderPage(<TutorialPage />, fake.api);
    fireEvent.keyDown(await screen.findByRole("button", { name: "Sposta il passo 2" }), { key: "ArrowUp" });
    fireEvent.click(within(screen.getByRole("region", { name: "Ordine dei passi di «Home» cambiato" })).getByRole("button", { name: "Salva ordine" }));
    await waitFor(() => expect(fake.writes()[0]).toEqual({ method: "POST", path: "/tutorial-steps/reorder", body: { page: "home", ids: [2, 1] } }));
  });

  it("editing keeps the feature read-only; a reader gets no edit buttons", async () => {
    const view = renderPage(<TutorialPage />, fakeApi(EDITOR, { "GET /tutorial-steps": DATA }).api);
    fireEvent.click(await screen.findByRole("button", { name: "Modifica passo 1" }));
    expect((within(screen.getByRole("dialog")).getByLabelText("Funzione presentata") as HTMLInputElement).disabled).toBe(true);
    view.unmount();
    renderPage(<TutorialPage />, fakeApi(READER, { "GET /tutorial-steps": DATA }).api);
    await screen.findAllByText("Il tuo briefing quotidiano");
    expect(screen.queryByRole("button", { name: /Modifica passo/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Aggiungi passo/ })).toBeNull();
  });
});
