"use client";

// MOB-1376 (boards ADM-NEWS-05-classificazioni-*): sources, categories,
// topics and markets as tabs of one page. Each entry shows how many articles
// use it; a new entry or a rename happens in the row (Gorgias-style); an
// entry in use cannot be deleted; a source is only edited, in a drawer.

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { ConfirmDialog, Drawer } from "@/components/shell/overlays";
import { PageHead, Section, StateBlock, Status } from "@/components/shell/parts";
import { NewsIcon } from "@/components/news/NewsIcon";
import { Tabs } from "@/components/news/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { dayTime, num, type TaxonomyKind, type TaxonomyRow } from "@/lib/news";

const TABS: [TaxonomyKind, string][] = [["sources", "Fonti"], ["categories", "Categorie"], ["topics", "Argomenti"], ["markets", "Mercati"]];
const NEW: Record<Exclude<TaxonomyKind, "sources">, string> = { categories: "Nuova categoria", topics: "Nuovo argomento", markets: "Nuovo mercato" };
const DUP: Record<Exclude<TaxonomyKind, "sources">, string> = {
  categories: "Esiste già una categoria con questo nome.", topics: "Esiste già un argomento con questo nome.", markets: "Esiste già un mercato con questo nome.",
};
type Edit = { id: number | "new"; it: string; en: string; error: string | null; busy: boolean };

export default function TaxonomiesPage() {
  const { api, can, toast } = useConsole();
  const [kind, setKind] = useState<TaxonomyKind>("sources");
  const [rows, setRows] = useState<TaxonomyRow[]>([]);
  const [state, setState] = useState<TableState>("loading");
  const [withCategory, setWithCategory] = useState<number | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [del, setDel] = useState<TaxonomyRow | null>(null);
  const [source, setSource] = useState<(TaxonomyRow & { draft: { it: string; en: string; visible: boolean } }) | null>(null);
  const [askHide, setAskHide] = useState(false);
  const [busy, setBusy] = useState(false);
  const canEdit = can("console.news.update");

  const seq = useRef(0);
  const load = useCallback(async () => {
    const mine = ++seq.current;
    setState("loading");
    try {
      const d = await api.get<{ rows: TaxonomyRow[]; with_category?: number }>(`/news/taxonomies/${kind}`);
      if (mine !== seq.current) return; // the tab changed meanwhile: never show another list's rows here
      setRows(d.rows);
      setWithCategory(d.with_category ?? null);
      setState(d.rows.length ? "default" : "empty");
    } catch {
      if (mine === seq.current) setState("error");
    }
  }, [api, kind]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const saveEdit = async () => {
    if (!edit || edit.busy || kind === "sources") return;
    if (!edit.it.trim()) return setEdit({ ...edit, error: "Il nome non può essere vuoto." });
    setEdit({ ...edit, busy: true, error: null });
    try {
      if (edit.id === "new") await api.post(`/news/taxonomies/${kind}`, { name_it: edit.it, name_en: edit.en });
      else await api.put(`/news/taxonomies/${kind}/${edit.id}`, kind === "topics" ? { name_it: edit.it } : { name_it: edit.it, name_en: edit.en });
      setEdit(null);
      toast({ title: "Salvato" });
      load();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : null;
      setEdit({ ...edit, busy: false, error: code === "duplicate" ? DUP[kind] : code === "name_en_locked" ? "Il nome inglese di un argomento non si cambia: lo usano l’app e la classificazione automatica." : "Non è stato possibile salvare. Riprova." });
    }
  };

  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await api.del(`/news/taxonomies/${kind}/${del.id}`);
      setDel(null);
      load();
    } catch (e) {
      const n = e instanceof ApiError && e.code === "in_use" ? (e.body as { articles?: number } | null)?.articles : undefined;
      toast({ title: n ? `Non si elimina: la usano ${num(n)} articoli` : "Non è stato possibile eliminare", kind: "error" });
    }
    setBusy(false);
  };

  const saveSource = async () => {
    if (!source) return;
    setBusy(true);
    try {
      await api.put(`/news/taxonomies/sources/${source.id}`, { description_it: source.draft.it, description_en: source.draft.en, visible: source.draft.visible });
      setSource(null);
      setAskHide(false);
      toast({ title: "Salvato" });
      load();
    } catch {
      toast({ title: "Non è stato possibile salvare", body: "Riprova tra poco.", kind: "error" });
    }
    setBusy(false);
  };

  // A topic's English name is a key for the app and the topic classifier: it is set once, at creation.
  const locked = (lang: "it" | "en") => lang === "en" && kind === "topics" && edit?.id !== "new";
  const nameCell = (r: TaxonomyRow, lang: "it" | "en") =>
    edit && edit.id === r.id && !locked(lang) ? (
      <input className="input" style={{ height: 40 }} autoFocus={lang === "it"} aria-label={lang === "it" ? "Nome" : "Nome inglese"} value={edit[lang]} onChange={(e) => setEdit({ ...edit, [lang]: e.target.value, error: null })} onKeyDown={(e) => (e.key === "Enter" ? saveEdit() : e.key === "Escape" ? setEdit(null) : undefined)} />
    ) : lang === "it" ? <strong>{r.name.it}</strong> : <span style={{ color: "var(--text-2)" }}>{r.name.en || "—"}</span>;

  const actions = (r: TaxonomyRow) =>
    !canEdit ? null : edit && edit.id === r.id ? (
      <span style={{ display: "inline-flex", gap: 8 }}>
        <button type="button" className="btn" style={{ height: 36 }} onClick={() => setEdit(null)}>Annulla</button>
        <button type="button" className="btn btn-primary" style={{ height: 36 }} disabled={edit.busy} onClick={saveEdit}>Salva</button>
      </span>
    ) : (
      <span style={{ display: "inline-flex", gap: 6 }}>
        <button type="button" className="icon-btn" aria-label={`Modifica ${r.name.it}`} onClick={() => setEdit({ id: r.id, it: r.name.it, en: r.name.en, error: null, busy: false })}><NewsIcon name="edit" size={16} /></button>
        <button type="button" className="icon-btn" aria-label={`Elimina ${r.name.it}`} disabled={r.articles > 0} title={r.articles > 0 ? `Non si elimina: la usano ${num(r.articles)} articoli` : undefined} onClick={() => setDel(r)}><NewsIcon name="close" size={16} /></button>
      </span>
    );

  const table =
    kind === "sources" ? (
      <DataTable<TaxonomyRow>
        caption="Fonti" state={state} rows={rows} rowKey={(r) => r.id} onRetry={load}
        errorText="Non è stato possibile caricare le classificazioni"
        onRowClick={canEdit ? (r) => setSource({ ...r, draft: { it: r.description?.it ?? "", en: r.description?.en ?? "", visible: r.visible ?? true } }) : undefined}
        columns={[
          { key: "name", label: "Fonte", render: (r) => <strong>{r.name.it}</strong> },
          { key: "n", label: "Articoli", width: "140px", render: (r) => num(r.articles) },
          { key: "app", label: "Nell’app", width: "150px", render: (r) => <Status kind={r.visible ? "ok" : "off"}>{r.visible ? "Visibile" : "Nascosta"}</Status> },
          { key: "last", label: "Ultimo articolo", width: "170px", render: (r) => <span style={{ color: "var(--text-2)" }}>{dayTime(r.last_article_at ?? null)}</span> },
        ]}
      />
    ) : (
      <DataTable<TaxonomyRow>
        caption={TABS.find(([k]) => k === kind)?.[1]} state={state === "empty" && edit?.id === "new" ? "default" : state}
        rows={edit?.id === "new" ? [{ id: -1, name: { it: "", en: "" }, articles: 0 }, ...rows] : rows}
        rowKey={(r) => r.id} onRetry={load}
        errorText="Non è stato possibile caricare le classificazioni"
        empty={<StateBlock kind="empty" title="Ancora nessuna voce" />}
        columns={[
          { key: "it", label: "Nome", render: (r) => (r.id === -1 && edit ? nameCell({ ...r, id: edit.id as never }, "it") : nameCell(r, "it")) },
          { key: "en", label: "Nome inglese", render: (r) => (r.id === -1 && edit ? nameCell({ ...r, id: edit.id as never }, "en") : nameCell(r, "en")) },
          { key: "n", label: "Articoli", width: "110px", render: (r) => (r.id === -1 ? "" : num(r.articles)) },
          { key: "a", label: "", width: "190px", align: "right", render: (r) => (r.id === -1 && edit ? actions({ ...r, id: edit.id as never }) : actions(r)) },
        ]}
      />
    );

  return (
    <AdminFrame title="Classificazioni">
      <PageHead
        title="Classificazioni"
        sub="Fonti, categorie, argomenti e mercati con cui sono ordinati gli articoli."
        crumbs={["Notizie", "Classificazioni"]}
        actions={canEdit && kind !== "sources" ? (
          <button type="button" className="btn" disabled={!!edit} onClick={() => setEdit({ id: "new", it: "", en: "", error: null, busy: false })}>
            <NewsIcon name="plus" size={16} /> {NEW[kind]}
          </button>
        ) : undefined}
      />
      <Tabs<TaxonomyKind> label="Classificazioni" value={kind} onChange={(k) => (setKind(k), setEdit(null))} tabs={TABS} />
      {kind === "categories" && withCategory === 0 ? <p className="note" style={{ fontSize: 14, marginBottom: 14 }}>Per ora nessun articolo ha una categoria: le fonti non la mandano.</p> : null}
      {edit?.error ? <p className="error-line" role="alert" style={{ marginBottom: 12 }}>{edit.error}</p> : null}
      <Section pad="8px">{table}</Section>

      {del ? (
        <ConfirmDialog title={`Eliminare «${del.name.it}»?`} message="Nessun articolo la usa. L’eliminazione non si annulla." confirmLabel="Elimina" busy={busy} onConfirm={remove} onCancel={() => setDel(null)} />
      ) : null}
      {source ? (
        <Drawer
          title={source.name.it}
          sub={`Fonte · ${num(source.articles)} articoli`}
          onClose={() => setSource(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setSource(null)}>Annulla</button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => (source.draft.visible === false && source.visible ? setAskHide(true) : saveSource())}>Salva</button>
            </>
          }
        >
          <div className="field">
            <label htmlFor="src-it">Descrizione (italiano)</label>
            <input id="src-it" className="input" value={source.draft.it} onChange={(e) => setSource({ ...source, draft: { ...source.draft, it: e.target.value } })} />
          </div>
          <div className="field">
            <label htmlFor="src-en">Descrizione (inglese)</label>
            <input id="src-en" className="input" value={source.draft.en} onChange={(e) => setSource({ ...source, draft: { ...source.draft, en: e.target.value } })} />
          </div>
          <label style={{ display: "flex", gap: 12, alignItems: "center", fontWeight: 600 }}>
            <input type="checkbox" checked={source.draft.visible} onChange={(e) => setSource({ ...source, draft: { ...source.draft, visible: e.target.checked } })} style={{ width: 20, height: 20, accentColor: "var(--accent)" }} />
            Visibile nell’app
          </label>
        </Drawer>
      ) : null}
      {askHide && source ? (
        <ConfirmDialog kind="primary" title={`Nascondere ${source.name.it}?`} message="Sparisce dall’elenco delle fonti nell’app; i suoi articoli restano visibili. Puoi renderla di nuovo visibile quando vuoi."
          confirmLabel="Nascondi" busy={busy} onConfirm={saveSource} onCancel={() => setAskHide(false)} />
      ) : null}
    </AdminFrame>
  );
}
