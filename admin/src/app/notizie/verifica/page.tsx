"use client";

// MOB-1376 (boards ADM-NEWS-04-collegamenti-*, decisions 5–7): one queue of
// the links the system made by itself, across articles: indirect, confidence
// under 0,7, last 7 days, newest first. A list on the left, the link on the
// right; J/K move, G/S/R judge, O opens the article. «Rimuovi» acts at once
// with «Annulla» (decision 6); every verdict stores who and when (decision 7).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { PageHead, Pager, StateBlock } from "@/components/shell/parts";
import { NewsIcon } from "@/components/news/NewsIcon";
import { Confidence, FilterSelect, StockLogo, Tabs, TypeChip, VerdictButtons, type Verdict } from "@/components/news/parts";
import styles from "@/components/news/news.module.css";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { dayTime, hhmm, num, type QueueLink, type QueuePage, type QueueTab, type TaxonomyRow } from "@/lib/news";

type Filters = { tab: QueueTab; type: "indirect" | "direct"; max: string; days: string; source: string; page: number };
const DEFAULT: Filters = { tab: "todo", type: "indirect", max: "0.7", days: "7", source: "", page: 1 };
// The hidden path the console is built under (next.config basePath); empty in dev and tests.
const BASE = (process.env.NEXT_PUBLIC_ADMIN_BASE ?? "").replace(/\/+$/, "");
const DONE: Record<Exclude<Verdict, "remove">, string> = { correct: "Segnato come giusto", wrong: "Segnato come sbagliato" };

export default function QueuePage() {
  const { api, can, toast } = useConsole();
  const [f, setF] = useState<Filters>(DEFAULT);
  const [data, setData] = useState<QueuePage | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [sel, setSel] = useState(0);
  const [busy, setBusy] = useState<Verdict | null>(null);
  const [failed, setFailed] = useState<{ key: string; v: Verdict } | null>(null);
  const [undo, setUndo] = useState<QueueLink | null>(null);
  const [sources, setSources] = useState<TaxonomyRow[]>([]);
  const canEdit = can("console.news.update");
  const changed = f.type !== DEFAULT.type || f.max !== DEFAULT.max || f.days !== DEFAULT.days || f.source !== "";

  useEffect(() => {
    api.get<{ rows: TaxonomyRow[] }>("/news/taxonomies/sources").then((r) => setSources(r.rows), () => undefined);
  }, [api]);

  const seq = useRef(0);
  const load = useCallback(async () => {
    const mine = ++seq.current;
    setState("loading");
    try {
      const d = await api.get<QueuePage>("/news/links", { tab: f.tab, type: f.type, max_confidence: f.max, days: f.days, source: f.source, page: f.page });
      if (mine !== seq.current) return; // an older answer: the filters changed meanwhile
      setData(d);
      setSel(0);
      setState("ready");
    } catch {
      if (mine === seq.current) setState("error");
    }
  }, [api, f]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(t);
  }, [undo]);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const cur = rows[sel] ?? null;
  const set = (patch: Partial<Filters>) => setF((old) => ({ ...old, ...patch, page: patch.page ?? 1 }));
  const keyOf = (l: { blog_id: number; azione_id: number }) => `${l.blog_id}-${l.azione_id}`;
  // By the link, never by the index: the list may have reloaded while the call was out.
  const patchRow = useCallback(
    (key: string, r: Partial<QueueLink>, counts?: Partial<QueuePage["counts"]>) =>
      setData((d) => (d ? { ...d, counts: { ...d.counts, ...counts }, rows: d.rows.map((x) => (`${x.blog_id}-${x.azione_id}` === key ? { ...x, ...r } : x)) } : d)),
    [],
  );

  const judge = useCallback(
    async (v: Verdict) => {
      if (!cur || !canEdit || busy || cur.removed) return;
      const key = keyOf(cur);
      const c = data?.counts;
      setBusy(v);
      setFailed(null);
      const base = `/news/articles/${cur.blog_id}/instruments/${cur.azione_id}`;
      try {
        if (v === "remove") {
          const r = await api.del<QueueLink>(base);
          patchRow(key, { removed: r.removed }, c && f.tab === "todo" ? { todo: c.todo - 1, removed: c.removed + 1 } : undefined);
          setUndo(cur);
        } else {
          const r = await api.post<QueueLink>(`${base}/review`, { verdict: cur.review === v ? null : v });
          const moved = c && f.tab === "todo" && !cur.review && r.review ? { todo: c.todo - 1, [r.review]: c[r.review] + 1 } : undefined;
          patchRow(key, { review: r.review, reviewed_by: r.reviewed_by, reviewed_at: r.reviewed_at }, moved);
          if (r.review) toast({ title: DONE[v] });
        }
        setSel((s) => Math.min(s + 1, rows.length - 1));
      } catch {
        setFailed({ key, v });
      }
      setBusy(null);
    },
    [api, busy, canEdit, cur, data?.counts, f.tab, patchRow, rows.length, toast],
  );

  const restore = async (l: QueueLink) => {
    setUndo(null);
    try {
      const r = await api.post<QueueLink>(`/news/articles/${l.blog_id}/instruments/${l.azione_id}/restore`);
      patchRow(keyOf(l), { removed: r.removed });
    } catch (e) {
      toast({ title: "Non è stato possibile annullare", body: e instanceof ApiError && e.code === "no_history" ? "Il titolo era stato tolto fuori dalla console." : undefined, kind: "error" });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof HTMLElement ? e.target : null;
      // Typing in a field or working in a dialog is not a shortcut.
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || (t && (t.closest("input, textarea, select, [role=dialog], [role=alertdialog]") || t.isContentEditable))) return;
      const k = e.key.toLowerCase();
      if (k === "j") setSel((s) => Math.min(s + 1, rows.length - 1));
      else if (k === "k") setSel((s) => Math.max(s - 1, 0));
      else if (k === "g") judge("correct");
      else if (k === "s") judge("wrong");
      else if (k === "r") judge("remove");
      else if (k === "o" && cur) window.open(`${BASE}/notizie/articoli/scheda?id=${cur.blog_id}`, "_blank", "noopener");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur, judge, rows.length]);

  const m = data?.meta;

  return (
    <AdminFrame title="Collegamenti da verificare">
      <PageHead
        title="Collegamenti da verificare"
        sub="I titoli che il sistema ha collegato agli articoli da solo. Segna se il collegamento è giusto: i giudizi dicono quanto ci si può fidare prima di mostrarli nell’app."
        crumbs={["Notizie", "Collegamenti da verificare"]}
      />
      {m ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "-12px 0 20px" }}>
          <p className="note" style={{ fontSize: 14 }}>
            Giudicati finora: indiretti {num(m.judged_indirect)} su {num(m.total_indirect)} · diretti {num(m.judged_direct)} su {num(m.total_direct)}. I {num(m.legacy)} collegamenti storici, senza tipo, non entrano in coda.
          </p>
          <p className="note" style={{ fontSize: 14 }}>
            {m.precision === null
              ? `Precisione: servono almeno ${m.min_verdicts} giudizi (finora ${num(m.judged_indirect)}).`
              : `Precisione finora: ${Math.round(m.precision * 100)}% (giusti ${num(m.correct_indirect)} su ${num(m.judged_indirect)})`}
          </p>
        </div>
      ) : null}
      <Tabs<QueueTab>
        label="Stato dei collegamenti"
        value={f.tab}
        onChange={(t) => set({ tab: t })}
        tabs={[
          ["todo", `Da verificare ${data ? num(data.counts.todo) : ""}`],
          ["correct", `Giusti ${data ? num(data.counts.correct) : ""}`],
          ["wrong", `Sbagliati ${data ? num(data.counts.wrong) : ""}`],
          ["removed", `Rimossi ${data ? num(data.counts.removed) : ""}`],
        ]}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <FilterSelect always label="Tipo" value={f.type} onChange={(v) => set({ type: v })} options={[["indirect", "Indiretto"], ["direct", "Diretto"]]} />
        <FilterSelect always label="Confidenza" value={f.max} onChange={(v) => set({ max: v })} options={[["0.7", "sotto 0,7"], ["0.5", "sotto 0,5"], ["1", "tutte"]]} />
        <FilterSelect always label="Periodo" value={f.days} onChange={(v) => set({ days: v })} options={[["7", "Ultimi 7 giorni"], ["1", "Ultime 24 ore"], ["30", "Ultimi 30 giorni"]]} />
        <FilterSelect label="Fonte" value={f.source} onChange={(v) => set({ source: v })} options={[["", "Tutte"], ...sources.map((s) => [String(s.id), s.name.it] as [string, string])]} />
        {changed ? <button type="button" className="link-btn" onClick={() => setF({ ...DEFAULT, tab: f.tab })}>Togli i filtri</button> : null}
      </div>

      {state === "loading" ? (
        <StateBlock kind="loading" />
      ) : state === "error" || !data ? (
        <StateBlock kind="error" title="Non è stato possibile caricare i collegamenti" action={<button type="button" className="btn" onClick={load}>Riprova</button>} />
      ) : rows.length === 0 ? (
        <div className="card">
          <StateBlock kind="empty" title="Niente da verificare con questi filtri" body={f.tab === "todo" ? "Hai giudicato tutti i collegamenti di questo periodo." : undefined} />
        </div>
      ) : (
        <div className={styles.gridQueue}>
          <div>
            <div className={`card ${styles.queueList}`} role="group" aria-label="Collegamenti">
              {rows.map((r, i) => (
                <button key={keyOf(r)} type="button" aria-current={i === sel || undefined} className={styles.queueItem} onClick={() => setSel(i)}>
                  <StockLogo symbol={r.symbol} url={r.logo_url} />
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong>{r.symbol}</strong>
                      <span className="muted" style={{ fontSize: 13 }}>{hhmm(r.article.created_at)}</span>
                    </span>
                    <span style={{ color: "var(--text-2)", fontSize: 15, lineHeight: "21px" }}>{r.article.title}</span>
                    <span style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <TypeChip type={r.type} />
                      <Confidence value={r.confidence} />
                      {r.removed ? <span className="muted" style={{ fontSize: 13 }}>Rimosso</span> : r.review ? <span style={{ fontSize: 13, color: "var(--accent)" }}>{r.review === "correct" ? "Giusto" : "Sbagliato"}</span> : null}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <Pager page={data.page} perPage={data.per_page} total={data.total} label="collegamenti" onPage={(p) => set({ page: p })} />
          </div>
          {cur ? (
            <section className="card" style={{ display: "flex", flexDirection: "column", gap: 22, padding: "24px 26px" }} aria-label={`Collegamento ${cur.symbol}`}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <StockLogo symbol={cur.symbol} url={cur.logo_url} size={44} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span><strong style={{ fontSize: 20 }}>{cur.symbol}</strong> <span style={{ color: "var(--text-2)" }}>{cur.name}</span></span>
                    <span style={{ display: "flex", gap: 10, alignItems: "center" }}><TypeChip type={cur.type} /><Confidence value={cur.confidence} /></span>
                  </div>
                </div>
                <span className="muted" style={{ fontSize: 13 }}>{sel + 1} di {rows.length} in questa pagina</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)" }}>Articolo</span>
                <strong style={{ fontSize: 18, lineHeight: "24px" }}>{cur.article.title}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{cur.article.source?.name} · {dayTime(cur.article.created_at)}</span>
                {cur.article.excerpt ? <p style={{ margin: 0, color: "rgba(244,247,246,0.82)", lineHeight: "23px" }}>{cur.article.excerpt}</p> : null}
                <Link href={`/notizie/articoli/scheda?id=${cur.blog_id}`} target="_blank" style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 14 }}>
                  Apri l’articolo <NewsIcon name="external" size={14} />
                </Link>
              </div>
              {cur.reason ? (
                <div className={styles.reason}>
                  <span>{cur.source === "model" ? "Perché, secondo il modello" : "Perché, secondo la regola"}</span>
                  {cur.reason}
                </div>
              ) : null}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cur.removed ? (
                  <p className="muted" style={{ margin: 0 }}>Rimosso dall’articolo.</p>
                ) : (
                  <VerdictButtons review={cur.review} onVerdict={judge} disabled={!canEdit} keys busy={busy} />
                )}
                <p className="note">Sbagliato: il titolo resta collegato e il giudizio conta come errore. Rimuovi: lo toglie dall’articolo, anche nell’app.</p>
                {cur.reviewed_by && cur.review ? <p className="note">Giudicato da {cur.reviewed_by.name}, {dayTime(cur.reviewed_at)}</p> : null}
                {failed && failed.key === keyOf(cur) ? (
                  <p className="error-line" role="alert">
                    Giudizio non salvato. <button type="button" className="link-btn" onClick={() => judge(failed.v)}>Riprova</button>
                  </p>
                ) : null}
                {!canEdit ? <p className="note">Il tuo ruolo può guardare le Notizie ma non modificarle.</p> : null}
              </div>
              {canEdit ? <div className={styles.keys} aria-label="Scorciatoie da tastiera">
                {[["J", "giù"], ["K", "su"], ["G", "giusto"], ["S", "sbagliato"], ["R", "rimuovi"], ["O", "apri l’articolo"]].map(([k, l]) => (
                  <span key={k} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><kbd className={styles.kbd}>{k}</kbd>{l}</span>
                ))}
              </div> : null}
            </section>
          ) : null}
        </div>
      )}
      {undo ? (
        <div className="toasts" aria-live="polite" style={{ bottom: 120 }}>
          <div className="toast" data-kind="info" role="status">
            <NewsIcon name="info" size={18} />
            <div style={{ flex: 1 }}><strong>{undo.symbol} rimosso dall’articolo</strong></div>
            <button type="button" className="link-btn" onClick={() => restore(undo)}>Annulla</button>
          </div>
        </div>
      ) : null}
    </AdminFrame>
  );
}
