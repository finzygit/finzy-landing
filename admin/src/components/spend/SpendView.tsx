"use client";

// MOB-1461 (D444, design finzygit/finzy#750, boards ADM-ADD-04): the «Spesa AI»
// page with the parts Carlo's dashboard asked for: the fixed Riepilogo
// (today, 7 and 30 days, the average cost of one generation), the cost per
// day by type over 30 days, the generations per type. Numbers from GET
// /ai-spend, the same AdminGrowthStats as the Home. The period-driven parts of
// MOB-1379 (budget, Dove va la spesa, failed calls) are not drawn yet.

import { useCallback, useEffect, useRef, useState } from "react";
import { clock, count, rome, span, usd, usd4 } from "@/components/home/format";
import { PageHead, StateBlock } from "@/components/shell/parts";
import { Icon } from "@/components/shell/Icon";
import { useConsole } from "@/lib/console";
import s from "./spend.module.css";
import { OTHER, T, TYPES } from "./texts";
import type { DaySpend, SpendData } from "./types";

const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const MONTHS_LONG = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const dayLabel = (ymd: string) => `${Number(ymd.slice(8, 10))} ${MONTHS[Number(ymd.slice(5, 7)) - 1]}`;
const longDay = (ymd: string) => `${Number(ymd.slice(8, 10)) === 1 ? "1°" : Number(ymd.slice(8, 10))} ${MONTHS_LONG[Number(ymd.slice(5, 7)) - 1]} ${ymd.slice(0, 4)}`;
const SERIES = [...TYPES, OTHER];
const dayTotal = (d: DaySpend) => SERIES.reduce((a, x) => a + (d[x.key] ?? 0), 0);

export function useLoad<D>(path: string) {
  const { api } = useConsole();
  const [data, setData] = useState<D | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const load = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      setData(await api.get<D>(path));
      setAt(new Date().toISOString());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [api, path]);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    queueMicrotask(() => void load());
  }, [load]);
  return { data, at, failed, busy, load };
}

export function RefreshButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button type="button" className="btn" onClick={() => !busy && onClick()} aria-disabled={busy || undefined} aria-busy={busy || undefined}>
      <span className={busy ? s.spin : undefined} style={{ display: "inline-flex" }}>
        <Icon name="pulse" size={17} />
      </span>
      {T.refresh}
    </button>
  );
}

function Tile({ label, value, foot, zero }: { label: string; value: string; foot?: string; zero?: boolean }) {
  return (
    <div className={s.tile}>
      <span className={s.tileLabel}>{label}</span>
      <strong className={`${s.tileValue} ${zero ? s.zero : ""}`}>{value}</strong>
      {foot ? <span className="note">{foot}</span> : null}
    </div>
  );
}

function Summary({ d, now }: { d: SpendData; now: string }) {
  const sm = d.summary;
  const today = rome(now);
  return (
    <section className={`card ${s.card}`} aria-labelledby="sp-summary">
      <header>
        <h2 id="sp-summary">{T.summary}</h2>
        <p className="note">{T.summarySub}</p>
      </header>
      <div className={s.tiles4}>
        <Tile label={T.today} value={usd(sm.today)} foot={T.todayUntil(`${today.d} ${MONTHS[today.m - 1]}`, clock(now))} zero={sm.today === 0} />
        <Tile label={T.d7} value={usd(sm.d7)} foot={span(sm.d7_from, now)} zero={sm.d7 === 0} />
        <Tile label={T.d30} value={usd(sm.d30)} foot={span(sm.d30_from, now)} zero={sm.d30 === 0} />
        <Tile
          label={T.avg}
          value={sm.unit_cost_30 == null ? "—" : usd4(sm.unit_cost_30)}
          foot={sm.unit_cost_30 == null ? T.avgNone : T.avgSub(usd(sm.lines_spend_30), count(sm.generations_30))}
          zero={sm.unit_cost_30 == null}
        />
      </div>
    </section>
  );
}

function ByType({ d }: { d: SpendData }) {
  const days = d.per_day;
  const sums = SERIES.map((x) => days.reduce((a, day) => a + (day[x.key] ?? 0), 0));
  const all = sums.reduce((a, b) => a + b, 0);
  const top = Math.max(0, ...days.map(dayTotal));
  const step = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find((x) => top / x <= 5) ?? 2000;
  const max = step * Math.max(1, Math.ceil(top / step));
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  return (
    <section className={`card ${s.card}`} aria-labelledby="sp-bytype">
      <header>
        <h2 id="sp-bytype">{T.byType}</h2>
        <p className="note">{T.byTypeSub}</p>
      </header>
      {all === 0 ? (
        <p className={s.empty}>{T.empty30}</p>
      ) : (
        <>
          <ul className={s.legend}>
            {SERIES.map((x, i) => (
              <li key={x.key}>
                <span className={s.dot} style={{ background: x.dot }} aria-hidden="true" />
                {x.label} {usd(sums[i])} ({Math.round((sums[i] / all) * 100)} %)
              </li>
            ))}
          </ul>
          <figure className={s.chart} aria-label={T.byType}>
            <div className={s.axis} aria-hidden="true">
              {ticks.slice().reverse().map((t) => (
                <span key={t}>{usd(t).replace(",00", "")}</span>
              ))}
            </div>
            <ol className={s.plot}>
              {days.map((day, i) => (
                <li key={day.day} className={i === days.length - 1 ? s.today : undefined}>
                  <span className={s.stack} style={{ height: `${(dayTotal(day) / max) * 100}%` }}>
                    {SERIES.map((x) =>
                      day[x.key] > 0 ? <span key={x.key} style={{ flexGrow: day[x.key], background: x.dot }} /> : null,
                    )}
                  </span>
                  <span className="sr-only">{`${dayLabel(day.day)}: ${usd(dayTotal(day))}`}</span>
                </li>
              ))}
            </ol>
            <div className={s.xaxis} aria-hidden="true">
              {days.map((day, i) => (
                <span key={day.day}>{i % 5 === 0 || i === days.length - 1 ? dayLabel(day.day) : ""}</span>
              ))}
            </div>
          </figure>
          <p className="note">{T.todayDashed}</p>
        </>
      )}
    </section>
  );
}

function Generations({ d }: { d: SpendData }) {
  const g = d.generations;
  const sum = (f: (k: (typeof TYPES)[number]["key"]) => number) => TYPES.reduce((a, t) => a + f(t.key), 0);
  const tot = { today: sum((k) => g[k]?.units.today ?? 0), d7: sum((k) => g[k]?.units.d7 ?? 0), d30: sum((k) => g[k]?.units.d30 ?? 0), all: sum((k) => g[k]?.units.all ?? 0), spend: sum((k) => g[k]?.spend.d30 ?? 0) };
  const n = (v: number) => <td className={v === 0 ? s.zero : undefined}>{count(v)}</td>;
  return (
    <section className={`card ${s.card}`} aria-labelledby="sp-gens">
      <header>
        <h2 id="sp-gens">{T.gens}</h2>
        <p className="note">{T.gensSub(d.generations_since ? longDay(d.generations_since) : null)}</p>
      </header>
      <div className={s.scroll}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">{T.hType}</th>
              <th scope="col">{T.hToday}</th>
              <th scope="col">{T.hD7}</th>
              <th scope="col">{T.hD30}</th>
              <th scope="col">{T.hAll}</th>
              <th scope="col">{T.hSpend30}</th>
              <th scope="col">{T.hAvg}</th>
            </tr>
          </thead>
          <tbody>
            {TYPES.map((t) => {
              const r = g[t.key];
              if (!r) return null;
              return (
                <tr key={t.key}>
                  <th scope="row">
                    <span className={s.name}>
                      <span className={s.dot} style={{ background: t.dot }} aria-hidden="true" />
                      <span>
                        <strong>{t.label}</strong>
                        <span className="sub">{t.unit}</span>
                      </span>
                    </span>
                  </th>
                  {n(r.units.today)}
                  {n(r.units.d7)}
                  {n(r.units.d30)}
                  {n(r.units.all)}
                  <td className={r.spend.d30 === 0 ? s.zero : undefined}>{usd(r.spend.d30)}</td>
                  <td className={r.unit_cost_30 == null ? s.zero : undefined}>{r.unit_cost_30 == null ? "—" : usd4(r.unit_cost_30)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{T.total}</th>
              {n(tot.today)}
              {n(tot.d7)}
              {n(tot.d30)}
              {n(tot.all)}
              <td className={tot.spend === 0 ? s.zero : undefined}>{usd(tot.spend)}</td>
              <td className={tot.d30 === 0 ? s.zero : undefined}>{tot.d30 === 0 ? "—" : usd4(tot.spend / tot.d30)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function SpendView() {
  // Any period: the parts drawn here do not follow it (AiSpendReport::fixed).
  const { data, at, failed, busy, load } = useLoad<SpendData>("/ai-spend?period=d30");
  const head = (
    <PageHead
      title={T.spendTitle}
      sub={T.sub}
      actions={data ? (
        <div className={s.headRight}>
          {failed ? <span className={s.failed} role="alert">{T.refreshFailed(clock(at ?? new Date()))}</span> : <span className={s.updated}>{T.updated(clock(data.period.generated_at))}</span>}
          <RefreshButton busy={busy} onClick={() => void load()} />
        </div>
      ) : undefined}
    />
  );
  if (!data) {
    return (
      <div className={s.page}>
        {head}
        {failed ? (
          <StateBlock kind="error" title={T.pageError} body={T.pageErrorBody} action={<button type="button" className="btn" onClick={() => !busy && void load()} aria-disabled={busy || undefined}>{T.retry}</button>} />
        ) : (
          <StateBlock kind="loading" />
        )}
      </div>
    );
  }
  const now = data.period.generated_at; // the server's clock, Rome
  return (
    <div className={s.page}>
      {head}
      <Summary d={data} now={now} />
      <ByType d={data} />
      <Generations d={data} />
    </div>
  );
}
