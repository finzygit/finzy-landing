"use client";

// MOB-1378 (boards ADM-REPORTS-05): one generation of the Portfolio Builder.
// Published: the classes and instruments as tables (what the app shows).
// Failed: why, in one sentence, what the app showed meanwhile and the next
// attempt; the stored message folded. In progress: a note to reload.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AllocationTable, CatLegend, InstrumentsTable } from "@/components/ai-reports/Allocation";
import { CatBar, FailureBox, GoLink, NUM, ReportStatus } from "@/components/ai-reports/parts";
import { AdminFrame } from "@/components/shell/AdminFrame";
import { PageHead, Section, StateBlock } from "@/components/shell/parts";
import { ApiError } from "@/lib/api";
import { useConsole } from "@/lib/console";
import { T, dateTime, generationNext, listLabel, longPortfolioReason, time, type Generation } from "@/lib/ai-reports";

export default function GenerationPage() {
  const { api } = useConsole();
  const id = Number(useSearchParams()?.get("id") ?? "");
  const [g, setG] = useState<Generation | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setState("missing");
      return;
    }
    setState("loading");
    try {
      setG(await api.get<Generation>(`/portfolios/${id}`));
      setState("ready");
    } catch (e) {
      setState(e instanceof ApiError && e.status === 404 ? "missing" : "error");
    }
  }, [api, id]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  let head = <PageHead title={T.pb_title} crumbs={[T.grp, T.pb_title]} />;
  let inner;
  if (state === "loading") inner = <StateBlock kind="loading" />;
  else if (state === "error") inner = <StateBlock kind="error" title={T.pb_error} action={<button type="button" className="btn" onClick={load}>Riprova</button>} />;
  else if (state === "missing" || !g) inner = <StateBlock kind="missing" title={T.g_nf_t} body={T.g_nf_b} action={<Link className="btn" href="/portfolio-builder">{T.g_back}</Link>} />;
  else {
    const when = g.status === "published" ? g.published_at : g.started_at;
    const sub = [g.risk_profile, `prompt v${g.prompt_version}`, listLabel(g.list, true)].filter(Boolean).join(" · ");
    head = <PageHead title={`${g.name} · ${dateTime(when)}`} sub={sub} crumbs={[T.grp, T.pb_title, g.name]} />;
    if (g.status === "failed" && g.failure) {
      inner = (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <FailureBox title={T.g_fail_title} reason={longPortfolioReason(g.failure.reason)} next={generationNext(g)} technical={g.failure.technical} defaultOpen />
          {g.failure.next_published ? (
            <Link href={`/portfolio-builder/detail?id=${g.failure.next_published.id}`}><GoLink>{T.g_next_link}</GoLink></Link>
          ) : null}
        </div>
      );
    } else if (g.status === "running" || g.status === "pending") {
      inner = (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <ReportStatus status="running" />
          <span style={{ fontSize: 14, color: "var(--text-2)" }}>{T.g_running}</span>
        </div>
      );
    } else {
      const weights = g.categories.map((c) => [c.category, c.weight] as [string, number]);
      inner = (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 14, color: "var(--text-2)", ...NUM }}>
            <ReportStatus status="published" />
            <span>Pubblicata alle {time(g.published_at)}{g.in_app ? " · nell’app da allora" : ""}</span>
            <span>{g.categories.length} classi · {g.instruments.length} strumenti</span>
          </div>
          <Section title={T.g_alloc} note={T.g_alloc_note}>
            <CatBar weights={weights} height={10} />
            <CatLegend cats={g.categories} />
            <AllocationTable cats={g.categories} />
          </Section>
          <Section title={T.g_instr}>
            <InstrumentsTable cats={g.categories} instruments={g.instruments} />
          </Section>
        </div>
      );
    }
  }

  return (
    <AdminFrame title={T.grp}>
      {head}
      {inner}
    </AdminFrame>
  );
}
