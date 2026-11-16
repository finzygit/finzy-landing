"use client";

// MOB-1376: the components only the News pages use (design/v2/ui_adm_news.py,
// board Kit-AN): the source card with its hour bars, the AI progress lines,
// the summary word, the «Nel feed» chip, the article thumbnail, the
// confidence bar, the verdict buttons, the stock logo and the filter select.

import type { ReactNode } from "react";
import { NewsIcon as Icon } from "./NewsIcon";
import { Status } from "@/components/shell/parts";
import { SOURCE_WORD, SUMMARY_WORD, ago, conf, hhmm, num, type Counts, type Link, type SourceToday, type SummaryState } from "@/lib/news";
import styles from "./news.module.css";

export function FeedChip() {
  return <span className={styles.feedChip}>Nel feed</span>;
}

export function SummaryWord({ state }: { state: SummaryState }) {
  if (state === "none") return <span className="muted" style={{ fontSize: 14 }}>{SUMMARY_WORD.none}</span>;
  return <Status kind={state === "ready" ? "ok" : state === "failed" ? "warn" : "off"}>{SUMMARY_WORD[state]}</Status>;
}

/** The picture of a row: the image, a clock while the AI works, a warning when it failed. */
export function Thumb({ url, state, size = 56 }: { url: string | null; state?: string; size?: number }) {
  const box = { width: size * 1.45, height: size, borderRadius: 12, flex: "none" as const };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" loading="lazy" style={{ ...box, objectFit: "cover" }} />;
  }
  const icon = state === "failed" ? "alert" : state === "pending" ? "clock" : null;
  return (
    <span className={styles.thumbEmpty} style={box} aria-hidden="true">
      {icon === "alert" ? <span style={{ color: "var(--warn)" }}><Icon name="alert" size={18} /></span> : icon === "clock" ? <Icon name="clock" size={18} /> : null}
    </span>
  );
}

export function StockLogo({ symbol, url, size = 36 }: { symbol: string; url: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flex: "none", background: "#fff" }} />;
  }
  return (
    <span className={styles.logo} style={{ width: size, height: size }} aria-hidden="true">
      {symbol.slice(0, 2)}
    </span>
  );
}

export function TypeChip({ type, legacy }: { type: Link["type"]; legacy?: boolean }) {
  return <span className={styles.typeChip}>{legacy ? "Storico" : type === "indirect" ? "Indiretto" : "Diretto"}</span>;
}

export function Confidence({ value }: { value: number | null }) {
  const pct = Math.round((value ?? 1) * 100);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }} aria-label={`Confidenza ${conf(value)}`}>
      <span className={styles.confTrack}>
        <span className={styles.confFill} style={{ width: `${pct}%` }} />
      </span>
      <strong style={{ fontSize: 15 }}>{conf(value)}</strong>
    </span>
  );
}

export type Verdict = "correct" | "wrong" | "remove";
const VERDICTS: [Verdict, string, string, string][] = [
  ["correct", "Giusto", "thumb-up", "G"],
  ["wrong", "Sbagliato", "thumb-down", "S"],
  ["remove", "Rimuovi", "close", "R"],
];

/** Giusto / Sbagliato / Rimuovi; the chosen verdict is marked; keys shown in the queue. */
export function VerdictButtons({ review, onVerdict, disabled, keys = false, busy }: { review: Link["review"]; onVerdict: (v: Verdict) => void; disabled?: boolean; keys?: boolean; busy?: Verdict | null }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="group" aria-label="Giudizio">
      {VERDICTS.map(([v, label, icon, key]) => (
        <button
          key={v}
          type="button"
          className={`btn ${styles.verdict}`}
          aria-pressed={v !== "remove" ? review === v : undefined}
          data-on={v !== "remove" && review === v ? "true" : undefined}
          disabled={disabled || !!busy}
          aria-busy={busy === v || undefined}
          onClick={() => onVerdict(v)}
        >
          <Icon name={icon} size={16} /> {label}
          {keys ? <kbd className={styles.kbd}>{key}</kbd> : null}
        </button>
      ))}
    </div>
  );
}

/** Collected per hour, 0–24; the current hour lighter. */
export function HourBars({ hours, now }: { hours: number[]; now?: number }) {
  const max = Math.max(1, ...hours);
  return (
    <div>
      <div className={styles.bars} role="img" aria-label="Articoli raccolti per ora">
        {hours.map((n, h) => (
          <span key={h} className={styles.bar} data-now={h === now ? "true" : undefined} style={{ height: n ? `${Math.max(4, (n / max) * 100)}%` : 0 }} title={`${h}:00 · ${n}`} />
        ))}
      </div>
      <div className={styles.axis} aria-hidden="true">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
    </div>
  );
}

/** «MT Newswires» → MT, «Adnkronos» → AD: an acronym first word, else its first two letters. */
export function initials(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return (/^[A-Z]{2,}$/.test(first) ? first : first.slice(0, 2)).slice(0, 2).toUpperCase();
}

export function SourceCard({ s, nowHour }: { s: SourceToday; nowHour?: number }) {
  const kind = s.state === "ok" ? "ok" : s.state === "stop" ? "warn" : "off";
  return (
    <section className={`card ${styles.sourceCard}`} data-state={s.state} aria-label={s.name}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className={styles.logo} style={{ width: 36, height: 36, borderRadius: 10 }} aria-hidden="true">
          {initials(s.name)}
        </span>
        <h2 style={{ margin: 0, fontSize: 20, flex: 1 }}>{s.name}</h2>
        <Status kind={kind}>{SOURCE_WORD[s.state]}</Status>
      </header>
      {s.state === "stop" ? (
        <p className={styles.stopLine}>
          <Icon name="alert" size={16} /> Nessun articolo dalle {hhmm(s.latest_at)}
        </p>
      ) : null}
      <div className={styles.figures}>
        <Figure label="Raccolti" value={s.collected} sub="da mezzanotte" />
        <Figure label="Nel feed" value={s.in_feed} sub="scelti per la Home dell’app" />
        <Figure label="Movimenti" value={s.movements} sub="solo titolo, senza testo" />
      </div>
      <HourBars hours={s.hours} now={s.state === "stop" ? undefined : nowHour} />
      <p className="note" style={{ fontSize: 14 }}>
        {s.latest_at ? `Ultimo articolo alle ${hhmm(s.latest_at)} · ${ago(s.silent_minutes)}` : "Ancora nessun articolo"}
      </p>
    </section>
  );
}

function Figure({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>{label}</span>
      <strong style={{ display: "block", fontSize: 30, lineHeight: "40px" }}>{num(value)}</strong>
      <span className="note">{sub}</span>
    </div>
  );
}

/** «101 pronti · 3 in attesa · 1 non riuscito» on one bar, out of the feed total. */
export function AiLine({ label, c, female = false }: { label: string; c: Counts; female?: boolean }) {
  const pct = (n: number) => (c.total ? `${(n / c.total) * 100}%` : "0");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{label}</strong>
        <span className="muted">su {num(c.total)}</span>
      </div>
      <div className={styles.aiTrack} aria-hidden="true">
        <span style={{ width: pct(c.ready), background: "var(--accent)" }} />
        <span style={{ width: pct(c.pending), background: "rgba(255,255,255,0.3)" }} />
        <span style={{ width: pct(c.failed), background: "var(--warn)" }} />
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <Status kind="ok">{num(c.ready)} {female ? "pronte" : "pronti"}</Status>
        <Status kind="off">{num(c.pending)} in attesa</Status>
        {c.failed ? <Status kind="warn">{num(c.failed)} non riuscit{female ? (c.failed === 1 ? "a" : "e") : c.failed === 1 ? "o" : "i"}</Status> : null}
      </div>
    </div>
  );
}

/**
 * A filter pill: the words «Periodo» or «Periodo: Oggi» on the pill, a native
 * select laid over it (keyboard, screen readers and the phone picker for free).
 */
export function FilterSelect<T extends string>({ label, value, options, onChange, always = false }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void; always?: boolean }) {
  const active = value !== options[0][0];
  const current = options.find(([v]) => v === value)?.[1];
  return (
    <label className={styles.pill} data-active={active || undefined}>
      <span aria-hidden="true">{active || always ? `${label}: ${current}` : label}</span>
      <Icon name="down" size={14} />
      <select value={value} onChange={(e) => onChange(e.target.value as T)} aria-label={label}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: [T, ReactNode][]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className={styles.tabs}>
      {tabs.map(([v, l]) => (
        <button key={v} type="button" role="tab" aria-selected={v === value} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}
