"use client";

// MOB-1378 (boards ADM-REPORTS-03): one report. The document in an isolated
// frame (PreviewPane) with its details beside it; a failure says why in one
// sentence and what the app shows now, with the stored message folded. No
// «Rigenera»: a new generation is a paid AI call (decision 4).

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PreviewPane } from "@/components/ai-reports/PreviewPane";
import { FailureBox, GoLink, MetaList, NoteLine, ReportStatus } from "@/components/ai-reports/parts";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { PageHead, StateBlock } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { REPORT_REASON, T, TYPE_LABEL, date, dateTime, languagesLabel, providerLabel, reportNext, type ReportDetail } from "@/lib/ai-reports";

export default function ReportPage() {
  const { api } = useConsole();
  const id = Number(useSearchParams()?.get("id") ?? "");
  const [d, setD] = useState<ReportDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setState("missing");
      return;
    }
    setState("loading");
    try {
      setD(await api.get<ReportDetail>(`/reports/${id}`));
      setState("ready");
    } catch (e) {
      setState(e instanceof ApiError && e.status === 404 ? "missing" : "error");
    }
  }, [api, id]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  let inner;
  if (state === "loading") inner = <StateBlock kind="loading" />;
  else if (state === "missing" || !d) {
    inner =
      state === "error" ? (
        <StateBlock kind="error" title={T.pv_error} action={<button type="button" className="btn" onClick={load}>Riprova</button>} />
      ) : (
        <StateBlock kind="missing" title={T.nf_t} body={T.nf_b} action={<Link className="btn" href="/report">{T.back_list}</Link>} />
      );
  } else {
    const failed = d.status === "failed";
    const filing = d.filing ? [d.filing.date ? `10-K del ${date(d.filing.date)}` : null, d.filing.accession].filter(Boolean).join(" · ") : null;
    const meta: [string, React.ReactNode | null][] = [
      ["Tipo", TYPE_LABEL[d.type] ?? d.type],
      ["Stato", <ReportStatus key="s" status={d.status} />],
      ["Periodo", d.fiscal_year ? `FY${d.fiscal_year}` : null],
      ["Documento di partenza", filing],
      [failed ? "Tentato il" : "Generato il", dateTime(failed ? d.tried_at : d.generated_at ?? d.tried_at)],
      ["Fornitore e modello", [providerLabel(d.provider), d.model].filter(Boolean).join(" · ") || null],
    ];
    const langs = languagesLabel(d.preview.languages);
    if (langs) meta.push(["Lingue", langs]);
    const side = (
      <aside className="card" style={{ padding: "8px 20px 18px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <MetaList rows={meta} />
        {d.azione_id ? <Link href={`/stocks/detail?id=${d.azione_id}`}><GoLink>{T.d_open_stock}</GoLink></Link> : null}
      </aside>
    );
    const main = failed && d.failure ? (
      <FailureBox title={T.fail_title} reason={REPORT_REASON[d.failure.reason]} next={reportNext(d)} technical={d.failure.technical} />
    ) : (
      <PreviewPane detail={d} />
    );
    inner = (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {d.status === "archived" ? <NoteLine>{T.archived}</NoteLine> : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 560px", minWidth: 0 }}>{main}</div>
          <div style={{ flex: "1 0 280px", maxWidth: 360, minWidth: 0 }}>{side}</div>
        </div>
      </div>
    );
  }

  return (
    <AdminFrame title={T.grp}>
      <PageHead
        title={d && state === "ready" ? `${d.symbol} · ${TYPE_LABEL[d.type] ?? d.type}` : T.rep_title}
        sub={d && state === "ready" ? (d.name ?? undefined) : undefined}
        crumbs={[T.grp, T.rep_title, ...(d && state === "ready" ? [d.symbol] : [])]}
      />
      {inner}
    </AdminFrame>
  );
}
