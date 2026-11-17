import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EDITOR, READER, fakeApi, renderPage } from "@/components/news/test-utils";
import { ApiError } from "@/lib/api";
import type { Article, ArticleRow, QueuePage, Today } from "@/lib/news";
import TodayPage from "./page";
import ArticlesPage from "./articles/page";
import ArticlePage from "./articles/detail/page";
import QueuePageView from "./review/page";
import TaxonomiesPage from "./taxonomies/page";

const nav = vi.hoisted(() => ({ pathname: "/news", search: "", replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const row = (id: number, patch: Partial<ArticleRow> = {}): ArticleRow => ({
  id, title: `Articolo ${id}`, source: { id: 8, name: "MT Newswires" }, created_at: "2026-11-13T12:14:00+01:00",
  in_feed: true, is_movement: false, summary: "ready", image: "ready", image_url: null, active: true, ...patch,
});

const TODAY: Today = {
  updated_at: "2026-11-12T18:12:00+01:00",
  sources: [
    { id: 8, name: "MT Newswires", state: "stop", collected: 1004, in_feed: 96, movements: 212, hours: Array(24).fill(3), latest_at: "2026-11-12T15:32:00+01:00", silent_minutes: 160, limit_minutes: 60, working_hours: [8, 22] },
    { id: 6, name: "Adnkronos", state: "ok", collected: 54, in_feed: 9, movements: 0, hours: Array(24).fill(1), latest_at: "2026-11-12T18:02:00+01:00", silent_minutes: 10, limit_minutes: 180, working_hours: [7, 21] },
  ],
  ai: { summaries: { ready: 101, pending: 3, failed: 1, total: 105 }, images: { ready: 100, pending: 4, failed: 1, total: 105 } },
  latest: [row(1, { title: "Borsa: Milano chiude in rialzo", summary: "pending", source: { id: 6, name: "Adnkronos" } })],
};

const ARTICLE: Article = {
  ...row(195702),
  title: { it: "Indice dei prezzi alla produzione", en: "Producer prices" },
  text: { it: "WASHINGTON (MT Newswires) -- L’indice…", en: "WASHINGTON…" },
  summary: { it: { happening: "Sono saliti dello 0,4%.", meaning: "m", effects: "e", care: "c" }, en: { happening: "Up 0.4%." } },
  summary_state: "ready", summary_at: "2026-11-13T12:17:00+01:00", image_state: "ready", image: null, image_info: null,
  feed_category: "bond", url: "https://example.com/a", topics: [{ id: 1, name: { it: "Economia", en: "Economy" } }], markets: [],
  links: [
    { blog_id: 195702, azione_id: 11, symbol: "JPM", name: "JPMorgan Chase & Co", logo_url: null, type: "indirect", legacy: false, confidence: 0.38, reason: "Le banche sono sensibili ai tassi.", source: "model", review: null, reviewed_at: null, reviewed_by: null, removed: false },
  ],
  last_edit: null,
};

beforeEach(() => {
  nav.pathname = "/news";
  nav.search = "";
  nav.push.mockReset();
});

describe("Oggi", () => {
  it("draws both sources, the stop banner and the AI lines", async () => {
    renderPage(<TodayPage />, fakeApi(EDITOR, (p) => (p === "/news/today" ? TODAY : null)));
    await screen.findByText("MT Newswires non manda articoli dalle 15:32.");
    const mt = screen.getByRole("region", { name: "MT Newswires" });
    expect(within(mt).getByText("Ferma")).toBeTruthy();
    expect(within(mt).getByText("1.004")).toBeTruthy();
    expect(within(mt).getByText("Ultimo articolo alle 15:32 · 2 ore e 40 minuti fa")).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Adnkronos" })).getByText("Attiva")).toBeTruthy();
    expect(screen.getByText("101 pronti")).toBeTruthy();
    expect(screen.getByText("1 non riuscita")).toBeTruthy();
    expect(screen.getByText("Borsa: Milano chiude in rialzo")).toBeTruthy();
    // D428: both «today» links write the English address the Articoli page reads.
    expect(screen.getByRole("link", { name: "Articoli di oggi" }).getAttribute("href")).toBe("/news/articles?period=today");
    expect(screen.getByRole("link", { name: /Tutti gli articoli di oggi/ }).getAttribute("href")).toBe("/news/articles?period=today");
  });

  it("an error offers Riprova", async () => {
    let fail = true;
    renderPage(<TodayPage />, fakeApi(EDITOR, (p) => {
      if (p === "/news/today" && fail) throw new ApiError(500, null);
      return TODAY;
    }));
    await screen.findByText("Non è stato possibile caricare la giornata");
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));
    await screen.findByRole("region", { name: "MT Newswires" });
  });
});

describe("Articoli", () => {
  it("lists the rows, sends the filters and opens an article", async () => {
    nav.pathname = "/news/articles";
    const api = fakeApi(READER, (p) => (p === "/news/articles" ? { rows: [row(5), row(6, { active: false, summary: "none", in_feed: false })], total: 37747, page: 1, per_page: 25 } : { rows: [{ id: 8, name: { it: "MT Newswires", en: "MT Newswires" }, articles: 1 }] }));
    renderPage(<ArticlesPage />, api);
    await screen.findByText("37.747 articoli");
    const table = screen.getByRole("table", { name: "Articoli" });
    expect(within(table).getByText("Nascosto")).toBeTruthy();
    expect(within(table).getByText("Non serve")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Riassunto"), { target: { value: "failed" } });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/news/articles", expect.objectContaining({ summary: "failed", page: 1 })));
    fireEvent.click(await screen.findByText("Articolo 5"));
    expect(nav.push).toHaveBeenCalledWith("/news/articles/detail?id=5");
  });

  it("no row with the filters: «Togli i filtri» clears them", async () => {
    nav.pathname = "/news/articles";
    nav.search = "period=today";
    const api = fakeApi(READER, (p, _b, q) => (p === "/news/articles" ? (q?.from ? { rows: [], total: 0, page: 1, per_page: 25 } : { rows: [row(1)], total: 1, page: 1, per_page: 25 }) : { rows: [] }));
    renderPage(<ArticlesPage />, api);
    await screen.findByText("Nessun risultato con questi filtri");
    fireEvent.click(screen.getAllByRole("button", { name: "Togli i filtri" })[0]);
    await screen.findByText("Articolo 1");
  });
});

describe("Articolo", () => {
  beforeEach(() => {
    nav.pathname = "/news/articles/detail";
    nav.search = "id=195702";
  });

  it("reads first: details, links and the app preview in both languages", async () => {
    renderPage(<ArticlePage />, fakeApi(EDITOR, () => ARTICLE));
    await screen.findByText("Titoli collegati (1)");
    expect(screen.getByText("Nessuna: com’è arrivato dalla fonte")).toBeTruthy();
    expect(screen.getByText("Sono saliti dello 0,4%.")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "English" }));
    expect(screen.getByText("Up 0.4%.")).toBeTruthy();
    expect(screen.getByText("AI-generated summary")).toBeTruthy();
  });

  it("a verdict is sent, and «Rimuovi» can be undone", async () => {
    const api = fakeApi(EDITOR, (p) => {
      if (p.startsWith("POST") && p.endsWith("/review")) return { ...ARTICLE.links[0], review: "wrong", reviewed_by: { id: 7, name: "Marta Ferri" }, reviewed_at: "2026-11-13T13:00:00+01:00" };
      if (p.startsWith("DELETE")) return { ...ARTICLE.links[0], removed: true };
      if (p.endsWith("/restore")) return ARTICLE.links[0];
      return ARTICLE;
    });
    renderPage(<ArticlePage />, api);
    fireEvent.click(await screen.findByRole("button", { name: /Sbagliato/ }));
    await screen.findByText(/Giudicato da Marta Ferri/);
    expect(api.post).toHaveBeenCalledWith("/news/articles/195702/instruments/11/review", { verdict: "wrong" });
    fireEvent.click(screen.getByRole("button", { name: /Rimuovi/ }));
    await screen.findByText("JPM rimosso dall’articolo");
    fireEvent.click(screen.getByRole("button", { name: "Annulla" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/news/articles/195702/instruments/11/restore"));
  });

  it("hiding asks first and sends active false", async () => {
    const api = fakeApi(EDITOR, (p) => (p.startsWith("PUT") ? { ...ARTICLE, active: false } : ARTICLE));
    renderPage(<ArticlePage />, api);
    fireEvent.click(await screen.findByRole("button", { name: /Nascondi dall’app/ }));
    fireEvent.click(screen.getByRole("button", { name: "Nascondi" }));
    await screen.findByText("Nascosto: l’app non mostra questo articolo.");
    expect(api.put).toHaveBeenCalledWith("/news/articles/195702", { active: false });
  });

  it("editing: an empty Italian title cannot be saved; Salva sends the fields", async () => {
    const api = fakeApi(EDITOR, (p, body) => (p.startsWith("PUT") ? { ...ARTICLE, title: { ...ARTICLE.title, it: (body as { title_it: string }).title_it } } : ARTICLE));
    renderPage(<ArticlePage />, api);
    fireEvent.click(await screen.findByRole("button", { name: /Modifica/ }));
    const title = screen.getByLabelText("Titolo (italiano)");
    fireEvent.change(title, { target: { value: " " } });
    expect((screen.getByRole("button", { name: "Salva" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(title, { target: { value: "Nuovo titolo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/news/articles/195702", expect.objectContaining({ title_it: "Nuovo titolo" })));
    expect(await screen.findByRole("heading", { level: 1, name: "Nuovo titolo" })).toBeTruthy();
  });

  it("a read-only role sees the page without Modifica and with the verdicts off", async () => {
    renderPage(<ArticlePage />, fakeApi(READER, () => ARTICLE));
    await screen.findByText("Il tuo ruolo può guardare le Notizie ma non modificarle.");
    expect(screen.queryByRole("button", { name: /Modifica/ })).toBeNull();
    expect((screen.getByRole("button", { name: /Giusto/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("an image the server refuses says which files work; any other failure says Riprova", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ message: "x", errors: { image: ["x"] } }), { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);
    renderPage(<ArticlePage />, fakeApi(EDITOR, () => ARTICLE));
    fireEvent.click(await screen.findByRole("button", { name: /Modifica/ }));
    const file = new File(["x"], "foto.gif", { type: "image/gif" });
    fireEvent.change(screen.getByLabelText("Scegli un’immagine"), { target: { files: [file] } });
    await screen.findByText("Immagine non caricata: usa un JPG, PNG o WebP fino a 5 MB.");
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/news/articles/195702/image", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "X-Finzy-Admin": "1" }) }));
    fetchMock.mockImplementationOnce(async () => new Response("", { status: 500 }));
    fireEvent.change(screen.getByLabelText("Scegli un’immagine"), { target: { files: [file] } });
    await screen.findByText("Immagine non caricata. Riprova.");
  });

  it("Annulla with changes asks before leaving the edit", async () => {
    renderPage(<ArticlePage />, fakeApi(EDITOR, () => ARTICLE));
    fireEvent.click(await screen.findByRole("button", { name: /Modifica/ }));
    fireEvent.change(screen.getByLabelText("Titolo (inglese)"), { target: { value: "Changed" } });
    fireEvent.click(screen.getByRole("button", { name: "Annulla" }));
    fireEvent.click(await screen.findByRole("button", { name: "Esci senza salvare" }));
    expect(await screen.findByRole("button", { name: /Modifica/ })).toBeTruthy();
  });

  it("an unknown id says so", async () => {
    renderPage(<ArticlePage />, fakeApi(EDITOR, () => {
      throw new ApiError(404, null);
    }));
    await screen.findByText("Articolo non trovato");
  });
});

describe("Collegamenti da verificare", () => {
  const q = (): QueuePage => ({
    rows: [
      { ...ARTICLE.links[0], article: { id: 195702, title: "Indice dei prezzi", excerpt: "L’indice…", source: { id: 8, name: "MT Newswires" }, created_at: "2026-11-13T12:14:00+01:00", url: null } },
      { ...ARTICLE.links[0], blog_id: 195703, azione_id: 12, symbol: "TSM", article: { id: 195703, title: "Nvidia e i chip", excerpt: "", source: null, created_at: "2026-11-13T12:11:00+01:00", url: null } },
    ],
    counts: { todo: 2, correct: 0, wrong: 0, removed: 0 }, total: 2, page: 1, per_page: 25,
    filters: { tab: "todo", type: "indirect", max_confidence: 0.7, days: 7, source: null },
    meta: { judged_indirect: 0, correct_indirect: 0, total_indirect: 36535, judged_direct: 0, total_direct: 32490, legacy: 16063, precision: null, min_verdicts: 20 },
  });

  // MOB-1451: every test here runs as on a busy machine. There React uses up
  // its 5 ms slice drawing the list and runs the effects in a later task, so a
  // key can arrive in between. A clock that jumps 10 ms at every read makes
  // that happen on every run (restoreMocks puts the real clock back after each test).
  const realNow = performance.now.bind(performance);
  beforeEach(() => {
    let skew = 0;
    vi.spyOn(performance, "now").mockImplementation(() => realNow() + (skew += 10));
  });

  it("G judges the open link and moves to the next; R removes with Annulla", async () => {
    nav.pathname = "/news/review";
    const api = fakeApi(EDITOR, (p) => {
      if (p.endsWith("/review")) return { ...ARTICLE.links[0], review: "correct" };
      if (p.startsWith("DELETE")) return { ...ARTICLE.links[0], azione_id: 12, removed: true };
      if (p === "/news/links") return q();
      return { rows: [] };
    });
    renderPage(<QueuePageView />, api);
    await screen.findByText("Precisione: servono almeno 20 giudizi (finora 0).");
    expect(screen.getByText(/indiretti 0 su 36.535/)).toBeTruthy();
    expect(screen.getByRole("region", { name: "Collegamento JPM" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "g" });
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/news/articles/195702/instruments/11/review", { verdict: "correct" }));
    await screen.findByRole("region", { name: "Collegamento TSM" });
    fireEvent.keyDown(window, { key: "r" });
    await screen.findByText("TSM rimosso dall’articolo");
    expect(api.del).toHaveBeenCalledWith("/news/articles/195703/instruments/12");
  });

  it("keys do nothing while typing, on a removed link, or held down", async () => {
    nav.pathname = "/news/review";
    const page = q();
    page.rows[0] = { ...page.rows[0], removed: true };
    const api = fakeApi(EDITOR, (p) => (p === "/news/links" ? page : { rows: [] }));
    renderPage(<QueuePageView />, api);
    await screen.findByRole("region", { name: "Collegamento JPM" });
    fireEvent.keyDown(window, { key: "r" });
    fireEvent.keyDown(window, { key: "g" });
    expect(api.del).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByLabelText("Tipo"), { key: "j" });
    expect(screen.getByRole("region", { name: "Collegamento JPM" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "j" });
    await screen.findByRole("region", { name: "Collegamento TSM" });
    fireEvent.keyDown(window, { key: "g", repeat: true });
    expect(api.post).not.toHaveBeenCalled();
  });

  it("G and S judge the link on screen right after the list or a verdict is drawn", async () => {
    nav.pathname = "/news/review";
    const api = fakeApi(EDITOR, (p) => {
      if (p.endsWith("/review")) return { ...ARTICLE.links[0], review: "correct" };
      return p === "/news/links" ? q() : { rows: [] };
    });
    renderPage(<QueuePageView />, api);
    await screen.findByRole("region", { name: "Collegamento JPM" });
    fireEvent.keyDown(window, { key: "g" });
    expect(api.post).toHaveBeenCalledWith("/news/articles/195702/instruments/11/review", { verdict: "correct" });
    await screen.findByRole("region", { name: "Collegamento TSM" });
    fireEvent.keyDown(window, { key: "s" });
    expect(api.post).toHaveBeenLastCalledWith("/news/articles/195703/instruments/12/review", { verdict: "wrong" });
  });

  it("a read-only role cannot judge, not even with the keys", async () => {
    nav.pathname = "/news/review";
    const api = fakeApi(READER, (p) => (p === "/news/links" ? q() : { rows: [] }));
    renderPage(<QueuePageView />, api);
    await screen.findByRole("region", { name: "Collegamento JPM" });
    fireEvent.keyDown(window, { key: "g" });
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe("Classificazioni", () => {
  it("categories: the note, a duplicate name and an entry in use that cannot be deleted", async () => {
    nav.pathname = "/news/taxonomies";
    const api = fakeApi(EDITOR, (p) => {
      if (p === "/news/taxonomies/sources") return { rows: [{ id: 8, name: { it: "MT Newswires", en: "MT Newswires" }, articles: 36600, visible: true, description: { it: "", en: "" }, last_article_at: null }] };
      if (p === "/news/taxonomies/categories") return { rows: [{ id: 1, name: { it: "Azioni", en: "Stocks" }, articles: 3 }], with_category: 0 };
      if (p === "POST /news/taxonomies/categories") throw new ApiError(422, "duplicate");
      return null;
    });
    renderPage(<TaxonomiesPage />, api);
    await screen.findByText("36.600");
    fireEvent.click(screen.getByRole("tab", { name: "Categorie" }));
    await screen.findByText("Per ora nessun articolo ha una categoria: le fonti non la mandano.");
    expect((screen.getByRole("button", { name: "Elimina Azioni" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Nuova categoria/ }));
    fireEvent.change(screen.getAllByLabelText("Nome")[0], { target: { value: "azioni" } });
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    await screen.findByText("Esiste già una categoria con questo nome.");
  });

  it("a source is hidden only after the confirm", async () => {
    nav.pathname = "/news/taxonomies";
    const api = fakeApi(EDITOR, (p) => (p.startsWith("PUT") ? {} : { rows: [{ id: 6, name: { it: "Adnkronos", en: "Adnkronos" }, articles: 1147, visible: true, description: { it: "Agenzia", en: "Agency" }, last_article_at: null }] }));
    renderPage(<TaxonomiesPage />, api);
    fireEvent.click(await screen.findByText("Adnkronos"));
    fireEvent.click(screen.getByLabelText("Visibile nell’app"));
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    expect(api.put).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Nascondi" }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/news/taxonomies/sources/6", { description_it: "Agenzia", description_en: "Agency", visible: false }));
  });
});
