import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Library } from "@/lib/content/types";
import { LessonsPage } from "./LessonsPage";
import { EDITOR, READER, fakeApi, renderPage, serverError } from "./testkit";

const nav = vi.hoisted(() => ({ pathname: "/content/lessons", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(),
}));

const row = (id: number, title: string, active: boolean, en: number | null, sort: number) => ({
  id, title, sort_order: sort, active, videos: { it: null, en: en ? { duration: en } : null }, thumbnail_url: null, updated_at: "2026-11-12T18:04:00+01:00",
});

const LIB: Library = {
  sections: [
    { key: "foundations", title: "Fondamenti di finanza", legacy: false, lessons: [row(1, "Che cos’è la finanza", true, 342, 1), row(2, "Il valore del denaro nel tempo", true, 371, 2), row(3, "Il bilancio familiare", false, null, 3)] },
    { key: "financial_system", title: "Il sistema finanziario e le istituzioni", legacy: false, lessons: [row(4, "Le banche centrali", true, 380, 1)] },
    { key: "financial_markets", title: "Mercati finanziari", legacy: false, lessons: [row(5, "Le borse valori", false, null, 1)] },
    { key: "bond", title: "Obbligazioni", legacy: true, lessons: [row(9, "Il rating spiegato semplice", false, null, 1)] },
  ],
  counts: { all: 6, visible: 3, no_it: 6, no_en: 3 },
};

describe("Lezioni", () => {
  beforeEach(() => {
    nav.push.mockReset();
  });

  it("groups the lessons by section, first two open, the old sections closed at the bottom", async () => {
    renderPage(<LessonsPage />, fakeApi(EDITOR, { "GET /lessons": LIB }).api);
    await screen.findByText("Che cos’è la finanza");
    expect(screen.getByText("Le banche centrali")).toBeTruthy();
    expect(screen.queryByText("Le borse valori")).toBeNull();
    expect(screen.queryByText("Il rating spiegato semplice")).toBeNull();
    expect(screen.getByRole("button", { name: /Tutte\s*6/ })).toBeTruthy();
    expect(screen.getByText("3 lezioni · 2 visibili")).toBeTruthy();
    expect(screen.getByText("1 lezione · 1 visibile")).toBeTruthy(); // MOB-1488: singular for one
    fireEvent.click(screen.getByRole("button", { name: /Sezioni non più nell’app/ }));
    expect(screen.getByText("Il rating spiegato semplice")).toBeTruthy();
    expect(screen.getByText(/Impara non mostra più queste sezioni/)).toBeTruthy();
  });

  it("quick filters and search, with an empty state that clears them", async () => {
    renderPage(<LessonsPage />, fakeApi(EDITOR, { "GET /lessons": LIB }).api);
    await screen.findByText("Che cos’è la finanza");
    fireEvent.click(screen.getByRole("button", { name: /Senza video inglese/ }));
    expect(screen.queryByText("Che cos’è la finanza")).toBeNull();
    expect(screen.getByText("Il bilancio familiare")).toBeTruthy();
    expect(screen.getByText("Le borse valori")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Cerca una lezione"), { target: { value: "zzz" } });
    expect(screen.getByText("Nessuna lezione trovata")).toBeTruthy();
    expect(screen.getByText("Nessuna lezione per «zzz». Cerca con un’altra parola o togli i filtri.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Togli i filtri" }));
    expect(screen.getByText("Che cos’è la finanza")).toBeTruthy();
  });

  it("selecting lessons warns about the ones without video and shows them in one call", async () => {
    const fake = fakeApi(EDITOR, { "GET /lessons": LIB, "POST /lessons/visibility": { changed: 1 } });
    renderPage(<LessonsPage />, fake.api);
    await screen.findByText("Il bilancio familiare");
    fireEvent.click(screen.getByLabelText("Seleziona Il bilancio familiare"));
    const bar = screen.getByRole("region", { name: "1 selezionata" }); // MOB-1488: singular for one
    expect(within(bar).getByText("1 senza video: in Impara compaiono come «Video in arrivo».")).toBeTruthy();
    fireEvent.click(within(bar).getByRole("button", { name: "Rendi visibili" }));
    await waitFor(() => expect(fake.writes()).toEqual([{ method: "POST", path: "/lessons/visibility", body: { ids: [3], active: true } }]));
  });

  it("moving a lesson with the keyboard asks to save the section's order", async () => {
    const fake = fakeApi(EDITOR, { "GET /lessons": LIB, "POST /lessons/reorder": LIB });
    renderPage(<LessonsPage />, fake.api);
    await screen.findByText("Il bilancio familiare");
    fireEvent.keyDown(screen.getByRole("button", { name: "Sposta Il bilancio familiare" }), { key: "ArrowUp" });
    const bar = screen.getByRole("region", { name: "Ordine di «Fondamenti di finanza» cambiato" });
    fireEvent.click(within(bar).getByRole("button", { name: "Salva ordine" }));
    await waitFor(() => expect(fake.writes()[0]).toEqual({ method: "POST", path: "/lessons/reorder", body: { category: "foundations", ids: [1, 3, 2] } }));
  });

  it("a reader sees the lessons but no selection, grip or new lesson", async () => {
    renderPage(<LessonsPage />, fakeApi(READER, { "GET /lessons": LIB }).api);
    await screen.findByText("Che cos’è la finanza");
    expect(screen.getByText(/Puoi vedere questa pagina ma non modificarla/)).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Sposta/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Nuova lezione" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Aggiungi qui" })).toBeNull();
  });

  it("a failed load offers a retry", async () => {
    renderPage(<LessonsPage />, fakeApi(EDITOR, { "GET /lessons": serverError() }).api);
    await screen.findByText("Non è stato possibile caricare le lezioni");
    expect(screen.getByRole("button", { name: "Riprova" })).toBeTruthy();
  });
});
