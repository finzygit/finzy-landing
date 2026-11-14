"use client";

// MOB-1198 (FZW-WEB-12): the Stock Snapshot PDFs the app has (the deck and
// the 10-K analysis) and, for a US stock, the last three 10-K filings the
// backend keeps. Our own PDFs download through the API with the session
// cookie (states: downloading, failed with Riprova); a filing kept on SEC
// EDGAR opens in a new tab. Nothing: the empty state.
import { useState } from "react";
import { useApp, useLoad } from "@/lib/app";
import { formatDate } from "@/lib/format";
import { apiPath } from "@/lib/urls";
import type { DocumentRow, StockHeader } from "@/lib/types";
import { Card, EmptyState, ErrorState, Icon, Notice, Skeleton, Spinner } from "../ui";
import { StockFoot } from "../StockFoot";

const FILING = "ten_k_filing";

function DocRow({ doc, title, sub }: { doc: DocumentRow; title: string; sub: string | null }) {
  const { api, t } = useApp();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function download() {
    const path = apiPath(doc.download_url);
    if (!path) {
      if (/^https?:\/\//i.test(doc.download_url)) window.open(doc.download_url, "_blank", "noopener,noreferrer");
      return;
    }
    setState("loading");
    try {
      const blob = await api.blob(path);
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${title.replace(/[^\w.\- ]+/g, "").trim() || "finzy"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex items-start gap-3.5 border-b border-hair py-4 last:border-b-0">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-[rgba(39,204,216,0.10)] text-accent-soft">
        <Icon name="doc" size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-row font-[650] text-ink">{title}</span>
        {sub && <span className="text-meta text-ink-3">{sub}</span>}
        {state === "error" && <Notice text={t("r_error")} action={t("retry")} onAction={download} className="mt-1" />}
      </div>
      <button
        type="button"
        onClick={download}
        disabled={state === "loading"}
        aria-busy={state === "loading" || undefined}
        aria-label={state === "loading" ? `${t("r_download")} · ${title}` : undefined}
        className="raised inline-flex h-10 flex-none items-center gap-2 rounded-control px-3.5 text-label font-semibold text-ink"
      >
        {state === "loading" ? (
          <Spinner />
        ) : (
          <>
            <Icon name="download" size={16} />
            <span className="hidden sm:inline">{t("r_download")}</span>
          </>
        )}
      </button>
    </div>
  );
}

export function ReportsTab({ stock }: { stock: StockHeader }) {
  const { api, t, lang } = useApp();
  const load = useLoad(`docs:${stock.symbol}`, () => api.get<DocumentRow[]>(`/dashboard/stocks/${encodeURIComponent(stock.symbol)}/documents`));
  const docs = load.status === "ready" ? load.data ?? [] : [];
  const snapshot = docs.filter((d) => d.kind !== FILING);
  const filings = docs.filter((d) => d.kind === FILING).slice(0, 3);

  function snapTitle(d: DocumentRow): string {
    if (d.kind === "financial_report_deck") return `${t("r_deck")} · ${stock.symbol}`;
    if (d.kind === "ten_k_analysis") return `${t("r_analysis")} · ${stock.symbol}`;
    return `${d.title ?? t("r_snapshot")} · ${stock.symbol}`;
  }
  function snapSub(d: DocumentRow): string | null {
    if (d.kind === "financial_report_deck" && d.fiscal_year) return t("report_based", { y: d.fiscal_year });
    const when = formatDate(d.date, lang, { year: true });
    return when ? t("report_updated", { d: when }) : "PDF";
  }

  let body;
  if (load.status === "loading") {
    body = (
      <Card>
        <Skeleton className="mb-3 h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  } else if (load.status === "error") {
    body = (
      <Card>
        <ErrorState title={t("err_title")} retry={t("retry")} onRetry={load.reload} />
      </Card>
    );
  } else if (snapshot.length === 0 && filings.length === 0) {
    body = (
      <Card>
        <EmptyState icon="doc" title={t("r_empty_t")} body={t("r_empty_b")} />
      </Card>
    );
  } else {
    body = (
      <>
        {snapshot.length > 0 && (
          <Card title={t("r_snapshot")} note={t("report_src")}>
            {snapshot.map((d) => (
              <DocRow key={d.download_url} doc={d} title={snapTitle(d)} sub={snapSub(d)} />
            ))}
          </Card>
        )}
        {filings.length > 0 && (
          <Card title={t("r_tenk")} note={t("edgar")}>
            {filings.map((d) => {
              const filed = formatDate(d.date, lang, { year: true });
              return <DocRow key={d.download_url} doc={d} title={`10-K ${d.fiscal_year ?? ""}`.trim()} sub={filed ? t("filed_on", { d: filed }) : null} />;
            })}
          </Card>
        )}
      </>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {body}
      <StockFoot stock={stock} />
    </div>
  );
}
