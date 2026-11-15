"use client";

// MOB-1375 (boards ADM-REV-01-ricavi-*, 02-pagamenti-*, 10/11 at 1024 and
// narrow): «Ricavi del mese». Month picker, six KPIs, the 12-month net trend,
// net by plan and platform, payments and refunds 50 a page from the server
// with filters, CSV export. Amounts in USD as RevenueCat sends them; months
// and times in Rome time (decision 1). The name opens the user page; the
// email is only in the CSV (decision 2).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DataTable, type TableState } from "@/components/shell/DataTable";
import { Icon } from "@/components/shell/Icon";
import { PageHead, Pager, Section, StateBlock } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";
import { dayTime, fullDay, money, monthName, monthShort, monthsBetween, monthTitle, percent, shiftMonth, time } from "./format";
import s from "./revenue.module.css";
import { fill, T } from "./texts";
import type { Revenue, RevenueRow } from "./types";

type Filters = { kind: "" | "payment" | "refund"; plan: string; platform: string; page: number };
const NO_FILTERS: Filters = { kind: "", plan: "", platform: "", page: 1 };
const CADENCE: Record<string, string> = { monthly: T.monthly, annual: T.annual };

export function RevenueView({ initialMonth }: { initialMonth?: string }) {
  const { api, can, toast } = useConsole();
  const [month, setMonth] = useState<string | undefined>(initialMonth);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [res, setRes] = useState<{ key: string; data?: Revenue; error?: boolean } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify([month ?? "", filters, retry]);

  useEffect(() => {
    let live = true;
    api.get<Revenue>("/revenue", { month, kind: filters.kind, plan: filters.plan, platform: filters.platform, page: filters.page }).then(
      (d) => live && setRes({ key, data: d }),
      () => live && setRes({ key, error: true }),
    );
    return () => {
      live = false;
    };
  }, [api, key, month, filters]);

  const loading = res?.key !== key;
  // While a new page or filter loads, the KPIs of the same month stay on screen.
  const [last, setLast] = useState<Revenue | null>(null);
  if (res?.data && res.data !== last && !loading) setLast(res.data);
  const data = res?.data && !loading ? res.data : last && last.month === (month ?? last.month) ? last : null;
  const failed = !loading && !!res?.error;
  const cur = data?.month ?? month ?? "";
  const filtered = !!(filters.kind || filters.plan || filters.platform);

  const pick = (m: string) => {
    setMonth(m);
    setFilters(NO_FILTERS);
  };
  const months = useMemo(() => (data ? monthsBetween(data.first_month ?? data.last_month, data.last_month) : []), [data]);
  const canExport = !!data?.can_export && can("console.revenue.export");
  const canOpenUser = can("console.users.view");

  const exportCsv = useCallback(async () => {
    if (!data) return;
    setExporting(true);
    try {
      const blob = await api.blob("/revenue/export.csv", { month: data.month, kind: filters.kind, plan: filters.plan, platform: filters.platform });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ricavi-${data.month}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: T.export_done, body: fill(T.export_done_sub, { m: data.month }) });
    } catch {
      toast({ title: T.export_err, body: T.export_err_sub, kind: "error" });
    }
    setExporting(false);
  }, [api, data, filters, toast]);

  const picker = data ? (
    <div className={s.monthPicker}>
      <button type="button" className="icon-btn" aria-label={T.a_prev} disabled={!months.includes(shiftMonth(cur, -1))} onClick={() => pick(shiftMonth(cur, -1))}>
        <span style={{ transform: "scaleX(-1)", display: "inline-flex" }}>
          <Icon name="chevron" size={18} />
        </span>
      </button>
      <select className={s.monthSelect} aria-label={T.a_month} value={cur} onChange={(e) => pick(e.target.value)}>
        {months.map((m) => (
          <option key={m} value={m}>
            {monthTitle(m)}
          </option>
        ))}
      </select>
      <button type="button" className="icon-btn" aria-label={T.a_next} disabled={cur >= (data?.last_month ?? cur)} onClick={() => pick(shiftMonth(cur, 1))}>
        <Icon name="chevron" size={18} />
      </button>
    </div>
  ) : null;

  const head = <PageHead title={T.rev_title} sub={T.rev_sub} crumbs={[T.group, T.rev_title]} actions={picker} />;

  if (!data && failed)
    return (
      <>
        {head}
        <StateBlock kind="error" title={T.rev_err} action={<button type="button" className="btn" onClick={() => setRetry((n) => n + 1)}>{T.retry}</button>} />
      </>
    );
  if (!data) return <StateBlock kind="loading" />;

  const t = data.totals;
  const prevName = monthName(data.previous.month);
  const delta = data.previous.net !== 0 ? (t.net - data.previous.net) / Math.abs(data.previous.net) : null;
  const empty = data.counts.all === 0;
  const maxTrend = Math.max(1, ...data.trend.map((p) => Math.max(0, p.net)));
  const state: TableState = loading ? "loading" : failed ? "error" : data.total === 0 ? (filtered ? "filtered" : "empty") : "default";

  return (
    <>
      {head}
      <div className={s.note}>
        <span>
          <Icon name="info" size={15} /> {T.rev_note}
        </span>
        {data.updated_at ? <span>{fill(T.rev_updated, { d: fullDay(data.updated_at), t: time(data.updated_at) })}</span> : null}
      </div>

      <div className={s.kpis}>
        <Kpi label={T.k_gross} value={money(t.gross)} />
        <Kpi label={T.k_comm} value={money(t.commission)} sub={T.k_comm_sub} />
        <Kpi label={T.k_tax} value={money(t.tax)} />
        <Kpi
          label={T.k_net}
          value={money(t.net)}
          hero
          sub={
            delta !== null ? (
              <>
                <span className={delta >= 0 ? s.up : s.downTxt}>{percent(delta)}</span> {fill(T.k_vs, { m: prevName })}
              </>
            ) : (
              fill(T.k_vs_prev, { m: prevName, v: money(data.previous.net) })
            )
          }
        />
        <Kpi label={T.k_pay} value={String(t.payments)} />
        <Kpi label={T.k_ref} value={String(t.refunds)} sub={t.refunds ? fill(T.k_ref_sub, { v: money(t.refunds_gross) }) : undefined} />
      </div>

      {empty ? (
        <Section>
          <StateBlock kind="empty" title={fill(T.rev_empty_t, { m: monthName(data.month) })} body={T.rev_empty_b} />
        </Section>
      ) : (
        <>
          <div className={s.charts}>
            <Section title={T.trend}>
              <div className={s.bars} role="img" aria-label={T.trend}>
                {data.trend.map((p) => (
                  <div key={p.month} className={s.bar} data-current={p.month === data.month} title={`${monthTitle(p.month)}: ${money(p.net)}`}>
                    <i style={{ height: `${Math.round((Math.max(0, p.net) / maxTrend) * 100)}%` }} />
                    <span>{monthShort(p.month)}</span>
                  </div>
                ))}
              </div>
            </Section>
            <div className={s.side}>
              <Split title={T.by_plan} rows={data.by_plan} />
              <Split title={T.by_platform} rows={data.by_platform} />
            </div>
          </div>

          <Section
            title={fill(T.payments, { m: monthName(data.month) })}
            note={T.payments_note}
          >
            <div className={s.toolbar}>
              {(
                [
                  ["", T.all, data.counts.all],
                  ["payment", T.k_pay, data.counts.payments],
                  ["refund", T.k_ref, data.counts.refunds],
                ] as const
              ).map(([k, label, n]) => (
                <button key={k} type="button" className={s.pill} aria-pressed={filters.kind === k} onClick={() => setFilters({ ...filters, kind: k, page: 1 })}>
                  {label} <em>{n}</em>
                </button>
              ))}
              <select className={s.pillSelect} aria-label={T.c_plan} value={filters.plan} onChange={(e) => setFilters({ ...filters, plan: e.target.value, page: 1 })}>
                <option value="">{T.c_plan}</option>
                {data.filters.plans.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select className={s.pillSelect} aria-label={T.c_platform} value={filters.platform} onChange={(e) => setFilters({ ...filters, platform: e.target.value, page: 1 })}>
                <option value="">{T.c_platform}</option>
                {data.filters.platforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className={s.grow} />
              {filtered && state === "default" ? <span className={s.total}>{fill(T.filtered_total, { n: data.total, v: money(data.filtered_net) })}</span> : null}
              {canExport ? (
                <button type="button" className="btn" disabled={exporting || state !== "default"} onClick={exportCsv}>
                  <Icon name="download" size={17} /> {exporting ? T.export_busy : filtered ? fill(T.export_rows, { n: data.total }) : T.export}
                </button>
              ) : null}
            </div>
            <DataTable<RevenueRow & { i: number }>
              caption={fill(T.payments, { m: monthName(data.month) })}
              state={state}
              rows={data.rows.map((r, i) => ({ ...r, i }))}
              rowKey={(r) => `${data.page}-${r.i}`}
              onRetry={() => setRetry((n) => n + 1)}
              errorText={T.rev_err}
              onClearFilters={() => setFilters(NO_FILTERS)}
              empty={<StateBlock kind="empty" title={fill(T.no_data_month, { m: monthName(data.month) })} />}
              columns={[
                {
                  key: "who",
                  label: T.c_customer,
                  render: (r) =>
                    r.user ? (
                      canOpenUser ? <Link href={`/users/detail?id=${r.user.id}`}>{r.user.name}</Link> : <strong>{r.user.name}</strong>
                    ) : (
                      <span className={s.deleted}>{T.deleted}</span>
                    ),
                },
                {
                  key: "plan",
                  label: `${T.c_plan} · ${T.c_platform}`,
                  render: (r) => (
                    <span>
                      {r.plan} · {r.platform}
                      {r.cadence ? <span className={s.sub2}>{CADENCE[r.cadence]}</span> : null}
                    </span>
                  ),
                },
                { key: "at", label: T.c_date, width: "120px", render: (r) => dayTime(r.at) },
                { key: "kind", label: T.c_kind, render: (r) => (r.kind === "refund" ? <strong>↺ {T.kind_ref}</strong> : T.kind_pay) },
                { key: "paid", label: T.c_paid, align: "right", render: (r) => <span className="muted">{money(r.paid, r.currency)}</span> },
                { key: "gross", label: T.c_gross, align: "right", render: (r) => <span className={r.gross < 0 ? s.neg : undefined}>{money(r.gross)}</span> },
                { key: "net", label: T.c_net, align: "right", render: (r) => <strong className={r.net < 0 ? s.neg : undefined}>{money(r.net)}</strong> },
              ]}
            />
            {state === "default" ? <Pager page={data.page} perPage={data.per_page} total={data.total} onPage={(p) => setFilters({ ...filters, page: p })} /> : null}
          </Section>
        </>
      )}
    </>
  );
}

function Kpi({ label, value, sub, hero = false }: { label: string; value: string; sub?: ReactNode; hero?: boolean }) {
  return (
    <div className={s.kpi} data-hero={hero}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub ? <small>{sub}</small> : null}
    </div>
  );
}

function Split({ title, rows }: { title: string; rows: { label: string; net: number; share: number }[] }) {
  return (
    <Section title={title}>
      <div>
        {rows.map((r) => (
          <div key={r.label} className={s.split}>
            <b>{r.label}</b>
            <span className={s.track}>
              <i style={{ width: `${Math.round(r.share * 100)}%` }} />
            </span>
            <span className={s.num}>{money(r.net)}</span>
            <span className={`${s.num} muted`}>{Math.round(r.share * 100)}%</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
