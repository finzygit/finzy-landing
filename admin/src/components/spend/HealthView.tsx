"use client";

// MOB-1461 (D444, design finzygit/finzy#750, boards ADM-ADD-05): «Salute dei
// servizi» with «Fonti dati»: today's requests to Twelve Data, MT Newswires,
// Benzinga and Adnkronos, the failed ones, the last one and a state (GET
// /health → sources). The other parts of MOB-1379 (summary, services, recent
// errors, signups) are not drawn yet.

import { clock, count } from "@/components/home/format";
import { Icon } from "@/components/shell/Icon";
import { PageHead, StateBlock, Status } from "@/components/shell/parts";
import { RefreshButton, useLoad } from "./SpendView";
import s from "./spend.module.css";
import { SOURCES, T } from "./texts";
import type { HealthData, Source } from "./types";

const MONTHS_LONG = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const longDay = (ymd: string) => `${Number(ymd.slice(8, 10)) === 1 ? "1°" : Number(ymd.slice(8, 10))} ${MONTHS_LONG[Number(ymd.slice(5, 7)) - 1]} ${ymd.slice(0, 4)}`;

function SourceRow({ src }: { src: Source }) {
  const def = SOURCES[src.key] ?? { name: src.key, desc: "", icon: "info" };
  const warn = src.status === "warn";
  return (
    <li className={s.source}>
      <span className={s.sourceIcon}>
        <Icon name={def.icon} size={18} />
      </span>
      <span className={s.sourceName}>
        <strong>{def.name}</strong>
        <span className="sub">{def.desc}</span>
      </span>
      <span>
        <Status kind={warn ? "warn" : "ok"}>{warn ? T.warn : T.ok}</Status>
      </span>
      <span className={s.calls}>
        <strong className={src.requests === 0 ? s.zero : undefined}>{count(src.requests)}</strong>
        <span className="note">{T.callsToday}</span>
      </span>
      <span className={s.facts}>
        {src.requests > 0 ? <span className={src.failed > 0 ? s.warnText : undefined}>{src.failed > 0 ? T.failedN(count(src.failed)) : T.failedNone}</span> : null}
        <span>{src.last_at ? T.lastCall(clock(src.last_at)) : T.noCall}</span>
        {src.reason ? <span className={s.warnText}>{src.reason === "failed_share" ? T.warnFail : T.warnCheck}</span> : null}
      </span>
    </li>
  );
}

export function HealthView() {
  const { data, at, failed, busy, load } = useLoad<HealthData>("/health");
  const head = (
    <PageHead
      title={T.healthTitle}
      sub={T.subHealth}
      actions={data ? (
        <div className={s.headRight}>
          {failed ? <span className={s.failed} role="alert">{T.refreshFailed(clock(at ?? new Date()))}</span> : <span className={s.updated}>{T.updated(clock(data.checked_at))}</span>}
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
          <StateBlock kind="error" title={T.pageErrorHealth} body={T.pageErrorBody} action={<button type="button" className="btn" onClick={() => !busy && void load()} aria-disabled={busy || undefined}>{T.retry}</button>} />
        ) : (
          <StateBlock kind="loading" />
        )}
      </div>
    );
  }
  const src = data.sources;
  return (
    <div className={s.page}>
      {head}
      <section className={`card ${s.card}`} aria-labelledby="hl-sources">
        <header>
          <h2 id="hl-sources">{T.sources}</h2>
          <p className="note">{T.sourcesSub(src?.counting_since ? longDay(src.counting_since) : null)}</p>
        </header>
        {src ? (
          <ul className={s.sources}>
            {src.items.map((x) => (
              <SourceRow key={x.key} src={x} />
            ))}
          </ul>
        ) : (
          <p className={`error-line ${s.empty}`} role="alert">
            <Icon name="alert" size={17} /> {T.error}
          </p>
        )}
      </section>
    </div>
  );
}
