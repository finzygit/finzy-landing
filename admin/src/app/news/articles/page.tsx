"use client";

// MOB-1376 (boards ADM-NEWS-02-articoli-*): every article from the sources,
// newest first, 25 a page from the server. Search in the title (or an id),
// filters for period, source, feed, summary, AI image and state. No delete
// (decision 2); no category filter while no article has one (decision 1).

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { Pager, PageHead, Section, StateBlock, Status } from "@/components/shell/parts";
import { FeedChip, FilterSelect, SummaryWord, Thumb } from "@/components/news/parts";
import { NewsIcon } from "@/components/news/NewsIcon";
import styles from "@/components/news/news.module.css";
import { useConsole } from "@/lib/console";
import { dayTime, num, periodRange, type ArticlePage, type Period, type ArticleRow, type TaxonomyRow } from "@/lib/news";

type Filters = { q: string; period: Period; from: string; to: string; source: string; feed: string; summary: string; image: string; state: string; page: number };
const EMPTY: Filters = { q: "", period: "", from: "", to: "", source: "", feed: "", summary: "", image: "", state: "", page: 1 };

export default function ArticlesPage() {
  const { api } = useConsole();
  const router = useRouter();
  const params = useSearchParams();
  const [f, setF] = useState<Filters>(() => ({ ...EMPTY, period: (params?.get("period") as Period) ?? "" }));
  const [data, setData] = useState<ArticlePage | null>(null);
  const [state, setState] = useState<TableState>("loading");
  const [sources, setSources] = useState<TaxonomyRow[]>([]);
  const filtered = useMemo(() => Object.entries(f).some(([k, v]) => k !== "page" && v !== "" && !(k === "period" && v === "range" && !f.from && !f.to)), [f]);

  useEffect(() => {
    api.get<{ rows: TaxonomyRow[] }>("/news/taxonomies/sources").then((r) => setSources(r.rows), () => undefined);
  }, [api]);

  const seq = useRef(0);
  const load = useCallback(async () => {
    const mine = ++seq.current;
    setState("loading");
    try {
      const range = periodRange(f.period, f.from, f.to);
      const d = await api.get<ArticlePage>("/news/articles", {
        q: f.q.trim(), source: f.source, feed: f.feed, summary: f.summary, image: f.image, state: f.state, page: f.page, ...range,
      });
      if (mine !== seq.current) return; // an older search answered late
      setData(d);
      setState(d.total === 0 ? (filtered ? "filtered" : "empty") : "default");
    } catch {
      if (mine === seq.current) setState("error");
    }
  }, [api, f, filtered]);
  useEffect(() => {
    const t = setTimeout(load, f.q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, f.q]);

  const set = (patch: Partial<Filters>) => setF((old) => ({ ...old, ...patch, page: patch.page ?? 1 }));
  const open = (r: ArticleRow) => router.push(`/news/articles/detail?id=${r.id}`);

  return (
    <AdminFrame title="Articoli">
      <PageHead title="Articoli" sub="Tutti gli articoli arrivati dalle fonti, dal più recente." crumbs={["Notizie", "Articoli"]} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <label className={styles.search}>
          <NewsIcon name="search" size={18} />
          <span className="sr-only">Cerca nel titolo</span>
          <input className="input" type="search" placeholder="Cerca nel titolo" value={f.q} onChange={(e) => set({ q: e.target.value })} />
        </label>
        <FilterSelect<Period> label="Periodo" value={f.period} onChange={(v) => set({ period: v })}
          options={[["", "Tutto il periodo"], ["today", "Oggi"], ["yesterday", "Ieri"], ["7", "Ultimi 7 giorni"], ["30", "Ultimi 30 giorni"], ["range", "Dal … al …"]]} />
        {f.period === "range" ? (
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input className="input" style={{ height: 40, width: 160 }} type="date" aria-label="Dal" value={f.from} onChange={(e) => set({ from: e.target.value })} />
            <span className="muted">–</span>
            <input className="input" style={{ height: 40, width: 160 }} type="date" aria-label="Al" value={f.to} onChange={(e) => set({ to: e.target.value })} />
          </span>
        ) : null}
        <FilterSelect label="Fonte" value={f.source} onChange={(v) => set({ source: v })} options={[["", "Tutte"], ...sources.map((s) => [String(s.id), s.name.it] as [string, string])]} />
        <FilterSelect label="Feed" value={f.feed} onChange={(v) => set({ feed: v })} options={[["", "Tutti"], ["yes", "Nel feed"], ["no", "Fuori dal feed"]]} />
        <FilterSelect label="Riassunto" value={f.summary} onChange={(v) => set({ summary: v })}
          options={[["", "Tutti"], ["ready", "Pronto"], ["pending", "In attesa"], ["failed", "Non riuscito"], ["none", "Non serve"]]} />
        <FilterSelect label="Immagine AI" value={f.image} onChange={(v) => set({ image: v })} options={[["", "Tutte"], ["yes", "Con immagine"], ["no", "Senza immagine"]]} />
        <FilterSelect label="Stato" value={f.state} onChange={(v) => set({ state: v })} options={[["", "Tutti"], ["visible", "Visibile"], ["hidden", "Nascosto"]]} />
        {filtered ? (
          <button type="button" className="link-btn" onClick={() => setF(EMPTY)}>
            Togli i filtri
          </button>
        ) : null}
      </div>
      <p style={{ margin: "0 0 14px", fontWeight: 650 }} aria-live="polite">
        {data && state !== "loading" && state !== "error" ? `${num(data.total)} articoli` : " "}
      </p>
      <Section pad="8px">
        <DataTable<ArticleRow>
          caption="Articoli"
          state={state}
          rows={data?.rows ?? []}
          rowKey={(r) => r.id}
          onRowClick={open}
          onRetry={load}
          errorText="Non è stato possibile caricare gli articoli"
          onClearFilters={() => setF(EMPTY)}
          empty={<StateBlock kind="empty" title="Nessun articolo con questi filtri" body="Prova un periodo più lungo o togli un filtro." />}
          columns={[
            {
              key: "title", label: "Titolo",
              render: (r) => (
                <span className={styles.titleCell}>
                  <Thumb url={r.image_url} state={r.image} size={44} />
                  <strong>{r.title}</strong>
                </span>
              ),
            },
            { key: "source", label: "Fonte", width: "150px", render: (r) => <span style={{ color: "var(--text-2)" }}>{r.source?.name ?? "—"}</span> },
            { key: "when", label: "Arrivato", width: "140px", render: (r) => <span style={{ color: "var(--text-2)" }}>{dayTime(r.created_at)}</span> },
            { key: "feed", label: "Feed", width: "104px", render: (r) => (r.in_feed ? <FeedChip /> : <span className="muted">—</span>) },
            { key: "summary", label: "Riassunto", width: "140px", render: (r) => <SummaryWord state={r.summary} /> },
            { key: "state", label: "Stato", width: "120px", render: (r) => <Status kind={r.active ? "ok" : "off"}>{r.active ? "Visibile" : "Nascosto"}</Status> },
          ]}
        />
      </Section>
      {data && state === "default" ? <Pager page={data.page} perPage={data.per_page} total={data.total} label="articoli" onPage={(p) => set({ page: p })} /> : null}
    </AdminFrame>
  );
}
