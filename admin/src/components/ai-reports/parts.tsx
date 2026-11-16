"use client";

// MOB-1378 (kit Kit-ADM-REPORTS): the small parts only the «Report AI» pages
// use, on top of the shell's (Status, StateBlock, DataTable…).

import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/shell/Icon";
import { Status } from "@/components/shell/parts";
import { STATUS_WORD, T, categoryOf } from "@/lib/ai-reports";

export const NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

/** ReportStatus: a dot and a word, never colour alone. */
export function ReportStatus({ status }: { status: string }) {
  const [word, kind] = STATUS_WORD[status] ?? [status, "off"];
  return <Status kind={kind}>{word}</Status>;
}

/** CountTabs: the status of a list as chips with their counts (counts hidden while loading or on error). */
export function CountTabs({ items, selected, onSelect, label }: { items: { key: string; label: string; count: number | null }[]; selected: string; onSelect: (k: string) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((it) => {
        const on = it.key === selected;
        return (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(it.key)}
            style={{
              height: 36, padding: "0 14px", borderRadius: 999, cursor: "pointer", fontWeight: 600, fontSize: 15,
              color: on ? "var(--text)" : "var(--text-2)", background: on ? "rgba(255,255,255,0.12)" : "#121717",
              border: on ? "1px solid rgba(109,217,225,0.6)" : "1px solid rgba(255,255,255,0.1)", display: "inline-flex", alignItems: "center", gap: 8,
            }}
          >
            {it.label}{" "}
            {it.count !== null ? <span style={{ ...NUM, color: on ? "var(--accent)" : "var(--text-3)" }}>{it.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Page tabs (Report / Universo). */
export function PageTabs({ tabs, selected, onSelect }: { tabs: { key: string; label: string }[]; selected: string; onSelect: (k: string) => void }) {
  return (
    <div role="tablist" style={{ display: "flex", gap: 28, borderBottom: "1px solid var(--hair)" }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={t.key === selected}
          onClick={() => onSelect(t.key)}
          style={{
            background: "none", border: 0, padding: "10px 0 12px", cursor: "pointer", fontSize: 16, fontWeight: t.key === selected ? 650 : 500,
            color: t.key === selected ? "var(--text)" : "var(--text-2)", boxShadow: t.key === selected ? "inset 0 -2px 0 var(--accent)" : undefined,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** MetaList: label over value, one per row; a missing value reads «—» grey. */
export function MetaList({ rows }: { rows: [string, ReactNode | null][] }) {
  return (
    <dl style={{ margin: 0, display: "flex", flexDirection: "column" }}>
      {rows.map(([label, value], i) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 0", borderTop: i ? "1px solid var(--hair)" : undefined }}>
          <dt style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)" }}>{label}</dt>
          <dd style={{ margin: 0, fontSize: 15, fontWeight: 550, overflowWrap: "anywhere", ...NUM, color: value === null || value === "" ? "var(--text-3)" : undefined }}>
            {value === null || value === "" ? "—" : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** FailureBox: the reason in one sentence, what happens now, the stored message folded. No retry: a retry is a paid call. */
export function FailureBox({ title, reason, next, technical, defaultOpen = false }: { title: string; reason: string; next?: string; technical?: string | null; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section role="status" style={{ display: "flex", flexDirection: "column", gap: 10, padding: "18px 20px", borderRadius: 18, background: "rgba(242,184,75,0.07)", border: "1px solid rgba(242,184,75,0.34)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--warn)" }}>
        <Icon name="alert" size={18} />
        <strong style={{ fontSize: 16 }}>{title}</strong>
      </div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 550, lineHeight: "21px" }}>{reason}</p>
      {next ? <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", lineHeight: "20px" }}>{next}</p> : null}
      {technical ? (
        <div style={{ paddingTop: 10, borderTop: "1px solid rgba(242,184,75,0.18)" }}>
          <button type="button" className="link-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} style={{ color: "var(--text-2)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {T.tech} <Icon name={open ? "up" : "down"} size={14} />
          </button>
          {open ? (
            <div id={id} style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(0,0,0,0.35)", fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: "18px", color: "var(--text-2)", overflowWrap: "anywhere" }}>
              {technical}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** A neutral line across the page (an archived report). */
export function NoteLine({ children }: { children: ReactNode }) {
  return (
    <div role="note" style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, padding: "0 16px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-2)", fontSize: 14, fontWeight: 550 }}>
      <Icon name="info" size={17} />
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

/** A stacked bar: parts [value, colour]; a part of 0 is not drawn. */
export function StackBar({ parts, height = 10, total }: { parts: [number, string][]; height?: number; total?: number }) {
  const tot = total ?? (parts.reduce((s, [v]) => s + v, 0) || 1);
  return (
    <div aria-hidden="true" style={{ display: "flex", gap: 2, height, borderRadius: height / 2, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
      {parts.filter(([v]) => v > 0).map(([v, c], i) => (
        <span key={i} style={{ flex: `${v / tot} 1 0`, background: c }} />
      ))}
    </div>
  );
}

export function Dot({ colour, size = 8 }: { colour: string; size?: number }) {
  return <span aria-hidden="true" style={{ flex: "none", width: size, height: size, borderRadius: "50%", background: colour, display: "inline-block" }} />;
}

/** The classes of a portfolio as one bar (weights in %). */
export function CatBar({ weights, height = 8 }: { weights: [string, number | null][]; height?: number }) {
  // A class without a weight (the backend sends null) draws no segment.
  return <StackBar parts={weights.map(([k, w]) => [w ?? 0, categoryOf(k).colour])} height={height} total={100} />;
}

/** A thin bar of one weight (0–100 %); no bar for a missing weight. */
export function WeightBar({ value, colour, width = 120 }: { value: number | null; colour: string; width?: number }) {
  if (value == null) return <span aria-hidden="true" style={{ flex: "none", display: "inline-block", width }} />;
  return (
    <span aria-hidden="true" style={{ flex: "none", display: "inline-block", width, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <span style={{ display: "block", width: `${Math.max(2, Math.min(100, value))}%`, height: "100%", borderRadius: 3, background: colour }} />
    </span>
  );
}

/** «Torna a …» / «Scheda del titolo ›». */
export function GoLink({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, whiteSpace: "nowrap" }}>
      {children}
      <Icon name="chevron" size={14} />
    </span>
  );
}
