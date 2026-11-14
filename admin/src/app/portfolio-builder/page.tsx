"use client";

// MOB-1378 (boards ADM-REPORTS-04): «Portfolio Builder». Every portfolio of
// the config (All Weather «Non attivo» included) with its latest generation,
// the next automatic run, and the history of the attempts. Read-only: no
// button starts a generation (two paid AI calls each, decision 4).

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PortfolioCard } from "@/components/ai-reports/Allocation";
import { NUM, ReportStatus } from "@/components/ai-reports/parts";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { Icon } from "@/components/shell/Icon";
import { PageHead, Pager, Section, StateBlock } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";
import { T, dateTime, dayAt, listLabel, shortPortfolioReason, type BuilderPage, type GenerationRow } from "@/lib/ai-reports";

export default function PortfolioBuilderPage() {
  const { api } = useConsole();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BuilderPage | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [hist, setHist] = useState<TableState>("loading");

  const load = useCallback(async () => {
    setHist("loading");
    try {
      const d = await api.get<BuilderPage>("/portfolios", { page });
      setData(d);
      setState("ready");
      setHist(d.history.total > 0 ? "default" : "empty");
    } catch {
      setState((s) => (s === "ready" ? s : "error"));
      setHist("error");
    }
  }, [api, page]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const head = <PageHead title={T.pb_title} sub={T.pb_sub} crumbs={[T.grp, T.pb_title]} />;
  if (state === "error") {
    return (
      <AdminFrame title={T.grp}>
        {head}
        <StateBlock kind="error" title={T.pb_error} action={<button type="button" className="btn" onClick={load}>Riprova</button>} />
      </AdminFrame>
    );
  }

  return (
    <AdminFrame title={T.grp}>
      {head}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {data ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-2)", ...NUM }}>
            <Icon name="info" size={16} />
            Prossima generazione automatica: {dayAt(data.next_run)}
          </span>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {data
            ? data.portfolios.map((p) => <PortfolioCard key={p.key} p={p} />)
            : Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="card" aria-hidden="true" style={{ minHeight: 168, display: "flex", flexDirection: "column", gap: 12 }}>
                  <span className="skeleton" style={{ width: "50%", height: 18 }} />
                  <span className="skeleton" style={{ width: "30%" }} />
                  <span className="skeleton" style={{ height: 8 }} />
                </div>
              ))}
        </div>
        <Section title={T.pb_hist} note={T.pb_hist_note} pad="20px 16px 14px">
          <DataTable<GenerationRow>
            caption={T.pb_hist}
            state={hist}
            rows={data?.history.rows ?? []}
            rowKey={(r) => r.id}
            onRowClick={(r) => router.push(`/portfolio-builder/generazione?id=${r.id}`)}
            onRetry={load}
            errorText={T.pb_error}
            empty={<StateBlock kind="empty" title={T.pf_empty_t} body={T.pf_empty_b} />}
            columns={[
              { key: "pf", label: "Portafoglio", render: (r) => <strong>{r.name}</strong> },
              {
                key: "outcome", label: "Esito", render: (r) => (
                  <div>
                    <ReportStatus status={r.status === "failed" ? "gen_failed" : r.status === "pending" ? "running" : r.status} />
                    {r.status === "failed" ? <span style={{ display: "block", fontSize: 13, color: "var(--warn)", lineHeight: "18px", marginTop: 3 }}>{shortPortfolioReason(r.reason)}</span> : null}
                  </div>
                ),
              },
              { key: "prompt", label: "Prompt", width: "80px", render: (r) => <span style={{ color: "var(--text-2)", fontSize: 14 }}>v{r.prompt_version}</span> },
              { key: "list", label: "Elenco strumenti", width: "220px", render: (r) => <span style={{ color: "var(--text-2)", fontSize: 14 }}>{listLabel(r.list)}</span> },
              { key: "started", label: "Avviata", width: "150px", render: (r) => <span style={{ color: "var(--text-2)", fontSize: 14, ...NUM }}>{dateTime(r.started_at)}</span> },
              { key: "published", label: "Pubblicata", width: "150px", render: (r) => <span style={{ color: r.published_at ? "var(--text-2)" : "var(--text-3)", fontSize: 14, ...NUM }}>{dateTime(r.published_at)}</span> },
            ]}
          />
          {data && hist === "default" ? <Pager page={data.history.page} perPage={data.history.per_page} total={data.history.total} label="generazioni" onPage={setPage} /> : null}
        </Section>
      </div>
    </AdminFrame>
  );
}
