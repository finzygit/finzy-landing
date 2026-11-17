"use client";

// MOB-1377: the parts only the Titoli pages use (kit board Kit-ADM-STOCKS,
// design/v2/ui_admin_stocks.py): StockCell, TypeTag, ExchangeCell, PriceCell,
// Freshness, ReportMarks, ReadOnlyNote, NameSource, KvRows, SyncList,
// ActivityList, FreshLine, CountTitle, Tag, StockLogo. Rules from the boards:
// a price is text, never an input, and always says its source and time; a
// stale price is amber, never red; what the app hides is a grey tag, never
// a greyed row.

import { useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "@/components/shell/Icon";
import { Status, VerbChip } from "@/components/shell/parts";
import { AREA_LABEL, TYPE_LABEL, num, pct, priceWhen, staleWhy, usd, type Activity, type StockRow } from "@/lib/stocks";

const NUM: CSSProperties = { fontVariantNumeric: "tabular-nums" };
const ONE_LINE: CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const MONO: CSSProperties = { fontFamily: "var(--mono)" };

export function Tag({ kind = "neutral", icon, title, children }: { kind?: "neutral" | "accent" | "warn" | "quiet"; icon?: string; title?: string; children?: ReactNode }) {
  const look: Record<string, CSSProperties> = {
    neutral: { background: "rgba(255,255,255,0.07)", color: "var(--text-2)" },
    accent: { background: "rgba(39,204,216,0.13)", color: "var(--accent-soft)" },
    warn: { background: "rgba(242,184,75,0.12)", color: "var(--warn)" },
    quiet: { background: "transparent", color: "var(--text-3)", boxShadow: "inset 0 0 0 1px var(--hair)" },
  };
  return (
    <span
      title={title}
      aria-label={title}
      style={{ display: "inline-flex", flexShrink: 0, alignItems: "center", gap: 5, height: 24, padding: children ? "0 8px" : "0 5px", borderRadius: 8, fontSize: 12, fontWeight: 650, whiteSpace: "nowrap", ...look[kind] }}
    >
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}

/** The logo the app shows, else the initials (as the app does). */
export function StockLogo(props: { symbol: string; url?: string | null; size?: number }) {
  // A new address gets a new chance to load (key), a broken one shows the initials.
  return <LogoImage key={props.url ?? ""} {...props} />;
}

function LogoImage({ symbol, url, size = 32 }: { symbol: string; url?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const box: CSSProperties = { flex: "none", width: size, height: size, borderRadius: Math.round(size * 0.3), overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--raised)" };
  if (url && !broken) {
    // eslint-disable-next-line @next/next/no-img-element -- static export: no image optimiser
    return <img src={url} alt="" width={size} height={size} style={{ ...box, objectFit: "cover", background: "#fff" }} onError={() => setBroken(true)} />;
  }
  const initials = symbol.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
  return (
    <span aria-hidden="true" style={{ ...box, fontSize: Math.round(size * 0.36), fontWeight: 700, color: "var(--text-2)" }}>
      {initials}
    </span>
  );
}

/** Ticker bold, the tags and the name grey under it (the name cut on its line, the tags wrap whole). Compact: the tags as glyphs, the word in the tooltip. */
export function StockCell({ row, compact = false }: { row: Pick<StockRow, "symbol" | "name" | "common_name" | "hidden" | "secondary" | "logo_url">; compact?: boolean }) {
  const name = row.name || row.common_name || "";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      <StockLogo symbol={row.symbol} url={row.logo_url} />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <strong style={{ fontSize: 15, ...ONE_LINE }}>{row.symbol}</strong>
        {/* MOB-1489: the chips wrap to a new line when the cell is too narrow for both, never cut */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, minWidth: 0 }}>
          {row.hidden ? (compact ? <Tag kind="quiet" icon="eye" title="Nascosto nell’app" /> : <Tag kind="quiet" icon="eye">Nascosto nell’app</Tag>) : null}
          {row.secondary ? (compact ? <Tag kind="quiet" icon="layers" title="Quotazione secondaria" /> : <Tag kind="quiet" icon="layers">Secondaria</Tag>) : null}
          <span className="muted" style={{ flex: "1 1 60px", fontSize: 13, minWidth: 0, ...ONE_LINE }} title={name}>
            {name}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TypeTag({ type }: { type: string | null }) {
  return <span style={{ color: "var(--text-2)", fontSize: 14, ...ONE_LINE }}>{type ? (TYPE_LABEL[type] ?? type) : "—"}</span>;
}

/** MIC in monospace and the area under it; «—» when the sync never found the exchange (currencies, crypto). */
export function ExchangeCell({ mic, area, country }: { mic: string | null; area: string | null; country?: string | null }) {
  if (!mic) return <span className="muted">—</span>;
  const a = area ? (AREA_LABEL[area] ?? area) : "Area sconosciuta";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, ...MONO }}>{mic}</span>
      <span className="muted" style={{ fontSize: 12, ...ONE_LINE }}>{country && area && area !== "USA" ? `${a} · ${country}` : a}</span>
    </div>
  );
}

export function ChangePill({ value, small = false }: { value: number; small?: boolean }) {
  const flat = Math.abs(value) < 0.005;
  const style: CSSProperties = flat
    ? { background: "rgba(255,255,255,0.08)", color: "var(--text-2)" }
    : value > 0
      ? { background: "rgba(166,226,46,0.14)", color: "#b8f15a" }
      : { background: "rgba(255,69,58,0.14)", color: "#ff8a82" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: small ? 20 : 26, padding: small ? "0 6px" : "0 9px", borderRadius: 7, fontSize: small ? 12 : 14, fontWeight: 700, ...NUM, ...style }}>
      {pct(value)}
    </span>
  );
}

/** Price right-aligned, today's change under it; no price: «—», never zero. */
export function PriceCell({ row }: { row: Pick<StockRow, "price" | "change" | "type"> }) {
  if (row.price === null) return <span className="muted">—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <span style={{ fontSize: 15, fontWeight: 650, whiteSpace: "nowrap", ...NUM }}>{usd(row.price, row.type)}</span>
      {row.change !== null ? <ChangePill value={row.change} small /> : <span className="muted" style={{ fontSize: 13 }}>—</span>}
    </div>
  );
}

const amberDot = <span aria-hidden="true" style={{ flex: "none", width: 7, height: 7, borderRadius: "50%", background: "var(--warn)" }} />;

/** When the price was written: grey when fresh, amber with how old when stale, «Senza prezzo» when there is none. */
export function Freshness({ row, now }: { row: Pick<StockRow, "price_state" | "price_at" | "price_day_only" | "not_found_at">; now?: Date }) {
  if (row.price_state === "never") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-3)", fontSize: 14, fontWeight: 550, whiteSpace: "nowrap" }}>
        <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", border: "1.5px solid var(--text-3)" }} />
        Senza prezzo
      </span>
    );
  }
  if (row.price_state === "fresh") return <span style={{ color: "var(--text-2)", fontSize: 14, whiteSpace: "nowrap", ...NUM }}>{priceWhen(row)}</span>;
  const why = staleWhy(row, now);
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--warn)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", ...NUM }}>
        {amberDot}
        {row.price_at ? priceWhen({ ...row, price_day_only: true }) : "Fermo"}
      </span>
      {why ? <span style={{ paddingLeft: 14, color: "var(--warn)", opacity: 0.8, fontSize: 12, whiteSpace: "nowrap" }}>{why}</span> : null}
    </span>
  );
}

/** Snapshot (n completed), 10-K (a stored SEC document), Perimetro (today's report universe); nothing: «—». */
export function ReportMarks({ marks, compact = false }: { marks?: StockRow["reports"]; compact?: boolean }) {
  if (!marks || (!marks.snapshots && !marks.ten_k && !marks.universe)) return <span className="muted">—</span>;
  return (
    <span style={{ display: "inline-flex", gap: 6, flexWrap: "nowrap" }}>
      {marks.snapshots ? (
        <Tag kind="accent" icon="report" title={compact ? `Snapshot ${marks.snapshots}` : undefined}>
          {compact ? String(marks.snapshots) : marks.snapshots > 1 ? `Snapshot ${marks.snapshots}` : "Snapshot"}
        </Tag>
      ) : null}
      {marks.ten_k ? <Tag icon="news">10-K</Tag> : null}
      {marks.universe ? <Tag>Perimetro</Tag> : null}
    </span>
  );
}

export function ReadOnlyNote({ children = "Sola lettura: lo scrive la sincronizzazione", size = 13 }: { children?: ReactNode; size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-3)", fontSize: size, fontWeight: 500 }}>
      <Icon name="lock" size={size + 1} />
      {children}
    </span>
  );
}

export function NameSource({ source, hasName }: { source: "manual" | "ai" | null; hasName: boolean }) {
  if (source === "manual") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
        <span style={{ color: "var(--accent-soft)", display: "inline-flex" }}><Icon name="lock" size={14} /></span>
        Bloccato a mano: l’AI non lo cambia
      </span>
    );
  }
  if (source === "ai") return <span className="note">Scelto dall’AI: può cambiarlo</span>;
  return hasName ? null : <span className="note">L’app mostra il nome ufficiale</span>;
}

export type Kv = { label: string; value: ReactNode; note?: ReactNode };

/** Label / value rows of a card; a null value reads «Non disponibile». */
export function KvRows({ rows, labelWidth = 132 }: { rows: Kv[]; labelWidth?: number }) {
  return (
    <dl style={{ margin: 0, display: "flex", flexDirection: "column" }}>
      {rows.map((r, i) => (
        <div key={r.label} style={{ display: "grid", gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)`, gap: 16, padding: "12px 0", borderBottom: i === rows.length - 1 ? 0 : "1px solid var(--hair)" }}>
          <dt style={{ color: "var(--text-2)", fontSize: 14, lineHeight: "22px" }}>{r.label}</dt>
          <dd style={{ margin: 0, minWidth: 0, display: "flex", flexDirection: "column", gap: 4, fontSize: 15, fontWeight: 600, overflowWrap: "anywhere", ...NUM }}>
            {r.value === null || r.value === undefined ? <span className="muted" style={{ fontWeight: 500 }}>Non disponibile</span> : r.value}
            {r.note}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export type SyncRow = { label: string; kind: "ok" | "warn" | "off"; word: string; when?: string | null };

/** «Dati e sincronizzazione»: one row per job, its state word and its time. */
export function SyncList({ rows }: { rows: SyncRow[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {rows.map((r, i) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 48, borderBottom: i === rows.length - 1 ? 0 : "1px solid var(--hair)" }}>
          <span style={{ flex: 1, minWidth: 0, color: "var(--text-2)", fontSize: 14 }}>{r.label}</span>
          <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <Status kind={r.kind}>{r.word}</Status>
            {r.when ? <span className="muted" style={{ fontSize: 13, whiteSpace: "nowrap", ...NUM }}>{r.when}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

const VERB: Record<string, string> = { create: "Aggiunta", update: "Modifica", delete: "Tolto", remove: "Tolto" };

/** «Ultime modifiche» from the activity log: verb, what changed, who and when. */
export function ActivityList({ entries, symbol, when }: { entries: Activity[]; symbol: string; when: (iso: string | null) => string }) {
  if (!entries.length) return <p className="note" style={{ fontSize: 14, lineHeight: "20px" }}>Nessuna modifica registrata per questo titolo.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {entries.map((a, i) => (
        <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 0", borderBottom: i === entries.length - 1 ? 0 : "1px solid var(--hair)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <VerbChip kind={a.kind}>{VERB[a.event.split(".").pop() ?? ""] ?? "Modifica"}</VerbChip>
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: "22px" }}>{a.summary.startsWith(`${symbol} · `) ? a.summary.slice(symbol.length + 3) : a.summary}</span>
          </div>
          <span className="muted" style={{ fontSize: 13, ...NUM }}>
            {a.who ?? "—"} · {when(a.at)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** «Titoli 32.620», with filters «Titoli 100 di 32.620». */
export function CountTitle({ title, count, of, hidden = false }: { title: string; count: number | null; of?: number | null; hidden?: boolean }) {
  if (hidden) return <h1 style={{ margin: 0, fontSize: 28, lineHeight: "34px", letterSpacing: "-0.02em" }}>{title}</h1>;
  return (
    <h1 style={{ margin: 0, display: "inline-flex", alignItems: "baseline", gap: 12, fontSize: 28, lineHeight: "34px", letterSpacing: "-0.02em" }}>
      {title}
      {count === null ? (
        <span className="skeleton" style={{ width: 64, height: 16 }} />
      ) : (
        <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text-3)", ...NUM }}>{of !== undefined && of !== null ? `${num(count)} di ${num(of)}` : num(count)}</span>
      )}
    </h1>
  );
}

/** Under the title: when the newest price arrived, how many are stale and how many never got one (each a link to that filter). */
export function FreshLine({ updated, stale, never, onStale, onNever }: { updated: string | null; stale: number; never: number; onStale: () => void; onNever: () => void }) {
  const sep = <span className="muted" aria-hidden="true">·</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 14 }}>
      {updated ? <span style={{ color: "var(--text-2)", ...NUM }}>{updated}</span> : null}
      {stale ? (
        <>
          {updated ? sep : null}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {amberDot}
            <button type="button" className="link-btn" onClick={onStale}>{num(stale)} fermi da più di 3 giorni</button>
          </span>
        </>
      ) : null}
      {never ? (
        <>
          {sep}
          <button type="button" className="link-btn" onClick={onNever}>{num(never)} senza prezzo</button>
        </>
      ) : null}
    </div>
  );
}
