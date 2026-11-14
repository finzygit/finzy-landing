"use client";

// MOB-1373: the Home's parts (boards ADM-HOME-01…04 on finzygit/finzy#700):
// the alert row, a group card (title, link to its page, body, freshness line,
// its own loading and error), and the three groups: Spesa AI, Utenti, Notizie.

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/shell/Icon";
import { clock, count, hours, provider, span, usd, when } from "./format";
import s from "./home.module.css";
import { LINES, PLANS, T } from "./texts";
import type { AiSpend, Alert, News, Users } from "./types";

const dim = (n: number) => (n === 0 ? s.zero : undefined);

function Clock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function GoLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={s.go}>
      {children}
      <Icon name="chevron" size={15} />
    </Link>
  );
}

// ---------------------------------------------------------------- alerts

function alertLine(a: Alert, now: string): { text: string; href: string; go: string; strong: boolean } | null {
  switch (a.kind) {
    case "budget":
      return { text: T.alBudget(provider(a.provider), usd(a.spend), usd(a.budget), a.percent), href: "/costi", go: T.goAi, strong: true };
    case "customer_io":
      return { text: T.alCio(count(a.count)), href: "/servizi", go: T.goHealth, strong: false };
    case "mt_stopped": {
      const last = when(a.latest_at, now);
      return { text: last.startsWith("oggi ") ? T.alMt(hours(a.hours), clock(a.latest_at)) : T.alMtDay(hours(a.hours), last), href: "/notizie", go: T.goNews, strong: false };
    }
    default:
      return null; // a kind this page does not know yet: no row, never a blank page
  }
}

/** One amber row per problem; nothing at all when nothing is wrong. */
export function Alerts({ alerts, now }: { alerts: Alert[]; now: string }) {
  const rows = alerts.map((a) => alertLine(a, now)).filter((l) => l !== null);
  if (!rows.length) return null;
  return (
    <section className={s.alerts} aria-label="Avvisi">
      {rows.map((l, i) => (
        <div key={`${l.href}-${i}`} className={s.alert} role="status">
          <Icon name="alert" size={18} />
          <span className={l.strong ? s.alertStrong : undefined}>{l.text}</span>
          <GoLink href={l.href}>{l.go}</GoLink>
        </div>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------- group card

export type GroupState<T> = { kind: "loading" } | { kind: "error" } | { kind: "ready"; data: T };

export function GroupCard<D>({
  id,
  title,
  icon,
  href,
  go,
  state,
  onRetry,
  retrying,
  fresh,
  children,
}: {
  id: string;
  title: string;
  icon: string;
  href: string;
  go: string;
  state: GroupState<D>;
  onRetry: () => void;
  retrying: boolean;
  fresh: (d: D) => string;
  children: (d: D) => ReactNode;
}) {
  return (
    <section className={`card ${s.group}`} aria-labelledby={`g-${id}`} aria-busy={state.kind === "loading" || undefined}>
      <header className={s.groupHead}>
        <span className={s.groupIcon}>
          <Icon name={icon} size={18} />
        </span>
        <h2 id={`g-${id}`} tabIndex={-1}>
          {title}
        </h2>
        <GoLink href={href}>{go}</GoLink>
      </header>
      {state.kind === "loading" ? (
        <div className={s.skel}>
          <span className="skeleton" style={{ width: 180 }} />
          <span className="skeleton" style={{ height: 64 }} />
          <span className="skeleton" style={{ height: 64 }} />
        </div>
      ) : state.kind === "error" ? (
        <div className={s.groupError}>
          <p className="error-line" role="alert">
            <Icon name="alert" size={17} /> {T.groupError}
          </p>
          <button type="button" className="btn" onClick={() => !retrying && onRetry()} aria-disabled={retrying || undefined}>
            {T.retry}
          </button>
        </div>
      ) : (
        <>
          {children(state.data)}
          <footer className={s.fresh}>
            <Clock />
            <span>{fresh(state.data)}</span>
          </footer>
        </>
      )}
    </section>
  );
}

function Tile({ label, value, foot, big = false }: { label: string; value: string; foot?: string; big?: boolean }) {
  return (
    <div className={s.tile}>
      <span className={s.tileLabel}>{label}</span>
      <strong className={big ? s.tileBig : s.tileValue}>{value}</strong>
      {foot ? <span className="note">{foot}</span> : null}
    </div>
  );
}

function Block({ title, desc, right, children }: { title: string; desc?: string; right?: ReactNode; children?: ReactNode }) {
  return (
    <div className={s.block}>
      <div className={s.blockHead}>
        <div>
          <h3>{title}</h3>
          {desc ? <p className="note">{desc}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- the three groups

export function freshLine(latest: string | null, label: string, none: string, now: string): string {
  return latest ? `${label} ${when(latest, now)}` : none;
}

export function AiSpendBody({ d, now }: { d: AiSpend; now: string }) {
  return (
    <div className={s.aiGrid}>
      <div className={s.aiLeft}>
        <Block title={T.total} desc={T.totalDesc}>
          <div className={s.tiles2}>
            <Tile label={T.w7} value={usd(d.week)} foot={span(d.week_from, now)} big />
            <Tile label={T.mtd} value={usd(d.month)} foot={span(d.month_from, now)} big />
          </div>
        </Block>
        <p className={`note ${s.foot}`}>{T.foot}</p>
      </div>
      <table className={s.lines}>
        <thead>
          <tr>
            <th scope="col">{T.lineHead}</th>
            <th scope="col">{T.today}</th>
            <th scope="col">{T.mtd}</th>
          </tr>
        </thead>
        <tbody>
          {LINES.map((l) => {
            const v = d.lines[l.key] ?? { today: 0, month: 0 };
            return (
              <tr key={l.key}>
                <th scope="row">
                  <span className={s.lineName}>
                    <span className={s.dot} style={{ background: l.dot }} aria-hidden="true" />
                    <span>
                      <strong>{l.label}</strong>
                      <span className="sub">{l.desc}</span>
                    </span>
                  </span>
                </th>
                <td className={dim(v.today)}>{usd(v.today)}</td>
                <td className={dim(v.month)}>{usd(v.month)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function UsersBody({ d }: { d: Users }) {
  return (
    <div className={s.stack}>
      <Block title={T.newUsers} desc={T.usersDesc}>
        <div className={s.tiles3}>
          <Tile label={T.today} value={count(d.new.today)} />
          <Tile label={T.w7} value={count(d.new.d7)} />
          <Tile label={T.d30} value={count(d.new.d30)} />
        </div>
      </Block>
      <Block title={T.byPlan} right={<span className="note">{T.registered(count(d.registered))}</span>}>
        <div className={s.plans}>
          {PLANS.map((p) => (
            <div key={p.key} className={s.plan}>
              <span className={s.planLabel}>
                <span className={s.dot} style={{ background: p.dot }} aria-hidden="true" />
                {p.label}
              </span>
              <strong className={dim(d.per_plan[p.key] ?? 0)}>{count(d.per_plan[p.key] ?? 0)}</strong>
            </div>
          ))}
        </div>
      </Block>
      <Block title={T.started} desc={T.startedDesc} right={<strong className={`${s.started} ${dim(d.store_started_month) ?? ""}`}>{count(d.store_started_month)}</strong>} />
    </div>
  );
}

export function NewsBody({ d }: { d: News }) {
  const rows = [
    { label: T.collected, v: d.mt.collected },
    { label: T.selected, v: d.mt.selected },
  ];
  return (
    <Block title={T.mt} desc={T.mtDesc}>
      <table className={s.mtTable}>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">{T.mt}</span>
            </th>
            <th scope="col">{T.today}</th>
            <th scope="col">{T.w7}</th>
            <th scope="col">{T.mtd}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td className={dim(r.v.today)}>{count(r.v.today)}</td>
              <td className={dim(r.v.week)}>{count(r.v.week)}</td>
              <td className={dim(r.v.month)}>{count(r.v.month)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Block>
  );
}
