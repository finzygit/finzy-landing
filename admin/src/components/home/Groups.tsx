"use client";

// MOB-1373: the Home's parts (boards ADM-HOME-01…04 on finzygit/finzy#700):
// the alert row, a group card (title, link to its page, body, freshness line,
// its own loading and error), and the three groups: Spesa AI, Utenti, Notizie.

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/shell/Icon";
import { change, clock, count, dayShort, hours, millions, provider, span, tick, usd, usd4, when } from "./format";
import s from "./home.module.css";
import { LINES, PLANS, T, UNIT } from "./texts";
import type { AiSpend, Alert, News, Revenue, Users } from "./types";

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
      return { text: T.alBudget(provider(a.provider), usd(a.spend), usd(a.budget), a.percent), href: "/spend", go: T.goAi, strong: true };
    case "customer_io":
      return { text: T.alCio(count(a.count)), href: "/health", go: T.goHealth, strong: false };
    case "mt_stopped": {
      const last = when(a.latest_at, now);
      return { text: last.startsWith("oggi ") ? T.alMt(hours(a.hours), clock(a.latest_at)) : T.alMtDay(hours(a.hours), last), href: "/news", go: T.goNews, strong: false };
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
  const withUnits = LINES.some((l) => d.lines[l.key] && "unit_cost_30" in d.lines[l.key]);
  return (
    <div className={s.aiGrid}>
      <div className={s.aiLeft}>
        <Block title={T.total} desc={T.totalDesc}>
          <div className={s.tiles2}>
            <Tile label={T.w7} value={usd(d.week)} foot={span(d.week_from, now)} big />
            <Tile label={T.mtd} value={usd(d.month)} foot={span(d.month_from, now)} big />
          </div>
          {d.d30 !== undefined ? <Tile label={T.d30} value={usd(d.d30)} foot={d.d30_from ? span(d.d30_from, now) : undefined} big /> : null}
        </Block>
        <p className={`note ${s.foot}`}>{T.foot}</p>
      </div>
      <table className={s.lines}>
        <thead>
          <tr>
            <th scope="col">{T.lineHead}</th>
            <th scope="col">{T.today}</th>
            <th scope="col">{T.mtd}</th>
            {withUnits ? <th scope="col">{T.unitHead}</th> : null}
          </tr>
        </thead>
        <tbody>
          {LINES.map((l) => {
            const v = d.lines[l.key] ?? { today: 0, month: 0 };
            const uc = v.unit_cost_30;
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
                {withUnits ? (
                  <td className={uc == null ? s.zero : undefined}>
                    {uc == null ? "—" : usd4(uc)}
                    <span className={s.unit}>{uc == null ? UNIT[l.key].none : UNIT[l.key].one}</span>
                  </td>
                ) : null}
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
          <div className={s.tile}>
            <span className={s.tileLabel}>{T.d30}</span>
            <strong className={s.tileValue}>{count(d.new.d30)}</strong>
            {d.new.d30_previous !== undefined ? <Growth now={d.new.d30} before={d.new.d30_previous} /> : null}
          </div>
        </div>
      </Block>
      {d.per_day ? (
        <Block title={T.perDay} desc={T.perDaySub}>
          <DayBars days={d.per_day} />
        </Block>
      ) : null}
      <Block title={T.byPlan} right={<span className="note">{T.registered(count(d.registered))}</span>}>
        {/* MOB-1487: a count longer than «999.999» does not fit four tiles in a row: they go two by two */}
        <div className={s.plans} data-wide={PLANS.some((p) => count(d.per_plan[p.key] ?? 0).length > 7)}>
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

/** MOB-1461: the change against the 30 days before (lime up, red down, grey equal; «—» when there was nobody before). */
export function Growth({ now, before }: { now: number; before: number }) {
  if (before === 0) {
    return (
      <span className={s.growth}>
        <span className={s.pill} data-tone="flat">—</span>
        <span className="note">{T.growthNone}</span>
      </span>
    );
  }
  const pct = ((now - before) / before) * 100;
  const tone = Math.abs(pct) < 0.05 ? "flat" : pct > 0 ? "up" : "down";
  return (
    <span className={s.growth}>
      <span className={s.pill} data-tone={tone}>
        {change(pct)}
      </span>
      <span className="note">{T.growthPrev(count(before))}</span>
    </span>
  );
}

/** MOB-1461: new users per day, 30 bars, the last one (today) dashed. */
export function DayBars({ days }: { days: { day: string; count: number }[] }) {
  const top = Math.max(0, ...days.map((x) => x.count));
  if (top === 0) return <p className="note">{T.perDayEmpty}</p>;
  const step = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000].find((x) => top / x <= 3) ?? 10000;
  const max = step * Math.ceil(top / step);
  const ticks = [0, step, 2 * step, 3 * step].filter((t) => t <= max);
  return (
    <figure className={s.bars} aria-label={T.perDay}>
      <div className={s.barsAxis} aria-hidden="true">
        {ticks.slice().reverse().map((t) => (
          <span key={t}>{count(t)}</span>
        ))}
      </div>
      <ol className={s.barsPlot}>
        {days.map((x, i) => (
          <li key={x.day} className={i === days.length - 1 ? s.barToday : undefined} title={`${dayShort(x.day)}: ${count(x.count)}`}>
            <span className={s.bar} style={{ height: `${(x.count / max) * 100}%` }} />
            <span className="sr-only">{`${dayShort(x.day)}: ${count(x.count)}`}</span>
          </li>
        ))}
      </ol>
      <div className={s.barsX} aria-hidden="true">
        {days.map((x, i) => (
          <span key={x.day}>{tick(i, days.length) ? dayShort(x.day) : ""}</span>
        ))}
      </div>
    </figure>
  );
}

/** MOB-1461: the MRR, one figure. */
export function RevenueBody({ d }: { d: Revenue }) {
  return (
    <Block title={T.mrr} desc={T.mrrDesc}>
      <strong className={`${s.tileBig} ${dim(d.mrr) ?? ""}`}>{usd(d.mrr)}</strong>
      {d.mrr === 0 ? <span className="note">{T.mrrNone}</span> : null}
    </Block>
  );
}

export function NewsBody({ d }: { d: News }) {
  const rows = [
    { label: T.collected, v: d.mt.collected },
    { label: T.selected, v: d.mt.selected },
  ];
  return (
    <div className={s.stack}>
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
      {d.archive ? (
        <Block title={T.archive} desc={T.archiveDesc}>
          <table className={s.mtTable}>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">{T.archive}</span>
                </th>
                <th scope="col">{T.w7}</th>
                <th scope="col">{T.d30}</th>
                <th scope="col">{T.allTime}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{T.archiveRow}</th>
                <td className={dim(d.archive.d7)}>{count(d.archive.d7)}</td>
                <td className={dim(d.archive.d30)}>{count(d.archive.d30)}</td>
                <td className={dim(d.archive.all)}>{count(d.archive.all)}</td>
              </tr>
            </tbody>
          </table>
        </Block>
      ) : null}
      {d.price_points !== undefined ? (
        <Block title={T.points} desc={T.pointsDesc} right={<strong className={`${s.started} ${dim(d.price_points) ?? ""}`}>{d.price_points >= 1_000_000 ? T.mln(millions(d.price_points)) : count(d.price_points)}</strong>} />
      ) : null}
    </div>
  );
}
