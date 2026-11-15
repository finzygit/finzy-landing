"use client";

// MOB-1377: the body of /stocks/detail?id= (see app/stocks/detail/page.tsx).

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { Icon } from "@/components/shell/Icon";
import { Banner, Pager, Section, StateBlock, Status } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import {
  AREA_LABEL, LIST_QUERY_KEY, MIC_NAME, TYPE_LABEL, countryName, day, displayName, isToday, micLabel, moment, num, priceWhen, sourceLabel, time, usd,
  type DocumentRow, type NewsRow, type PriceRow, type ReportRow, type StockPage,
} from "@/lib/stocks";
import { EditDrawer } from "./EditDrawer";
import { ActivityList, ChangePill, KvRows, NameSource, ReadOnlyNote, StockLogo, SyncList, Tag, type SyncRow } from "./parts";
import { PriceChart, RangePicker, type Range } from "./PriceChart";

type Load<T> = { state: "loading" | "ready" | "error"; data: T | null };

function useLoad<T>(fetcher: () => Promise<T>, deps: unknown[]): Load<T> & { reload: () => void } {
  const [s, setS] = useState<Load<T>>({ state: "loading", data: null });
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    queueMicrotask(() => live && setS((p) => ({ state: "loading", data: p.data })));
    fetcher().then((data) => live && setS({ state: "ready", data }), () => live && setS({ state: "error", data: null }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller lists what the fetch depends on
  }, [...deps, n]);
  return { ...s, reload: () => setN((x) => x + 1) };
}

const TABS = ["Prezzi", "Documenti", "Report", "Notizie"] as const;

/** «‹ Titoli» returns to the list with the filters it had (StocksList keeps its query in sessionStorage). */
function listHref(): string {
  try {
    const qs = window.sessionStorage.getItem(LIST_QUERY_KEY);
    return qs ? `/stocks?${qs}` : "/stocks";
  } catch {
    return "/stocks";
  }
}

export function StockDetail() {
  const params = useSearchParams();
  const id = Number(params?.get("id"));
  const { api, can } = useConsole();
  const [stock, setStock] = useState<StockPage | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState(0);
  const [range, setRange] = useState<Range>("6M");

  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setState("missing");
      return;
    }
    setState("loading");
    try {
      setStock(await api.get<StockPage>(`/stocks/${id}`));
      setState("ready");
    } catch (e) {
      setState(e instanceof ApiError && e.status === 404 ? "missing" : "error");
    }
  }, [api, id]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const back = (
    <Link href={listHref()} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, marginBottom: 18 }}>
      <span style={{ display: "inline-flex", transform: "scaleX(-1)" }}><Icon name="chevron" size={14} /></span>Titoli
    </Link>
  );

  if (state === "missing") {
    return <StateBlock kind="missing" title="Titolo non trovato" body="Il titolo non esiste più o il link è sbagliato. Cercalo nell’elenco." action={<Link className="btn" href="/stocks">Vai ai Titoli</Link>} />;
  }
  if (state === "error") {
    return <StateBlock kind="error" title="Non è stato possibile caricare il titolo" action={<button type="button" className="btn" onClick={load}>Riprova</button>} />;
  }
  if (state === "loading" || !stock) {
    return (
      <div aria-busy="true">
        {back}
        <StateBlock kind="loading" />
      </div>
    );
  }

  const s = stock;
  const canEdit = can("console.stocks.update");
  let banner: ReactNode = null;
  if (s.price_state === "never") {
    banner = <Banner kind="info">Questo titolo è senza prezzo: la sincronizzazione non ne ha mai trovato uno. L’app non mostra il grafico.</Banner>;
  } else if (s.price_state === "stale" && s.price_at) {
    const d = priceWhen({ ...s, price_day_only: true }, false);
    if (s.not_found_at) banner = <Banner>Il prezzo è fermo dal {d}: il fornitore non lo trova dal {day(s.not_found_at.slice(0, 10))}. Non si corregge a mano.</Banner>;
    else if (s.exchange_dropped) banner = <Banner>Il prezzo è fermo dal {d}: la borsa non è più tra quelle che la sincronizzazione aggiorna. Non si corregge a mano.</Banner>;
  }

  const meta = [s.symbol, s.mic ? (MIC_NAME[s.mic] ? `${MIC_NAME[s.mic]} (${s.mic})` : s.mic) : null, s.type ? TYPE_LABEL[s.type] ?? s.type : null, countryName(s.country)]
    .filter(Boolean)
    .join(" · ");
  const src = sourceLabel(s.price_source);
  const priceLine = s.price_state === "stale" ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--warn)", fontWeight: 600, fontSize: 14 }}>
        <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--warn)" }} />
        {priceWhen({ ...s, price_day_only: true }, false)}
      </span>
      {src ? <span className="muted">· {src}</span> : null}
      {s.not_found_at ? <span className="muted">· non trovato dal {day(s.not_found_at.slice(0, 10), true)}</span> : null}
    </span>
  ) : s.price_state === "fresh" ? (
    <span className="muted" style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{[src, priceWhen(s, false)].filter(Boolean).join(" · ")}</span>
  ) : null;

  return (
    <>
      {banner}
      <header style={{ marginBottom: 26 }}>
        {back}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
              <StockLogo symbol={s.symbol} url={s.logo.provider_url ?? s.logo.uploaded_url} size={56} />
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <h1 style={{ margin: 0, fontSize: 30, lineHeight: "36px", letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>{displayName(s)}</h1>
                <span className="muted" style={{ fontSize: 14 }}>{meta}</span>
                {s.hidden || s.secondary ? (
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {s.hidden ? <Tag kind="quiet" icon="eye">Nascosto nell’app</Tag> : null}
                    {s.secondary ? <Tag kind="quiet" icon="layers">Quotazione secondaria</Tag> : null}
                  </span>
                ) : null}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {s.price !== null ? (
                <span style={{ fontSize: 40, lineHeight: "46px", fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{usd(s.price, s.type)}</span>
              ) : (
                <span style={{ fontSize: 28, lineHeight: "34px", fontWeight: 700, color: "var(--text-3)" }}>Senza prezzo</span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {s.change !== null && s.price_state === "fresh" ? <ChangePill value={s.change} /> : null}
                {priceLine}
              </div>
              {s.price !== null ? <ReadOnlyNote /> : null}
            </div>
          </div>
          {canEdit ? (
            <button type="button" className="btn" onClick={() => setEditing(true)}>
              <Icon name="edit" size={17} /> Modifica
            </button>
          ) : (
            <div style={{ maxWidth: 260, textAlign: "right" }}><ReadOnlyNote>Per modificare serve il permesso «Titoli · Modifica».</ReadOnlyNote></div>
          )}
        </div>
      </header>

      <div className="stock-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <ChartCard stock={s} range={range} onRange={setRange} />
          <section className="card" style={{ padding: "6px 24px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div role="tablist" aria-label="Dati del titolo" style={{ display: "flex", gap: 28, borderBottom: "1px solid var(--hair)", overflowX: "auto" }}>
              {TABS.map((t, i) => {
                const n = [null, s.counts.documents, s.counts.reports, s.counts.news][i];
                return (
                  <button
                    key={t}
                    id={`stock-tab-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={tab === i}
                    aria-controls="stock-tabpanel"
                    onClick={() => setTab(i)}
                    style={{ height: 52, padding: 0, background: "none", border: 0, borderBottom: `2px solid ${tab === i ? "var(--accent)" : "transparent"}`, color: tab === i ? "var(--text)" : "var(--text-2)", fontSize: 17, fontWeight: tab === i ? 650 : 500, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {n === null ? t : `${t} ${num(n)}`}
                  </button>
                );
              })}
            </div>
            <div role="tabpanel" id="stock-tabpanel" aria-labelledby={`stock-tab-${tab}`}>
              {tab === 0 ? <PricesTab stock={s} /> : tab === 1 ? <DocumentsTab stock={s} /> : tab === 2 ? <ReportsTab stock={s} /> : <NewsTab stock={s} />}
            </div>
          </section>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <Section title="Identità" pad="20px 22px">
            <IdentityRows stock={s} />
          </Section>
          <Section title="Dati e sincronizzazione" pad="20px 22px">
            <SyncList rows={syncRows(s)} />
          </Section>
          <Section
            title="Ultime modifiche"
            pad="20px 22px"
            action={can("console.admin.view") ? <Link href="/admin/audit-log" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14 }}>Registro attività<Icon name="chevron" size={14} /></Link> : undefined}
          >
            <ActivityList entries={s.activity} symbol={s.symbol} when={(iso) => moment(iso)} />
          </Section>
        </div>
      </div>
      <style>{`.stock-grid{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:24px;align-items:start}@media (max-width:1279px){.stock-grid{grid-template-columns:minmax(0,1fr)}}`}</style>

      {editing ? <EditDrawer stock={s} onClose={() => setEditing(false)} onSaved={(fresh) => (setStock(fresh), setEditing(false))} /> : null}
    </>
  );
}

function ChartCard({ stock, range, onRange }: { stock: StockPage; range: Range; onRange: (r: Range) => void }) {
  const { api } = useConsole();
  const none = stock.price_state === "never" || !stock.last_row_on;
  const chart = useLoad(() => (none ? Promise.resolve({ points: [] as [string, number][] }) : api.get<{ points: [string, number][] }>(`/stocks/${stock.id}/chart`, { range })), [stock.id, range, none]);
  const oldDay = stock.price_state === "stale" && stock.last_row_on ? ` Ultima chiusura il ${day(stock.last_row_on)}.` : "";
  return (
    <section className="card" style={{ padding: "18px 22px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      <RangePicker value={range} onChange={onRange} disabled={none} />
      <PriceChart
        points={chart.data?.points ?? []}
        state={none ? "empty" : chart.state === "loading" ? "loading" : chart.state === "error" ? "error" : "default"}
        emptyText={
          stock.price_state === "never"
            ? "Senza prezzo: nessuna chiusura da mostrare"
            : chart.state === "error"
              ? "Non è stato possibile caricare il grafico"
              : "La sincronizzazione non ha ancora trovato prezzi per questo titolo."
        }
      />
      {none ? null : <ReadOnlyNote size={12}>Chiusure giornaliere in dollari, convertite dalla valuta della borsa.{oldDay}</ReadOnlyNote>}
    </section>
  );
}

const fmt2 = (v: number | null) => (v === null ? "—" : num(v, 2));
const vol = (v: number | null) => (v === null ? "—" : v >= 1e6 ? `${num(v / 1e6, 1)} M` : v >= 1e3 ? `${num(v / 1e3, 1)} K` : num(v));

function Empty({ title, body }: { title: string; body: string }) {
  return <div style={{ padding: "16px 0 4px" }}><StateBlock kind="empty" title={title} body={body} /></div>;
}

function PricesTab({ stock }: { stock: StockPage }) {
  const { api } = useConsole();
  const [page, setPage] = useState(1);
  const rows = useLoad(() => api.get<{ rows: PriceRow[]; total: number; page: number; per_page: number }>(`/stocks/${stock.id}/prices`, { page }), [stock.id, page]);
  if (rows.state === "ready" && rows.data?.total === 0) return <Empty title="Senza prezzo" body="La sincronizzazione non ha ancora trovato prezzi per questo titolo." />;
  const state: TableState = rows.state === "loading" ? "loading" : rows.state === "error" ? "error" : "default";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <ReadOnlyNote>Le righe di prezzo si leggono soltanto: le scrive la sincronizzazione ogni sera.</ReadOnlyNote>
      <DataTable<PriceRow>
        caption="Righe di prezzo"
        state={state}
        rows={rows.data?.rows ?? []}
        rowKey={(r) => r.day}
        onRetry={rows.reload}
        errorText="Non è stato possibile caricare i prezzi"
        loadingRows={8}
        columns={[
          { key: "d", label: "Data", width: "80px", render: (r) => <span className="muted">{day(r.day, true)}</span> },
          { key: "o", label: "Apertura", align: "right", render: (r) => fmt2(r.open) },
          { key: "h", label: "Massimo", align: "right", render: (r) => fmt2(r.high) },
          { key: "l", label: "Minimo", align: "right", render: (r) => fmt2(r.low) },
          { key: "c", label: "Chiusura", align: "right", render: (r) => <strong>{fmt2(r.close)}</strong> },
          { key: "v", label: "Volume", align: "right", render: (r) => <span className="muted" style={{ whiteSpace: "nowrap" }}>{vol(r.volume)}</span> },
          { key: "s", label: "Fonte", width: "110px", render: (r) => <span className="muted" style={{ whiteSpace: "nowrap" }}>{sourceLabel(r.source) ?? "—"}</span> },
        ]}
      />
      {rows.data && state === "default" ? <Pager page={rows.data.page} perPage={rows.data.per_page} total={rows.data.total} label="giorni" onPage={setPage} /> : null}
    </div>
  );
}

function DocumentsTab({ stock }: { stock: StockPage }) {
  const { api } = useConsole();
  const docs = useLoad(() => api.get<{ rows: DocumentRow[] }>(`/stocks/${stock.id}/documents`), [stock.id]);
  if (docs.state === "loading") return <StateBlock kind="loading" />;
  if (docs.state === "error") return <StateBlock kind="error" title="Non è stato possibile caricare i documenti" action={<button type="button" className="btn" onClick={docs.reload}>Riprova</button>} />;
  const rows = docs.data?.rows ?? [];
  if (!rows.length) return <Empty title="Nessun documento SEC" body="I documenti 10-K arrivano dalla SEC solo per le società USA con CIK." />;
  const stored = rows[0].stored_at;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((d) => (
        <a key={d.id} href={d.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,0.035)", border: "1px solid var(--hair)", color: "var(--text)" }}>
          <span style={{ color: "var(--accent-soft)", display: "inline-flex" }}><Icon name="news" size={22} /></span>
          <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            <strong style={{ fontSize: 15 }}>Form {d.type ?? "10-K"}{d.year ? ` · esercizio ${d.year}` : ""}</strong>
            <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
              {[d.filed_on ? `Depositato alla SEC il ${day(d.filed_on)}` : null, d.mime ? d.mime.split("/").pop()?.toUpperCase() : null, d.size ? `${num(d.size / 1048576, 1)} MB` : null].filter(Boolean).join(" · ")}
            </span>
          </span>
          <Icon name="external" size={17} />
        </a>
      ))}
      {stored ? <ReadOnlyNote>Scaricato dalla SEC il {moment(stored).slice(0, 10)} · si aggiorna da solo a ogni deposito nuovo</ReadOnlyNote> : null}
    </div>
  );
}

const REPORT_STATUS: Record<string, [string, "ok" | "warn" | "off"]> = {
  completed: ["Completato", "ok"], failed: ["Non riuscito", "warn"], pending: ["In corso", "off"], archived: ["Archiviato", "off"],
};

function ReportsTab({ stock }: { stock: StockPage }) {
  const { api, can } = useConsole();
  const reps = useLoad(() => api.get<{ counts: Record<string, number>; rows: ReportRow[] }>(`/stocks/${stock.id}/reports`), [stock.id]);
  if (reps.state === "loading") return <StateBlock kind="loading" />;
  if (reps.state === "error") return <StateBlock kind="error" title="Non è stato possibile caricare i report" action={<button type="button" className="btn" onClick={reps.reload}>Riprova</button>} />;
  const rows = reps.data?.rows ?? [];
  if (!rows.length) return <Empty title="Nessun report per questo titolo" body="Gli Stock Snapshot si generano per i titoli nel perimetro dei report." />;
  const c = reps.data?.counts ?? {};
  const sum = [
    c.completed ? `${c.completed} ${c.completed === 1 ? "completato" : "completati"}` : null,
    c.failed ? `${c.failed} non ${c.failed === 1 ? "riuscito" : "riusciti"}` : null,
    c.archived ? `${c.archived} ${c.archived === 1 ? "archiviato" : "archiviati"}` : null,
  ].filter(Boolean).join(" · ");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sum ? <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{sum}</span> : null}
      <DataTable<ReportRow>
        caption="Report"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          {
            key: "r", label: "Report", render: (r) => (
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: 15 }}>{r.type_label}{r.period ? ` · ${r.period}` : ""}</strong>
                <span className="sub">{r.at ? `${r.status === "completed" ? "Generato il" : "Tentativo del"} ${moment(r.at)}` : ""}</span>
              </span>
            ),
          },
          { key: "s", label: "Stato", width: "150px", render: (r) => { const [w, k] = REPORT_STATUS[r.status] ?? [r.status, "off"]; return <Status kind={k}>{w}</Status>; } },
        ]}
      />
      {can("console.reports.view") ? <MoreLink href="/report">Apri in Report AI</MoreLink> : null}
    </div>
  );
}

function NewsTab({ stock }: { stock: StockPage }) {
  const { api, can } = useConsole();
  const news = useLoad(() => api.get<{ total: number; rows: NewsRow[] }>(`/stocks/${stock.id}/news`), [stock.id]);
  if (news.state === "loading") return <StateBlock kind="loading" />;
  if (news.state === "error") return <StateBlock kind="error" title="Non è stato possibile caricare gli articoli" action={<button type="button" className="btn" onClick={news.reload}>Riprova</button>} />;
  const rows = news.data?.rows ?? [];
  if (!rows.length) return <Empty title="Nessun articolo collegato" body="Quando un articolo nomina questo titolo, compare qui." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        {rows.map((n) => (
          <div key={n.id} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "14px 0", borderBottom: "1px solid var(--hair)" }}>
            <strong style={{ fontSize: 16, lineHeight: "22px" }}>{n.title}</strong>
            <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{[n.source, n.at ? moment(n.at) : null].filter(Boolean).join(" · ")}</span>
          </div>
        ))}
      </div>
      {can("console.news.view") ? <MoreLink href="/news/articles">Apri in Notizie</MoreLink> : null}
    </div>
  );
}

function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14 }}>{children}<Icon name="chevron" size={14} /></Link>
    </div>
  );
}

function IdentityRows({ stock: s }: { stock: StockPage }) {
  const logoUrl = s.logo.provider_url ?? s.logo.uploaded_url;
  const area = [s.area ? (AREA_LABEL[s.area] ?? s.area) : null, countryName(s.country)].filter(Boolean).join(" · ");
  return (
    <KvRows
      rows={[
        { label: "Nome ufficiale", value: s.name, note: <ReadOnlyNote size={12}>Dalla sincronizzazione</ReadOnlyNote> },
        { label: "Nome comune", value: s.common_name ?? <span className="muted" style={{ fontWeight: 500 }}>Nessuno</span>, note: <NameSource source={s.common_name_source} hasName={!!s.common_name} /> },
        { label: "Ticker", value: <span style={{ fontFamily: "var(--mono)" }}>{s.symbol}</span> },
        { label: "Ticker alternativi", value: s.alternatives.length ? <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>{s.alternatives.map((a) => <Tag key={a}>{a}</Tag>)}</span> : <span className="muted" style={{ fontWeight: 500 }}>Nessuno</span> },
        { label: "CIK", value: s.cik },
        { label: "Borsa", value: micLabel(s.mic) },
        { label: "Area e paese", value: area || null },
        { label: "Settore", value: s.sector },
        { label: "Valuta dei prezzi", value: "Dollari (convertiti)" },
        {
          label: "Logo",
          value: logoUrl ? (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <StockLogo symbol={s.symbol} url={logoUrl} size={32} />
              <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{s.logo.provider_url ? "Dal fornitore" : "Caricato a mano"}</span>
            </span>
          ) : <span className="muted" style={{ fontWeight: 500 }}>Nessuno: l’app mostra le iniziali</span>,
        },
        { label: "Banner dello Stock Snapshot", value: s.banner.url ? "1 banner" : <span className="muted" style={{ fontWeight: 500 }}>Nessuno</span> },
      ]}
    />
  );
}

function syncRows(s: StockPage): SyncRow[] {
  const src = sourceLabel(s.price_source);
  const rows: SyncRow[] = [];
  if (s.price_state === "never") rows.push({ label: "Prezzo", kind: "off", word: "Senza prezzo", when: "valore 0" });
  else if (s.price_state === "stale") rows.push({ label: "Prezzo", kind: "warn", word: "Fermo", when: `ultima chiusura ${priceWhen({ ...s, price_day_only: true }, false)}` });
  else rows.push({ label: "Prezzo", kind: "ok", word: "Aggiornato", when: s.price_at && isToday(s.price_at) && !s.price_day_only ? `${time(s.price_at)} di oggi` : priceWhen(s, false) });

  if (!src) rows.push({ label: "Fonte dei prezzi", kind: "off", word: "Non assegnata" });
  else if (s.not_found_at) rows.push({ label: "Fonte dei prezzi", kind: "warn", word: `${src}: non trovato`, when: `dal ${day(s.not_found_at.slice(0, 10))}` });
  else rows.push({ label: "Fonte dei prezzi", kind: "ok", word: src });

  if (s.sync.history_not_found_at && !s.last_row_on) rows.push({ label: "Storico prezzi", kind: "warn", word: "Non trovato", when: `controllato il ${moment(s.sync.history_not_found_at)}` });
  else if (!s.last_row_on) rows.push({ label: "Storico prezzi", kind: "off", word: "Mai controllato" });
  else if (s.price_state === "stale") rows.push({ label: "Storico prezzi", kind: "warn", word: "Fermo", when: `ultima riga ${day(s.last_row_on)}` });
  else rows.push({ label: "Storico prezzi", kind: "ok", word: "Controllato", when: s.sync.history_checked_at ? moment(s.sync.history_checked_at) : `ultima riga ${day(s.last_row_on)}` });

  rows.push(s.sync.fundamentals_checked_at ? { label: "Fondamentali", kind: "ok", word: "Controllati", when: moment(s.sync.fundamentals_checked_at) } : { label: "Fondamentali", kind: "off", word: "Mai controllati" });

  if (!s.cik) rows.push({ label: "Documento 10-K", kind: "off", word: "Non previsto", when: "solo società USA con CIK" });
  else rows.push(s.sync.ten_k_checked_at ? { label: "Documento 10-K", kind: "ok", word: "Controllato", when: moment(s.sync.ten_k_checked_at) } : { label: "Documento 10-K", kind: "off", word: "Mai controllato" });

  rows.push({ label: "Perimetro dei report", kind: s.universe.in ? "ok" : "off", word: s.universe.in ? "Dentro" : "Fuori", when: s.universe.day ? `elenco del ${day(s.universe.day, true)}` : null });
  rows.push(s.hidden ? { label: "Nell’app", kind: "off", word: "Nascosto", when: s.secondary ? "quotazione secondaria" : null } : { label: "Nell’app", kind: "ok", word: "Visibile" });
  return rows;
}
