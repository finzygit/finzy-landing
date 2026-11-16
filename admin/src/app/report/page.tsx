"use client";

// MOB-1378 (boards ADM-REPORTS-01/02): «Report e copertura». The coverage of
// the US and EU universes on top; below, the reports (status tabs with
// counts, ticker search, type filter; a failure says why under the ticker)
// and the universe (a coverage counter opens it with that filter). Read-only.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CoverageCard, type CoveragePick } from "@/components/ai-reports/CoverageCard";
import { CountTabs, GoLink, NUM, PageTabs, ReportStatus } from "@/components/ai-reports/parts";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { PageHead, Pager, Section, StateBlock } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";
import {
  REGION_LABEL, REPORT_REASON, T, TYPE_LABEL, UNIVERSE_REASON, dateTime, marketCap, period,
  type Coverage, type CoverageGroup, type ReportPage, type ReportRow, type UniversePage, type UniverseRow,
} from "@/lib/ai-reports";

const STATUS_TABS: [string, string][] = [["all", "Tutti"], ["completed", "Completati"], ["failed", "Non riusciti"], ["archived", "Archiviati"]];
const GROUP_LABEL: Record<CoverageGroup, string> = { complete: T.cov_complete, incomplete: T.cov_incomplete, no_filing: T.cov_nofiling };
const SEL = { width: 200, height: 40 } as const;

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function ReportsTab() {
  const { api } = useConsole();
  const router = useRouter();
  const [f, setF] = useState({ status: "all", type: "", q: "", page: 1 });
  const q = useDebounced(f.q);
  const [data, setData] = useState<ReportPage | null>(null);
  const [state, setState] = useState<TableState>("loading");
  const filtered = !!(q || f.type);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const d = await api.get<ReportPage>("/reports", { status: f.status, type: f.type, q, page: f.page });
      setData(d);
      setState(d.total > 0 ? "default" : filtered || f.status !== "all" ? "filtered" : "empty");
    } catch {
      setState("error");
    }
  }, [api, f.status, f.type, f.page, q, filtered]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const tried = f.status === "failed";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <CountTabs
        label="Stato dei report"
        selected={f.status}
        onSelect={(s) => setF({ ...f, status: s, page: 1 })}
        items={STATUS_TABS.map(([k, l]) => ({ key: k, label: l, count: state === "loading" || state === "error" || !data ? null : (data.counts[k as keyof ReportPage["counts"]] ?? null) }))}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input className="input" type="search" style={{ width: 300, height: 40 }} placeholder={T.f_search} aria-label={T.f_search} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value, page: 1 })} />
        <select className="input" style={SEL} aria-label={T.f_type} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value, page: 1 })}>
          <option value="">{T.f_type}: tutti</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <Section pad="8px 8px 14px">
        <DataTable<ReportRow>
          caption="Report"
          state={state}
          rows={data?.rows ?? []}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/report/detail?id=${r.id}`)}
          onRetry={load}
          errorText={T.list_error}
          onClearFilters={() => setF({ status: "all", type: "", q: "", page: 1 })}
          empty={<StateBlock kind="empty" title={T.rep_empty_t} body={T.rep_empty_b} />}
          columns={[
            {
              key: "stock", label: "Titolo", render: (r) => (
                <div style={{ minWidth: 0 }}>
                  <strong>{r.symbol}</strong>
                  <span className="sub">{r.name ?? "—"}</span>
                  {r.status === "failed" && r.reason ? <span style={{ display: "block", fontSize: 13, color: "var(--warn)", lineHeight: "18px", marginTop: 3 }}>{REPORT_REASON[r.reason]}</span> : null}
                </div>
              ),
            },
            { key: "type", label: "Tipo", width: "160px", render: (r) => <span style={{ color: "var(--text-2)", fontSize: 14 }}>{TYPE_LABEL[r.type] ?? r.type}</span> },
            { key: "status", label: "Stato", width: "150px", render: (r) => <ReportStatus status={r.status} /> },
            { key: "period", label: "Periodo", render: (r) => <span style={{ color: r.fiscal_year ? "var(--text-2)" : "var(--text-3)", fontSize: 14 }}>{period(r)}</span> },
            { key: "when", label: tried ? "Tentato il" : "Generato il", width: "160px", render: (r) => <span style={{ color: "var(--text-2)", fontSize: 14, ...NUM }}>{dateTime(r.status === "failed" ? r.tried_at : r.generated_at ?? r.tried_at)}</span> },
          ]}
        />
        {data && state === "default" ? <Pager page={data.page} perPage={data.per_page} total={data.total} label="report" onPage={(p) => setF({ ...f, page: p })} /> : null}
      </Section>
    </div>
  );
}

function UniverseTab({ pick, onPick }: { pick: CoveragePick; onPick: (p: CoveragePick) => void }) {
  const { api } = useConsole();
  const [f, setF] = useState({ scope: "in_scope", q: "", page: 1 });
  const q = useDebounced(f.q);
  const [data, setData] = useState<UniversePage | null>(null);
  const [state, setState] = useState<TableState>("loading");
  const region = pick?.region ?? "";
  const group = pick?.group ?? "";

  const load = useCallback(async () => {
    setState("loading");
    try {
      const d = await api.get<UniversePage>("/report-coverage/members", { region, group, scope: f.scope, q, page: f.page });
      setData(d);
      setState(d.total > 0 ? "default" : q || region || group || f.scope !== "in_scope" ? "filtered" : "empty");
    } catch {
      setState("error");
    }
  }, [api, region, group, f.scope, f.page, q]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const setPick = (r: string, g: string) => {
    onPick(r || g ? { region: r || undefined, group: (g || undefined) as CoverageGroup | undefined } : null);
  };

  // A new coverage filter (from these selects or from a counter of the card
  // above) starts again from page 1.
  const pickKey = `${region}|${group}`;
  const [seenPick, setSeenPick] = useState(pickKey);
  if (seenPick !== pickKey) {
    setSeenPick(pickKey);
    setF({ ...f, page: 1 });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input className="input" type="search" style={{ width: 300, height: 40 }} placeholder={T.f_search} aria-label={T.f_search} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value, page: 1 })} />
        <select className="input" style={SEL} aria-label={T.f_region} value={region} onChange={(e) => setPick(e.target.value, group)}>
          <option value="">{T.f_region}: tutte</option>
          {Object.entries(REGION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="input" style={SEL} aria-label={T.f_cov} value={group} onChange={(e) => setPick(region, e.target.value)}>
          <option value="">{T.f_cov}: tutta</option>
          {Object.entries(GROUP_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="input" style={SEL} aria-label={T.f_scope} value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value, page: 1 })}>
          <option value="in_scope">Nei primi 100</option>
          <option value="out_of_scope">Usciti dai primi 100</option>
          <option value="all">{T.f_scope}: tutti</option>
        </select>
      </div>
      <Section pad="8px 8px 14px">
        <DataTable<UniverseRow>
          caption="Universo"
          state={state}
          rows={data?.rows ?? []}
          rowKey={(r) => `${r.region}-${r.azione_id}`}
          onRetry={load}
          errorText={T.uni_error}
          onClearFilters={() => {
            onPick(null);
            setF({ scope: "in_scope", q: "", page: 1 });
          }}
          empty={<StateBlock kind="empty" title={T.cov_empty_t} body={T.cov_empty_b} />}
          columns={[
            { key: "rank", label: "#", width: "44px", align: "right", render: (r) => <span className="muted" style={NUM}>{r.rank ?? "—"}</span> },
            { key: "stock", label: "Titolo", render: (r) => (<div style={{ minWidth: 0 }}>{r.report_id ? <Link href={`/report/detail?id=${r.report_id}`}><strong>{r.symbol}</strong></Link> : <strong>{r.symbol}</strong>}<span className="sub">{r.name ?? "—"}</span></div>) },
            { key: "exchange", label: "Borsa", width: "80px", render: (r) => <span style={{ color: "var(--text-2)", fontSize: 14 }}>{r.exchange ?? "—"}</span> },
            { key: "cap", label: "Capitalizzazione", width: "140px", align: "right", render: (r) => <span style={{ fontWeight: 550, fontSize: 14, ...NUM }}>{marketCap(r.market_cap, r.region)}</span> },
            { key: "doc", label: "Documento", width: "130px", render: (r) => <span style={{ color: r.filing_period ? "var(--text-2)" : "var(--text-3)", fontSize: 14 }}>{r.filing_period ? `${r.filing_type ?? ""} · FY${r.filing_period.slice(0, 4)}` : "—"}</span> },
            { key: "deck", label: "Presentazione", width: "140px", render: (r) => (r.report_status ? <ReportStatus status={r.report_status} /> : <span className="muted">—</span>) },
            { key: "reason", label: "Motivo", render: (r) => <span style={{ color: r.reason ? "var(--text-2)" : "var(--text-3)", fontSize: 14 }}>{r.reason ? UNIVERSE_REASON[r.reason] : "—"}</span> },
          ]}
        />
        {data && state === "default" ? <Pager page={data.page} perPage={data.per_page} total={data.total} label="titoli" onPage={(p) => setF({ ...f, page: p })} /> : null}
      </Section>
    </div>
  );
}

export default function ReportsPage() {
  const { api, can } = useConsole();
  const params = useSearchParams();
  const router = useRouter();
  const tab = params?.get("tab") === "universe" ? "universe" : "reports";
  const [cov, setCov] = useState<Coverage | null>(null);
  const [covState, setCovState] = useState<"loading" | "error" | "default">("loading");
  const [pick, setPick] = useState<CoveragePick>(null);

  const loadCoverage = useCallback(async () => {
    setCovState("loading");
    try {
      setCov(await api.get<Coverage>("/report-coverage"));
      setCovState("default");
    } catch {
      setCovState("error");
    }
  }, [api]);
  useEffect(() => {
    queueMicrotask(loadCoverage);
  }, [loadCoverage]);

  const goTab = (t: string) => router.replace(t === "universe" ? "/report?tab=universe" : "/report");

  return (
    <AdminFrame title={T.grp}>
      <PageHead title={T.rep_title} sub={T.rep_sub} crumbs={[T.grp, T.rep_title]} actions={can("console.spend.view") ? <Link href="/spend"><GoLink>{T.spend_link}</GoLink></Link> : undefined} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <CoverageCard
          data={cov}
          state={covState}
          picked={tab === "universe" ? pick : null}
          onRetry={loadCoverage}
          onPick={(p) => {
            setPick(p);
            if (p) goTab("universe");
          }}
        />
        <PageTabs tabs={[{ key: "reports", label: T.tab_reports }, { key: "universe", label: T.tab_universe }]} selected={tab} onSelect={goTab} />
        {tab === "universe" ? <UniverseTab pick={pick} onPick={setPick} /> : <ReportsTab />}
      </div>
    </AdminFrame>
  );
}
