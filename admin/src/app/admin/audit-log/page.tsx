"use client";

// MOB-1372 (boards ADM-SHELL-07-registro-*, D400): who did what in the
// console. Read-only, newest first, 50 a page from the server; filters by
// person, area and kind; a row opens its detail with before and after.

import { useCallback, useEffect, useState } from "react";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { Icon } from "@/components/shell/Icon";
import { Drawer } from "@/components/shell/overlays";
import { PageHead, Pager, Section, StateBlock, VerbChip } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";
import { AREA_LABEL } from "@/lib/labels";

type Row = { id: number; at: string; who: { id: number; name: string } | null; event: string; kind: string; area: string; summary: string };
type Detail = Row & { before: Record<string, unknown> | null; after: Record<string, unknown> | null; reason: string | null; ip: string | null; user_agent: string | null };
type Page = { rows: Row[]; total: number; page: number; per_page: number };

const VERB: Record<string, string> = {
  create: "Ha creato", update: "Ha modificato", delete: "Ha eliminato", gift: "Ha regalato", revoke: "Ha revocato", remove: "Ha tolto",
  signin: "Accesso", signout: "Uscita", failed: "Codice sbagliato", locked: "Accesso bloccato", reset: "Ha azzerato", enable: "Ha attivato",
  regenerate: "Nuovi codici", export: "Ha esportato", hide: "Ha nascosto", show: "Ha mostrato",
};
const verbOf = (event: string) => VERB[event.split(".").pop() ?? ""] ?? event;
const areaOf = (a: string) => (a === "access" ? "Accesso" : AREA_LABEL[a] ?? a);
const when = (iso: string) => new Date(iso).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const KINDS: [string, string][] = [["", "Tutte le azioni"], ["create", "Creazioni"], ["update", "Modifiche"], ["delete", "Eliminazioni"], ["plan", "Piani"], ["access", "Accessi"], ["security", "Sicurezza"]];

export default function LogPage() {
  const { api } = useConsole();
  const [data, setData] = useState<Page | null>(null);
  const [state, setState] = useState<TableState>("loading");
  const [filters, setFilters] = useState({ q: "", area: "", kind: "", page: 1 });
  const [open, setOpen] = useState<Detail | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const filtered = !!(filters.q || filters.area || filters.kind);
  const [exporting, setExporting] = useState(false);
  const { toast } = useConsole();

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await api.blob("/activity.csv", { q: filters.q, area: filters.area, kind: filters.kind });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "registro-attivita.csv";
      a.click();
    } catch {
      toast({ title: "Esportazione non riuscita", body: "Riprova tra poco.", kind: "error" });
    }
    setExporting(false);
  };

  const load = useCallback(async () => {
    setState("loading");
    try {
      const d = await api.get<Page>("/activity", { q: filters.q, area: filters.area, kind: filters.kind, page: filters.page });
      setData(d);
      setState(d.total === 0 ? (filtered ? "filtered" : "empty") : "default");
    } catch {
      setState("error");
    }
  }, [api, filters, filtered]);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const show = async (r: Row) => {
    setOpenId(r.id);
    setOpen(null);
    try {
      setOpen(await api.get<Detail>(`/activity/${r.id}`));
    } catch {
      setOpenId(null);
    }
  };
  const fields = open ? Array.from(new Set([...Object.keys(open.before ?? {}), ...Object.keys(open.after ?? {})])) : [];
  const fmt = (v: unknown) => (v === undefined || v === null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

  return (
    <AdminFrame title="Registro attività">
      <PageHead title="Registro attività" sub="Chi ha fatto cosa nella console. Le righe non si possono modificare né cancellare." crumbs={["Amministrazione", "Registro attività"]} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <input className="input" style={{ width: 300, height: 40 }} placeholder="Cerca una persona o un oggetto" aria-label="Cerca" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })} />
        <select className="input" style={{ width: 200, height: 40 }} aria-label="Area" value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value, page: 1 })}>
          <option value="">Tutte le aree</option>
          <option value="access">Accesso</option>
          {Object.entries(AREA_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="input" style={{ width: 200, height: 40 }} aria-label="Azione" value={filters.kind} onChange={(e) => setFilters({ ...filters, kind: e.target.value, page: 1 })}>
          {KINDS.map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span style={{ flex: 1 }} />
        <button type="button" className="btn" disabled={state !== "default" || exporting} onClick={exportCsv}>
          <Icon name="download" size={17} /> {exporting ? "Preparazione del file…" : "Esporta CSV"}
        </button>
      </div>
      <Section pad="8px">
        <DataTable<Row>
          caption="Registro attività"
          state={state}
          rows={data?.rows ?? []}
          rowKey={(r) => r.id}
          selectedKey={openId}
          onRowClick={show}
          onRetry={load}
          errorText="Non è stato possibile caricare il registro"
          onClearFilters={() => setFilters({ q: "", area: "", kind: "", page: 1 })}
          empty={<StateBlock kind="empty" title="Ancora niente nel registro" body="Qui compaiono le modifiche fatte dalla console: utenti, piani, promozioni, impostazioni, ruoli e accessi." />}
          columns={[
            { key: "at", label: "Quando", width: "128px", render: (r) => <span className="muted">{when(r.at)}</span> },
            { key: "who", label: "Chi", width: "150px", render: (r) => <strong>{r.who?.name ?? "—"}</strong> },
            { key: "what", label: "Cosa", render: (r) => (<span style={{ display: "flex", gap: 10, alignItems: "center" }}><VerbChip kind={r.kind}>{verbOf(r.event)}</VerbChip><span style={{ color: "var(--text-2)" }}>{r.summary}</span></span>) },
            { key: "area", label: "Area", width: "140px", render: (r) => <span className="muted">{areaOf(r.area)}</span> },
          ]}
        />
      </Section>
      {data && state === "default" ? <Pager page={data.page} perPage={data.per_page} total={data.total} onPage={(p) => setFilters({ ...filters, page: p })} /> : null}

      {openId !== null ? (
        <Drawer title="Dettaglio" loading={!open} onClose={() => (setOpenId(null), setOpen(null))}>
          {open ? (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <VerbChip kind={open.kind}>{verbOf(open.event)}</VerbChip>
                <span className="muted">{new Date(open.at).toLocaleString("it-IT")}</span>
              </div>
              <strong style={{ fontSize: 17 }}>{open.who?.name ?? "—"} · {open.summary}</strong>
              {fields.length ? (
                <table className="table">
                  <thead><tr><th>Campo</th><th>Prima</th><th>Dopo</th></tr></thead>
                  <tbody>
                    {fields.map((f) => (
                      <tr key={f}><td className="muted">{f}</td><td>{fmt(open.before?.[f])}</td><td><strong>{fmt(open.after?.[f])}</strong></td></tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {open.reason ? (<div><strong style={{ fontSize: 14, color: "var(--text-2)" }}>Motivo scritto</strong><p style={{ margin: "4px 0 0" }}>«{open.reason}»</p></div>) : null}
              <div>
                <strong style={{ fontSize: 14, color: "var(--text-2)" }}>Dettagli tecnici</strong>
                <div className="kv"><span>Area</span><span>{areaOf(open.area)}</span></div>
                <div className="kv"><span>Evento</span><span>{open.event}</span></div>
                <div className="kv"><span>Indirizzo IP</span><span>{open.ip ?? "—"}</span></div>
                <div className="kv"><span>Browser</span><span style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{open.user_agent ?? "—"}</span></div>
              </div>
            </>
          ) : null}
        </Drawer>
      ) : null}
    </AdminFrame>
  );
}
