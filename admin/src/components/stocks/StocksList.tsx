"use client";

// MOB-1377: the body of /titoli (see app/titoli/page.tsx). The filters live
// in the address bar, so «‹ Titoli» from a stock page returns to the same list.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable, type Column, type TableState } from "@/components/shell/DataTable";
import { Icon } from "@/components/shell/Icon";
import { Pager, Section, StateBlock } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";
import {
  AREA_LABEL, LIST_QUERY_KEY, EMPTY_FILTERS, MIC_NAME, SORTS, TYPE_LABEL, fromSearch, hasFilters, isToday, moment, time, toQuery,
  type Facets, type Filters, type StockListPage, type StockRow,
} from "@/lib/stocks";
import { FilterMenu, SortMenu, type Choice } from "./FilterMenu";
import { CountTitle, ExchangeCell, Freshness, FreshLine, PriceCell, ReportMarks, StockCell, TypeTag } from "./parts";

/** ≥ 1280 px the table has every column; narrower, Tipo and Borsa leave it (they stay as filters and on the stock page). */
function useWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const m = window.matchMedia("(min-width: 1280px)");
    const on = () => setWide(m.matches);
    queueMicrotask(on);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

const REPORT: Choice[] = [
  { value: "snapshot", label: "Con Stock Snapshot" }, { value: "tenk", label: "Con documento 10-K" }, { value: "universe", label: "Nel perimetro dei report" },
];
const PRICE: Choice[] = [{ value: "fresh", label: "Aggiornato" }, { value: "stale", label: "Fermo da più di 3 giorni" }, { value: "never", label: "Senza prezzo" }];
const MOVE: Choice[] = [{ value: "up", label: "Su di almeno il 5%" }, { value: "down", label: "Giù di almeno il 5%" }];
const APP: Choice[] = [{ value: "visible", label: "Visibili" }, { value: "hidden", label: "Nascosti nell’app" }, { value: "secondary", label: "Quotazioni secondarie" }];

export function StocksList() {
  const { api } = useConsole();
  const router = useRouter();
  const params = useSearchParams();
  const wide = useWide();
  const [f, setF] = useState<Filters>(() => fromSearch(new URLSearchParams(params?.toString() ?? "")));
  const [data, setData] = useState<StockListPage | null>(null);
  const [state, setState] = useState<TableState>("loading");
  const [facets, setFacets] = useState<Facets | null>(null);
  const filtered = hasFilters(f);

  // The address bar follows the filters (no navigation, no reload); the stock page's «‹ Titoli» reads it back.
  const ours = useRef("");
  useEffect(() => {
    const qs = new URLSearchParams(Object.entries(toQuery(f)).map(([k, v]) => [k, String(v)])).toString();
    ours.current = qs;
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
    try {
      window.sessionStorage.setItem(LIST_QUERY_KEY, qs);
    } catch {
      // storage blocked: «‹ Titoli» opens the plain list
    }
  }, [f]);
  // A navigation to /titoli with other filters (the sidebar link) while the page stays mounted.
  const search = params?.toString() ?? "";
  useEffect(() => {
    if (search !== ours.current) queueMicrotask(() => setF(fromSearch(new URLSearchParams(search))));
  }, [search]);

  // Only the latest request may write: a slow broad search must not overwrite a newer, narrower one.
  const latest = useRef(0);
  const load = useCallback(async () => {
    const id = ++latest.current;
    setState("loading");
    try {
      const d = await api.get<StockListPage>("/stocks", toQuery(f));
      if (id !== latest.current) return;
      if (d.rows.length === 0 && d.total > 0 && f.page > 1) {
        setF({ ...f, page: 1 }); // a page past the end (an old link)
        return;
      }
      setData(d);
      setState(d.total === 0 ? (filtered ? "filtered" : "empty") : "default");
    } catch {
      if (id === latest.current) setState("error");
    }
  }, [api, f, filtered]);
  useEffect(() => {
    const t = setTimeout(load, f.q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, f.q]);

  useEffect(() => {
    api.get<Facets>("/stocks/facets").then(setFacets, () => setFacets(null));
  }, [api]);

  const set = (patch: Partial<Filters>) => setF({ ...f, ...patch, page: patch.page ?? 1 });
  const clear = () => setF({ ...EMPTY_FILTERS, q: f.q, sort: f.sort });

  const typeChoices = useMemo<Choice[]>(() => Object.entries(TYPE_LABEL).map(([v, label]) => ({ value: v, label, count: facets?.types[v] })), [facets]);
  const areaChoices = useMemo<Choice[]>(
    () => Object.entries(AREA_LABEL).map(([v, label]) => ({ value: v, label, count: facets?.areas[v], group: "area" })),
    [facets],
  );
  const micChoices = useMemo<Choice[]>(
    () => (facets?.mics ?? []).map((m) => ({ value: `mic:${m.mic}`, label: MIC_NAME[m.mic] ? `${m.mic} · ${MIC_NAME[m.mic]}` : m.mic, count: m.n, group: "mic" })),
    [facets],
  );
  const areaSelected = [...f.area, ...f.mic.map((m) => `mic:${m}`)];
  // Areas and exchanges are two filters on the server (AND): picking one kind clears the other, so the menu never adds up to nothing.
  const onArea = (values: string[]) => {
    const added = values.find((v) => !areaSelected.includes(v));
    const mics = values.filter((v) => v.startsWith("mic:")).map((v) => v.slice(4));
    const areas = values.filter((v) => !v.startsWith("mic:"));
    if (added?.startsWith("mic:")) set({ area: [], mic: mics });
    else if (added) set({ area: areas, mic: [] });
    else set({ area: areas, mic: mics });
  };

  const summary = data?.summary;
  const updated = summary?.last_quote_at
    ? isToday(summary.last_quote_at) ? `Prezzi aggiornati alle ${time(summary.last_quote_at)}` : `Prezzi aggiornati il ${moment(summary.last_quote_at)}`
    : null;
  const open = (r: StockRow) => router.push(`/titoli/scheda?id=${r.id}`);

  const columns: Column<StockRow>[] = [
    { key: "stock", label: "Titolo", render: (r) => <Link href={`/titoli/scheda?id=${r.id}`} style={{ color: "inherit", fontWeight: "inherit", display: "block", minWidth: 0, maxWidth: wide ? 280 : 190 }} onClick={(e) => e.stopPropagation()}><StockCell row={r} compact={!wide} /></Link> },
    ...(wide
      ? [
          { key: "type", label: "Tipo", width: "104px", render: (r: StockRow) => <TypeTag type={r.type} /> },
          { key: "mic", label: "Borsa", width: "96px", render: (r: StockRow) => <ExchangeCell mic={r.mic} area={r.area} /> },
        ]
      : []),
    { key: "price", label: "Prezzo", width: "104px", align: "right", render: (r) => <PriceCell row={r} /> },
    { key: "fresh", label: "Prezzo del", width: "116px", render: (r) => <Freshness row={r} /> },
    // Compact marks (the Snapshot count with its glyph) so the row fits the 1120 px column; the whole row opens the stock.
    { key: "rep", label: "Report", width: "190px", render: (r) => <ReportMarks marks={r.reports} compact /> },
  ];

  const stale = state === "error";
  return (
    <>
      <header style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <CountTitle title="Titoli" hidden={stale} count={data ? data.total : null} of={filtered || f.q ? (data?.summary.all ?? null) : undefined} />
          {filtered ? <button type="button" className="link-btn" onClick={clear}>Togli i filtri</button> : null}
        </div>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: 15, lineHeight: "21px" }}>
          Tutti gli strumenti che l’app conosce. Prezzi e storico arrivano dalle sincronizzazioni: qui si leggono, non si modificano.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          {summary ? (
            <FreshLine updated={updated} stale={summary.stale} never={summary.never} onStale={() => set({ price: ["stale"] })} onNever={() => set({ price: ["never"] })} />
          ) : state === "loading" ? <span className="skeleton" style={{ width: 380, height: 14 }} /> : <span />}
          <SortMenu value={f.sort} options={SORTS} disabled={state === "loading" || state === "error"} onChange={(sort) => set({ sort })} />
        </div>
      </header>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", flex: wide ? "0 0 240px" : "1 1 100%" }}>
          <span className="muted" style={{ position: "absolute", left: 14, display: "inline-flex" }}><Icon name="search" size={17} /></span>
          <input className="input" type="search" maxLength={100} style={{ height: 40, paddingLeft: 40 }} placeholder="Ticker, nome o CIK" aria-label="Cerca un titolo" value={f.q} onChange={(e) => set({ q: e.target.value })} />
        </span>
        <FilterMenu label="Tipo" choices={typeChoices} selected={f.type} onChange={(type) => set({ type })} />
        <FilterMenu label="Area e borsa" choices={[...areaChoices, ...micChoices]} selected={areaSelected} onChange={onArea} searchPlaceholder="Cerca una borsa" shown={13} />
        <FilterMenu label="Report" choices={REPORT} selected={f.report} onChange={(report) => set({ report })} />
        <FilterMenu label="Prezzo" choices={PRICE} selected={f.price} onChange={(price) => set({ price })} />
        <FilterMenu label="Movimento oggi" choices={MOVE} selected={f.move} onChange={(move) => set({ move })} />
        <FilterMenu label="Nell’app" choices={APP} selected={f.app} onChange={(app) => set({ app })} />
      </div>

      <Section pad="8px 8px 16px">
        <DataTable<StockRow>
          caption="Titoli"
          state={state}
          rows={data?.rows ?? []}
          rowKey={(r) => r.id}
          onRowClick={open}
          onRetry={load}
          loadingRows={10}
          errorText="Non è stato possibile caricare i titoli"
          onClearFilters={clear}
          empty={
            <StateBlock
              kind="missing"
              title={f.q ? `Nessun titolo per «${f.q}»` : "Nessun titolo"}
              body="Cerca il ticker (NVDA), il nome (Nvidia) o il CIK. I titoli che l’app non conosce non sono qui."
            />
          }
          columns={columns}
        />
        {data && state === "default" ? <Pager page={data.page} perPage={data.per_page} total={data.total} label="titoli" onPage={(page) => set({ page })} /> : null}
      </Section>
    </>
  );
}
