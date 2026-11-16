"use client";

// MOB-1378 (PreviewPane, decision 2): the AI document in a frame of its own,
// never in the panel's page.
// - The 10-K analysis: HTML the server already sanitised, in an iframe with
//   `sandbox=""` (no scripts, no same origin, no forms, no navigation) and its
//   own CSP (nothing loads), on the panel's dark page; IT / EN switch.
// - A deck: its PDF in the browser's own viewer, from a blob of the API
//   (the viewer runs apart from the console page). pdf.js is not used: it
//   would draw inside the console's own page and add a dependency.

import { useEffect, useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { StateBlock } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";
import { T, previewDocument, type ReportDetail } from "@/lib/ai-reports";

function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function pdfName(d: Pick<ReportDetail, "symbol" | "type" | "fiscal_year">): string {
  const sym = d.symbol.toUpperCase().replace(/[^A-Z0-9._-]/g, "") || "report";
  return `${sym.toLowerCase()}-${d.type}${d.fiscal_year ? `-fy${d.fiscal_year}` : ""}.pdf`;
}

export function PreviewPane({ detail, height = 720 }: { detail: ReportDetail; height?: number }) {
  const { api } = useConsole();
  const { preview } = detail;
  const [lang, setLang] = useState<"it" | "en">(preview.languages.includes("it") ? "it" : "en");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfState, setPdfState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [dl, setDl] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (preview.kind !== "pdf") return;
    let live = true;
    let url: string | null = null;
    queueMicrotask(() => live && setPdfState("loading"));
    api.blob(`/reports/${detail.id}/pdf`).then(
      (b) => {
        if (!live) return;
        url = URL.createObjectURL(new Blob([b], { type: "application/pdf" }));
        setPdfUrl(url);
        setPdfState("ready");
      },
      () => live && setPdfState("error"),
    );
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [api, detail.id, preview.kind, attempt]);

  const download = async () => {
    setDl("loading");
    try {
      saveBlob(await api.blob(`/reports/${detail.id}/pdf`), pdfName(detail));
      setDl("idle");
    } catch {
      setDl("error");
    }
  };

  let body;
  if (preview.kind === "html" && preview.html) {
    const html = preview.html[lang] ?? preview.html.en ?? preview.html.it ?? "";
    body = <iframe title={`${T.pv_title}: ${detail.title}`} sandbox="" referrerPolicy="no-referrer" srcDoc={previewDocument(html, lang)} style={{ display: "block", width: "100%", height, border: 0, background: "#0b1314" }} />;
  } else if (preview.kind === "pdf") {
    body =
      pdfState === "ready" && pdfUrl ? (
        <iframe title={`${T.pv_title}: ${detail.title}`} src={pdfUrl} referrerPolicy="no-referrer" style={{ display: "block", width: "100%", height, border: 0, background: "#3a4244" }} />
      ) : pdfState === "error" ? (
        <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StateBlock kind="error" title={T.pv_error} action={<button type="button" className="btn" onClick={() => setAttempt(attempt + 1)}>Riprova</button>} />
        </div>
      ) : (
        <div aria-busy="true" style={{ height, padding: "30px 36px", display: "flex", flexDirection: "column", gap: 12 }}>
          {["60%", "92%", "88%", "95%", "70%"].map((w, i) => (
            <span key={i} className="skeleton" style={{ width: w, height: i ? 12 : 18 }} />
          ))}
        </div>
      );
  } else {
    body = (
      <div style={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <StateBlock kind="empty" title={T.pv_unavail_t} body={T.pv_unavail_b} />
      </div>
    );
  }

  return (
    <section aria-label={T.pv_title} style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px 12px 18px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <strong style={{ fontSize: 15 }}>{T.pv_title}</strong>
          {preview.kind === "html" ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <span style={{ color: "var(--accent-soft)", display: "inline-flex" }}><Icon name="shield" size={16} /></span>
              {T.pv_isolated}
            </span>
          ) : null}
        </div>
        {preview.kind === "html" && preview.languages.length > 1 ? (
          <div className="segmented" role="group" aria-label="Lingua">
            {(["it", "en"] as const).map((l) => (
              <button key={l} type="button" style={{ minWidth: 48 }} aria-pressed={lang === l} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        ) : null}
        {detail.has_pdf ? (
          <button type="button" className="btn" style={{ height: 36, padding: "0 14px", fontSize: 14 }} disabled={dl === "loading"} aria-busy={dl === "loading" || undefined} onClick={download}>
            <Icon name="download" size={16} /> {T.pv_dl}
          </button>
        ) : null}
      </div>
      {dl === "error" ? (
        <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--hair)" }}>
          <p className="error-line" role="alert" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {T.pv_dl_error}
            <button type="button" className="link-btn" onClick={download}>Riprova</button>
          </p>
        </div>
      ) : null}
      {body}
    </section>
  );
}
