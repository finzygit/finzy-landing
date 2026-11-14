import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LessonDetail, Library } from "@/lib/content/types";
import { getUploads, resetUploads, setTransport } from "@/lib/content/uploads";
import Page from "@/app/contenuti/lezioni/scheda/page";
import { ConsoleProvider } from "@/lib/console";
import { LessonPage, normalizeTag } from "./LessonPage";
import { EDITOR, READER, fakeApi, notFound, renderPage } from "./testkit";

const nav = vi.hoisted(() => ({ pathname: "/contenuti/lezioni/scheda", query: "id=2", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.query),
}));

const LIB: Library = {
  sections: [
    { key: "foundations", title: "Fondamenti di finanza", legacy: false, lessons: [] },
    { key: "financial_markets", title: "Mercati finanziari", legacy: false, lessons: [] },
    { key: "crypto", title: "Criptovalute", legacy: true, lessons: [] },
  ],
  counts: { all: 0, visible: 0, no_it: 0, no_en: 0 },
};

const LESSON: LessonDetail = {
  id: 2,
  title: { it: "Il valore del denaro nel tempo", en: "Time value of money" },
  summary: { it: "Perché 100 euro oggi valgono di più", en: "Why 100 euro today" },
  objectives: { it: ["Spiegare l’interesse"], en: ["Explain interest"] },
  hashtags: ["#interesse"],
  category: "foundations",
  section_title: "Fondamenti di finanza",
  legacy: false,
  active: true,
  videos: { it: null, en: { name: "time-value-en.mp4", duration: 371, size: 412 * 1024 * 1024, uploaded_at: "2026-10-03T10:00:00+02:00" } },
  thumbnail_url: null,
  position: { index: 2, count: 13 },
  last_change: { who: "Marta Ferri", at: "2026-11-12T18:04:00+01:00" },
  updated_at: null,
};

describe("Lezione", () => {
  beforeEach(() => {
    nav.query = "id=2";
    nav.replace.mockReset();
  });
  afterEach(() => resetUploads());

  it("shows texts, place in the section, videos and the last change", async () => {
    renderPage(<LessonPage />, fakeApi(EDITOR, { "GET /lessons/2": LESSON, "GET /lessons": LIB }).api);
    expect(await screen.findByDisplayValue("Il valore del denaro nel tempo")).toBeTruthy();
    expect(screen.getByText("Fondamenti di finanza · lezione 2 di 13")).toBeTruthy();
    expect(screen.getByText(/Ultima modifica: Marta Ferri/)).toBeTruthy();
    expect(screen.getByText("time-value-en.mp4")).toBeTruthy();
    expect(screen.getByText(/6:11 · 412 MB · caricato il/)).toBeTruthy();
    expect(screen.getByText("Senza video italiano, chi usa l’app in italiano vede quello inglese.")).toBeTruthy();
    fireEvent.click(within(screen.getByRole("group", { name: "Testi" })).getByRole("button", { name: "EN" }));
    expect(screen.getByDisplayValue("Time value of money")).toBeTruthy();
  });

  it("saves only what changed, after «Salva»", async () => {
    const fake = fakeApi(EDITOR, { "GET /lessons/2": LESSON, "GET /lessons": LIB, "PUT /lessons/2": (b: unknown) => ({ ...LESSON, ...(b as object) }) });
    renderPage(<LessonPage />, fake.api);
    fireEvent.change(await screen.findByDisplayValue("Il valore del denaro nel tempo"), { target: { value: "Il valore del tempo" } });
    const bar = screen.getByRole("region", { name: "Modifiche non salvate" });
    fireEvent.click(within(bar).getByRole("button", { name: "Salva" }));
    await waitFor(() => expect(fake.writes()).toEqual([{ method: "PUT", path: "/lessons/2", body: { title: { it: "Il valore del tempo", en: "Time value of money" } } }]));
    await waitFor(() => expect(screen.queryByRole("region", { name: "Modifiche non salvate" })).toBeNull());
  });

  it("an empty Italian title is refused before sending", async () => {
    const fake = fakeApi(EDITOR, { "GET /lessons/2": LESSON, "GET /lessons": LIB });
    renderPage(<LessonPage />, fake.api);
    fireEvent.change(await screen.findByDisplayValue("Il valore del denaro nel tempo"), { target: { value: " " } });
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    expect((await screen.findAllByText("Scrivi il titolo in italiano.")).length).toBeGreaterThan(0);
    expect(fake.writes()).toEqual([]);
  });

  it("removing a video asks first, then deletes it at once", async () => {
    const fake = fakeApi(EDITOR, { "GET /lessons/2": LESSON, "GET /lessons": LIB, "DELETE /lessons/2/videos/en": { ...LESSON, videos: { it: null, en: null } } });
    renderPage(<LessonPage />, fake.api);
    await screen.findByText("time-value-en.mp4");
    fireEvent.click(screen.getByRole("button", { name: "Rimuovi" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Rimuovere il video inglese?")).toBeTruthy();
    expect(fake.writes()).toEqual([]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Rimuovi" }));
    await waitFor(() => expect(fake.writes()).toEqual([{ method: "DELETE", path: "/lessons/2/videos/en", body: undefined }]));
    await waitFor(() => expect(screen.queryByText("time-value-en.mp4")).toBeNull());
  });

  it("a wrong file is refused on the page; a right one starts the upload in the tray", async () => {
    setTransport({ putPart: () => new Promise(() => undefined), readDuration: async () => 300 });
    const fake = fakeApi(EDITOR, {
      "GET /lessons/2": LESSON,
      "GET /lessons": LIB,
      "POST /lessons/2/video-upload": { upload_id: "U", part_size: 16, part_count: 1 },
      "POST /lessons/2/video-upload/parts": { urls: { "1": "https://s3/p1" } },
    });
    renderPage(<LessonPage />, fake.api);
    const input = (await screen.findByLabelText("Scegli un file")) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "lezione.avi", { type: "video/x-msvideo" })] } });
    expect(screen.getByText("Il file non è un video MP4 o MOV.")).toBeTruthy();
    fireEvent.change(input, { target: { files: [new File(["x"], "lezione-it.mp4", { type: "video/mp4" })] } });
    await waitFor(() => expect(getUploads()[0]?.status).toBe("uploading"));
    expect(screen.getAllByText("lezione-it.mp4").length).toBeGreaterThan(0);
    expect(screen.getByRole("complementary", { name: "Caricamento di 1 video" })).toBeTruthy();
  });

  it("an unknown lesson says so, with the way back", async () => {
    renderPage(<LessonPage />, fakeApi(EDITOR, { "GET /lessons/2": notFound(), "GET /lessons": LIB }).api);
    expect(await screen.findByText("Lezione non trovata")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Torna alle lezioni" })).toBeTruthy();
  });

  it("a new lesson is created hidden, then opens on its page", async () => {
    nav.query = "nuova=1&sezione=financial_markets";
    const fake = fakeApi(EDITOR, { "GET /lessons": LIB, "POST /lessons": { ...LESSON, id: 41 } });
    renderPage(<LessonPage />, fake.api);
    expect((await screen.findAllByText("Crea la lezione per caricare video e copertina. La lezione nuova va in fondo alla sua sezione, nascosta.")).length).toBeGreaterThan(0);
    expect((screen.getByLabelText("Sezione") as HTMLSelectElement).value).toBe("financial_markets");
    expect(screen.queryByRole("option", { name: "Criptovalute" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Titolo"), { target: { value: "Le borse valori" } });
    fireEvent.click(screen.getByRole("button", { name: "Crea lezione" }));
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/contenuti/lezioni/scheda?id=41"));
    const body = fake.writes()[0].body as { title: { it: string }; active: boolean; category: string };
    expect([body.title.it, body.active, body.category]).toEqual(["Le borse valori", false, "financial_markets"]);
  });

  it("a reader cannot change anything", async () => {
    renderPage(<LessonPage />, fakeApi(READER, { "GET /lessons/2": LESSON, "GET /lessons": LIB }).api);
    expect(((await screen.findByDisplayValue("Il valore del denaro nel tempo")) as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Rimuovi" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Elimina lezione" })).toBeNull();
  });

  it("hashtags keep the app's shape", () => {
    expect(normalizeTag(" credit risk ")).toBe("#creditrisk");
    expect(normalizeTag("##Tassi")).toBe("#Tassi");
    expect(normalizeTag("#")).toBeNull();
  });

  it("after «Crea lezione» the page opens the new lesson with nothing left of the form", async () => {
    nav.query = "nuova=1&sezione=foundations";
    const fake = fakeApi(EDITOR, { "GET /lessons": LIB, "POST /lessons": { ...LESSON, id: 41 }, "GET /lessons/41": { ...LESSON, id: 41, title: { it: "Le borse valori", en: "" } } });
    const view = renderPage(<Page />, fake.api);
    fireEvent.change(await screen.findByLabelText("Titolo"), { target: { value: "Le borse valori" } });
    fireEvent.click(screen.getByRole("button", { name: "Crea lezione" }));
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/contenuti/lezioni/scheda?id=41"));
    nav.query = "id=41";
    view.rerender(
      <ConsoleProvider api={fake.api}>
        <Page />
      </ConsoleProvider>,
    );
    expect(await screen.findByRole("heading", { level: 1, name: "Le borse valori" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Crea lezione" })).toBeNull();
  });
});

