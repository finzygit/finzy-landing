"use client";

// MOB-1376 (boards ADM-NEWS-03-articolo-*): one article, read first. Details,
// the linked stocks with Giusto / Sbagliato / Rimuovi (with «Annulla»), the
// original text and, on the right, the article as the app shows it (IT/EN).
// «Modifica» edits titles, text and image; the AI summary is read-only
// (decision 3); «Nascondi dall’app» asks first and can be undone (decision 2).

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { ConfirmDialog } from "@/components/shell/overlays";
import { Banner, Section, StateBlock, Status } from "@/components/shell/parts";
import { AppPreview, LinkLine, StockSearch } from "@/components/news/ArticleParts";
import { NewsIcon } from "@/components/news/NewsIcon";
import { Tabs, type Verdict } from "@/components/news/parts";
import styles from "@/components/news/news.module.css";
import { ApiError, redirectFor } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { fullDate, hhmm, uploadImage, type Article, type Link as StockLink } from "@/lib/news";

type Draft = { title_it: string; title_en: string; text_it: string; text_en: string };
const draftOf = (a: Article): Draft => ({ title_it: a.title.it, title_en: a.title.en, text_it: a.text.it, text_en: a.text.en });

export default function ArticlePage() {
  const { api, can, toast } = useConsole();
  const router = useRouter();
  const id = Number(useSearchParams()?.get("id") ?? 0);
  const [a, setA] = useState<Article | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [lang, setLang] = useState<"it" | "en">("it");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [textLang, setTextLang] = useState<"it" | "en">("it");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [ask, setAsk] = useState<"hide" | "leave" | null>(null);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [busy, setBusy] = useState<{ id: number; v: Verdict } | null>(null);
  const [adding, setAdding] = useState(false);
  const [undo, setUndo] = useState<StockLink | null>(null);
  const [allText, setAllText] = useState(false);
  const [image, setImage] = useState<"idle" | "uploading" | "invalid" | "error">("idle");
  const fileRef = useRef<HTMLInputElement>(null);
  const canEdit = can("console.news.update");

  const load = useCallback(async () => {
    if (!id) return setState("missing");
    try {
      setA(await api.get<Article>(`/news/articles/${id}`));
      setState("ready");
    } catch (e) {
      setState(e instanceof ApiError && e.status === 404 ? "missing" : "error");
    }
  }, [api, id]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(t);
  }, [undo]);

  const dirty = !!(a && draft && JSON.stringify(draft) !== JSON.stringify(draftOf(a)));
  // Unsaved edits: the browser asks before a reload, a closed tab or a link outside the page.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async () => {
    if (!a || !draft) return;
    if (!draft.title_it.trim()) return setTitleError(true);
    setSaving(true);
    setSaveError(false);
    try {
      const next = await api.put<Article>(`/news/articles/${a.id}`, draft);
      setA(next);
      setDraft(null);
      toast({ title: "Articolo salvato" });
    } catch (e) {
      const errors = e instanceof ApiError && e.status === 422 ? ((e.body as { errors?: Record<string, unknown> } | null)?.errors ?? {}) : null;
      if (errors && "title_it" in errors) setTitleError(true);
      else setSaveError(true);
    }
    setSaving(false);
  };

  const setVisible = async (visible: boolean) => {
    if (!a) return;
    setSaving(true);
    try {
      setA(await api.put<Article>(`/news/articles/${a.id}`, { active: visible }));
      setAsk(null);
      toast({ title: visible ? "Articolo di nuovo visibile" : "Articolo nascosto" });
    } catch {
      toast({ title: "Non è stato possibile salvare", body: "Riprova tra poco.", kind: "error" });
    }
    setSaving(false);
  };

  const replaceLink = (l: StockLink) => setA((old) => (old ? { ...old, links: old.links.map((x) => (x.azione_id === l.azione_id ? l : x)) } : old));

  const verdict = async (l: StockLink, v: Verdict) => {
    if (!a) return;
    setBusy({ id: l.azione_id, v });
    try {
      if (v === "remove") {
        replaceLink(await api.del<StockLink>(`/news/articles/${a.id}/instruments/${l.azione_id}`));
        setUndo(l);
      } else {
        // Pressing the chosen verdict again takes it back.
        replaceLink(await api.post<StockLink>(`/news/articles/${a.id}/instruments/${l.azione_id}/review`, { verdict: l.review === v ? null : v }));
      }
    } catch {
      toast({ title: "Giudizio non salvato.", body: "Riprova.", kind: "error" });
    }
    setBusy(null);
  };

  const restore = async (l: StockLink) => {
    if (!a) return;
    setUndo(null);
    try {
      replaceLink(await api.post<StockLink>(`/news/articles/${a.id}/instruments/${l.azione_id}/restore`));
    } catch (e) {
      toast({ title: "Non è stato possibile annullare", body: e instanceof ApiError && e.code === "no_history" ? "Il titolo era stato tolto fuori dalla console." : undefined, kind: "error" });
    }
  };

  const add = async (stockId: number) => {
    if (!a) return;
    try {
      const l = await api.post<StockLink>(`/news/articles/${a.id}/instruments`, { azione_id: stockId });
      setA((old) => (old ? { ...old, links: [...old.links.filter((x) => x.azione_id !== l.azione_id), l] } : old));
      setAdding(false);
    } catch (e) {
      toast({ title: e instanceof ApiError && e.code === "already_linked" ? "Questo titolo è già collegato" : "Non è stato possibile aggiungere il titolo", kind: "error" });
    }
  };

  const upload = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = ""; // the same file can be picked again after an error
    if (!a || !file) return;
    setImage("uploading");
    try {
      setA(await uploadImage(a.id, file));
      setImage("idle");
    } catch (e) {
      if (e instanceof ApiError && redirectFor(e.status, e.code)) return router.replace(redirectFor(e.status, e.code) as string);
      setImage(e instanceof ApiError && (e.status === 422 || e.status === 413) ? "invalid" : "error");
    }
  };

  const crumbs = (
    <Link href="/news/articles" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14 }} onClick={(e) => dirty && (e.preventDefault(), setLeaveTo("/news/articles"), setAsk("leave"))}>
      <span style={{ display: "inline-flex", transform: "scaleX(-1)" }}><NewsIcon name="chevron" size={16} /></span> Articoli
    </Link>
  );

  if (state !== "ready" || !a) {
    return (
      <AdminFrame title="Articolo">
        {crumbs}
        <div style={{ marginTop: 16 }}>
          {state === "loading" ? (
            <StateBlock kind="loading" />
          ) : state === "missing" ? (
            <StateBlock kind="missing" title="Articolo non trovato" body="Forse l’indirizzo è sbagliato." action={<Link className="btn" href="/news/articles">Torna agli articoli</Link>} />
          ) : (
            <StateBlock kind="error" title="Non è stato possibile caricare l’articolo" action={<button type="button" className="btn" onClick={() => (setState("loading"), load())}>Riprova</button>} />
          )}
        </div>
      </AdminFrame>
    );
  }

  const links = a.links;
  const live = links.filter((l) => !l.removed).length;
  const editing = draft !== null;
  const visibleWord = !a.active ? <Status kind="off">Nascosto</Status> : a.summary_state === "pending" ? <Status kind="off">In attesa del riassunto</Status> : <Status kind="ok">Visibile</Status>;
  const aiWord = (s: string, at: string | null, female: boolean) =>
    s === "ready" ? <Status kind="ok">{female ? "Pronta" : "Pronto"}{at ? ` alle ${hhmm(at)}` : ""}</Status>
    : s === "uploaded" ? <Status kind="ok">Caricata dalla console</Status>
    : s === "failed" ? <Status kind="warn">Non riuscit{female ? "a" : "o"}</Status>
    : s === "pending" ? <Status kind="off">In attesa</Status>
    : <span className="muted">Non serve</span>;

  return (
    <AdminFrame title="Articolo">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {crumbs}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 520px", minWidth: 0 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 26, lineHeight: "32px", letterSpacing: "-0.015em" }}>{a.title.it || a.title.en}</h1>
            <span className="muted" style={{ fontSize: 14 }}>{a.source?.name} · {fullDate(a.created_at)} · ID {a.id}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {editing ? (
                <>
                  <button type="button" className="btn" onClick={() => (dirty ? setAsk("leave") : setDraft(null))}>Annulla</button>
                  <button type="button" className="btn btn-primary" disabled={saving || image === "uploading" || !draft.title_it.trim()} aria-busy={saving || undefined} onClick={save}>Salva</button>
                </>
              ) : (
                <>
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noreferrer noopener" style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 14 }}>
                      Apri l’originale <NewsIcon name="external" size={14} />
                    </a>
                  ) : null}
                  {canEdit ? (
                    <>
                      {a.active ? (
                        <button type="button" className="btn" onClick={() => setAsk("hide")}><NewsIcon name="eye-off" size={16} /> Nascondi dall’app</button>
                      ) : (
                        <button type="button" className="btn" disabled={saving} onClick={() => setVisible(true)}><NewsIcon name="eye" size={16} /> Rendi visibile</button>
                      )}
                      <button type="button" className="btn" onClick={() => (setDraft(draftOf(a)), setTitleError(false), setSaveError(false))}><NewsIcon name="edit" size={16} /> Modifica</button>
                    </>
                  ) : null}
                </>
              )}
            </div>
            {saveError ? <p className="error-line" role="alert">Salvataggio non riuscito: le modifiche sono ancora qui. Riprova.</p> : null}
            {!canEdit ? <p className="note" style={{ fontSize: 14 }}>Il tuo ruolo può guardare le Notizie ma non modificarle.</p> : null}
          </div>
        </div>
      </div>

      <div className={styles.gridArticle}>
          {editing ? (
            <div data-area="det" style={{ minWidth: 0 }}>
            <Section>
              <div className={styles.grid2} style={{ gap: 16 }}>
                <div className="field">
                  <label htmlFor="t-it">Titolo (italiano)</label>
                  <textarea id="t-it" className="input" rows={2} style={{ height: "auto", padding: "12px 16px" }} aria-invalid={titleError || undefined}
                    value={draft.title_it} onChange={(e) => (setDraft({ ...draft, title_it: e.target.value }), setTitleError(false))} />
                  {titleError ? <p className="error-line" role="alert">Il titolo italiano non può essere vuoto.</p> : null}
                </div>
                <div className="field">
                  <label htmlFor="t-en">Titolo (inglese)</label>
                  <textarea id="t-en" className="input" rows={2} style={{ height: "auto", padding: "12px 16px" }} value={draft.title_en} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Immagine</label>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  {a.image?.url ?? a.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image?.url ?? a.image_url ?? ""} alt="" style={{ width: 93, height: 64, objectFit: "cover", borderRadius: 12 }} />
                  ) : null}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Scegli un’immagine" onChange={(e) => upload(e.target.files?.[0])} />
                  <button type="button" className="btn" disabled={image === "uploading"} aria-busy={image === "uploading" || undefined} onClick={() => fileRef.current?.click()}>
                    <NewsIcon name="image" size={16} /> {image === "uploading" ? "Caricamento…" : "Sostituisci l’immagine"}
                  </button>
                  {image === "invalid" ? <p className="error-line" role="alert">Immagine non caricata: usa un JPG, PNG o WebP fino a 5 MB.</p> : null}
                  {image === "error" ? <p className="error-line" role="alert">Immagine non caricata. Riprova.</p> : null}
                </div>
              </div>
              <div className="field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="t-body">Testo</label>
                  <div className="segmented" role="group" aria-label="Lingua del testo">
                    <button type="button" aria-pressed={textLang === "it"} onClick={() => setTextLang("it")}>Italiano</button>
                    <button type="button" aria-pressed={textLang === "en"} onClick={() => setTextLang("en")}>English</button>
                  </div>
                </div>
                <textarea id="t-body" className={`input ${styles.textarea}`} value={textLang === "it" ? draft.text_it : draft.text_en}
                  onChange={(e) => setDraft({ ...draft, [textLang === "it" ? "text_it" : "text_en"]: e.target.value })} />
              </div>
              <p className="note">Il riassunto lo scrive l’AI e qui non si modifica.</p>
            </Section>
            </div>
          ) : (
            <>
              <div data-area="det" style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
              <Section title="Dettagli">
                <div>
                  <div className={styles.row}><span>Nell’app</span><span>{visibleWord}</span></div>
                  <div className={styles.row}><span>Fonte</span><strong>{a.source?.name ?? "—"}</strong></div>
                  <div className={styles.row}><span>Feed della Home</span><strong>{a.in_feed ? "Sì" : "No"}</strong></div>
                  <div className={styles.row}><span>Argomenti</span><span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{a.topics.length ? a.topics.map((t) => <span key={t.id} className={styles.tag}>{t.name.it}</span>) : <span className="muted">—</span>}</span></div>
                  <div className={styles.row}><span>Mercati</span><span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{a.markets.length ? a.markets.map((t) => <span key={t.id} className={styles.tag}>{t.name.it}</span>) : <span className="muted">—</span>}</span></div>
                  <div className={styles.row}><span>Riassunto AI</span><span>{aiWord(a.summary_state, a.summary_at, false)}</span></div>
                  <div className={styles.row}><span>Immagine AI</span><span>{aiWord(a.image_state, a.image_info?.at ?? null, true)}</span></div>
                  <div className={styles.row}>
                    <span>Ultima modifica</span>
                    <span style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <strong>{a.last_edit ? `${a.last_edit.who?.name ?? "—"}, ${fullDate(a.last_edit.at)}` : "Nessuna: com’è arrivato dalla fonte"}</strong>
                      {can("console.admin.view") ? <Link href="/admin/audit-log" style={{ fontSize: 14 }}>Registro attività ›</Link> : null}
                    </span>
                  </div>
                </div>
              </Section>
              {!a.active ? <Banner kind="warn">Nascosto: l’app non mostra questo articolo.</Banner> : null}
              </div>
              <div data-area="links" style={{ minWidth: 0 }}>
              <Section title={`Titoli collegati (${live})`}>
                <p className="note">Sbagliato: il titolo resta collegato e il giudizio conta come errore. Rimuovi: lo toglie dall’articolo, anche nell’app.</p>
                <div>
                  {links.length ? links.map((l) => <LinkLine key={l.azione_id} l={l} readOnly={!canEdit} busy={busy?.id === l.azione_id ? busy.v : null} onVerdict={(v) => verdict(l, v)} />) : <p className="muted" style={{ margin: 0 }}>Nessun titolo collegato.</p>}
                </div>
                {canEdit ? (
                  adding ? (
                    <StockSearch onPick={(h) => add(h.id)} onClose={() => setAdding(false)} />
                  ) : (
                    <span><button type="button" className="btn" style={{ height: 40 }} onClick={() => setAdding(true)}><NewsIcon name="plus" size={16} /> Aggiungi un titolo</button></span>
                  )
                ) : null}
              </Section>
              </div>
              <div data-area="text" style={{ minWidth: 0 }}>
              <Section title="Testo originale">
                <p style={{ margin: 0, color: "rgba(244,247,246,0.82)", lineHeight: "23px", whiteSpace: "pre-line" }}>
                  {allText || (a.text.it || a.text.en).length <= 600 ? a.text.it || a.text.en : `${(a.text.it || a.text.en).slice(0, 600)}…`}
                </p>
                {(a.text.it || a.text.en).length > 600 ? (
                  <span><button type="button" className="link-btn" onClick={() => setAllText(!allText)}>{allText ? "Mostra meno" : "Mostra tutto"}</button></span>
                ) : null}
              </Section>
              </div>
            </>
          )}
        <div data-area="pv" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 650, color: "var(--text-2)" }}>Come lo vede l’app</span>
          <Tabs<"it" | "en"> label="Lingua dell’anteprima" value={lang} onChange={setLang} tabs={[["it", "Italiano"], ["en", "English"]]} />
          <div style={{ width: "100%" }}>
            <AppPreview a={editing && draft ? { ...a, title: { it: draft.title_it, en: draft.title_en } } : a} lang={lang} />
          </div>
        </div>
      </div>

      {undo ? (
        <div className="toasts" aria-live="polite" style={{ bottom: 120 }}>
          <div className="toast" data-kind="info" role="status">
            <NewsIcon name="info" size={18} />
            <div style={{ flex: 1 }}><strong>{undo.symbol} rimosso dall’articolo</strong></div>
            <button type="button" className="link-btn" onClick={() => restore(undo)}>Annulla</button>
          </div>
        </div>
      ) : null}
      {ask === "hide" ? (
        <ConfirmDialog kind="primary" title="Nascondere l’articolo?" message="Sparisce dalla Home e dalle pagine dei titoli dell’app. Puoi renderlo di nuovo visibile quando vuoi."
          confirmLabel="Nascondi" busy={saving} onConfirm={() => setVisible(false)} onCancel={() => setAsk(null)} />
      ) : null}
      {ask === "leave" ? (
        <ConfirmDialog title="Uscire senza salvare?" message="Le modifiche al titolo e al testo andranno perse." confirmLabel="Esci senza salvare"
          onConfirm={() => (setAsk(null), setDraft(null), leaveTo ? router.push(leaveTo) : undefined)} onCancel={() => (setAsk(null), setLeaveTo(null))} />
      ) : null}
    </AdminFrame>
  );
}
