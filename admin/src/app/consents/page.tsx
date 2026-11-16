"use client";

// MOB-1378 (boards ADM-REPORTS-06): «Consensi», the register of the Portfolio
// Builder notice. It holds user emails: only the super admin opens it
// (decision 6; the backend checks it again, `console.super`). Search, version
// and system filters, CSV export after a confirm that says what the file
// holds; the export is recorded in the activity log by the backend.

import { useCallback, useEffect, useState } from "react";
import { NUM } from "@/components/ai-reports/parts";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { Icon } from "@/components/shell/Icon";
import { ConfirmDialog } from "@/components/shell/overlays";
import { PageHead, Pager, Section, StateBlock } from "@/components/shell/parts";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { T, dateTime, type ConsentPage, type ConsentRow } from "@/lib/ai-reports";

const SUPER = "super_admin";

function today(): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

function Register() {
  const { api, toast } = useConsole();
  const [f, setF] = useState({ q: "", version: "", os: "", page: 1 });
  const [q, setQ] = useState("");
  const [data, setData] = useState<ConsentPage | null>(null);
  const [state, setState] = useState<TableState>("loading");
  const [denied, setDenied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtered = !!(q || f.version || f.os);

  useEffect(() => {
    const t = setTimeout(() => setQ(f.q), 300);
    return () => clearTimeout(t);
  }, [f.q]);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const d = await api.get<ConsentPage>("/portfolio-consents", { q, version: f.version, os: f.os, page: f.page });
      setData(d);
      // A search with no hit says what was searched (board «ricerca vuota»); filters alone use the shell's line.
      setState(d.total > 0 ? "default" : q ? "empty" : filtered ? "filtered" : "empty");
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) setDenied(true);
      setState("error");
    }
  }, [api, q, f.version, f.os, f.page, filtered]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const exportCsv = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await api.blob("/portfolio-consents.csv", { q, version: f.version, os: f.os });
      const name = `consensi-portfolio-${today()}.csv`;
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setConfirm(false);
      toast({ title: T.cs_done_t, body: `${name} · ${data?.total ?? 0} righe` });
    } catch {
      setError(T.cs_exp_err);
    }
    setBusy(false);
  };

  if (denied) return <StateBlock kind="denied" title={T.cs_denied_t} body={T.cs_denied_b} action={<Link className="btn" href="/report">{T.back_list}</Link>} />;

  const versions = data?.versions ?? [];
  const exportBtn = (
    <button type="button" className="btn" disabled={state !== "default"} onClick={() => (setError(null), setConfirm(true))}>
      <Icon name="download" size={17} /> {T.cs_export}
    </button>
  );
  const count = data && state === "default"
    ? versions.length === 1 ? `${data.total} consensi · tutti alla versione ${versions[0]} dell’avviso` : `${data.total} consensi`
    : null;

  return (
    <>
      <PageHead title={T.cs_title} sub={T.cs_sub} crumbs={[T.grp, T.cs_title]} actions={exportBtn} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className="input" type="search" style={{ width: 300, height: 40 }} placeholder={T.cs_search} aria-label={T.cs_search} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value, page: 1 })} />
          <select className="input" style={{ width: 200, height: 40 }} aria-label="Versione" value={f.version} onChange={(e) => setF({ ...f, version: e.target.value, page: 1 })}>
            <option value="">Versione: tutte</option>
            {versions.map((v) => (
              <option key={v} value={v}>Versione {v}</option>
            ))}
          </select>
          <select className="input" style={{ width: 200, height: 40 }} aria-label="Sistema" value={f.os} onChange={(e) => setF({ ...f, os: e.target.value, page: 1 })}>
            <option value="">Sistema: tutti</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        </div>
        {count ? <span style={{ fontSize: 14, color: "var(--text-2)", ...NUM }}>{count}</span> : null}
        <Section pad="8px">
          <DataTable<ConsentRow>
            caption={T.cs_title}
            state={state}
            rows={data?.rows ?? []}
            rowKey={(r) => r.id}
            onRetry={load}
            errorText={T.cs_error}
            onClearFilters={() => setF({ q: "", version: "", os: "", page: 1 })}
            empty={
              q ? (
                <StateBlock kind="empty" title={`Nessun consenso con «${q}»`} body={T.cs_none_b} action={<button type="button" className="btn" onClick={() => setF({ q: "", version: "", os: "", page: 1 })}>Togli i filtri</button>} />
              ) : (
                <StateBlock kind="empty" title={T.cs_empty_t} body={T.cs_empty_b} />
              )
            }
            columns={[
              {
                key: "user", label: "Utente", render: (r) =>
                  r.email && r.user_id ? (
                    <Link href={`/users/detail?id=${r.user_id}`} style={{ overflowWrap: "anywhere" }}>{r.email}</Link>
                  ) : (
                    <span className="muted">{T.deleted_user}</span>
                  ),
              },
              { key: "version", label: "Versione dell’avviso", width: "180px", render: (r) => <span style={{ color: "var(--text-2)", fontSize: 14 }}>Versione {r.version}</span> },
              { key: "os", label: "Sistema", width: "120px", render: (r) => <span style={{ color: "var(--text-2)", fontSize: 14 }}>{r.os ?? "—"}</span> },
              { key: "at", label: "Accettato il", width: "180px", render: (r) => <span style={{ color: "var(--text-2)", fontSize: 14, ...NUM }}>{dateTime(r.accepted_at)}</span> },
            ]}
          />
          {data && state === "default" ? <Pager page={data.page} perPage={data.per_page} total={data.total} label="consensi" onPage={(p) => setF({ ...f, page: p })} /> : null}
        </Section>
      </div>
      {confirm && data ? (
        <ConfirmDialog
          title={T.cs_exp_t}
          message={`Il file ha ${data.total} righe, con i filtri di adesso, e le email di ${data.with_email} utenti (gli account eliminati restano senza email). Usalo solo per la richiesta per cui serve: l’esportazione resta nel registro attività.`}
          confirmLabel={T.cs_exp_ok}
          kind="primary"
          busy={busy}
          error={error}
          onConfirm={exportCsv}
          onCancel={() => setConfirm(false)}
        />
      ) : null}
    </>
  );
}

export default function ConsentsPage() {
  const { me } = useConsole();
  return (
    <AdminFrame title={T.grp}>
      {me && me.role?.key !== SUPER ? (
        <StateBlock kind="denied" title={T.cs_denied_t} body={T.cs_denied_b} action={<Link className="btn" href="/report">{T.back_list}</Link>} />
      ) : (
        <Register />
      )}
    </AdminFrame>
  );
}
