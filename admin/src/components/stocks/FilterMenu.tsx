"use client";

// MOB-1377: a filter pill that opens a menu of choices with their counts
// (boards ADM-STOCKS-01-lista-menu-*). Several choices of one menu add up
// (OR); the pill shows the first and «+N». Escape or a click outside closes it.
// Also the sort pill («Ordina: …»), a menu with one choice.

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/shell/Icon";
import { num } from "@/lib/stocks";

export type Choice = { value: string; label: string; count?: number; group?: string };

/** Closes on a click outside, on Escape (focus back to the trigger) and when the focus leaves the menu (Tab). */
function useOutside(open: boolean, close: () => void, trigger: { current: HTMLButtonElement | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
      trigger.current?.focus();
    };
    const focus = (e: FocusEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) close();
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("focusin", focus);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("focusin", focus);
      window.removeEventListener("keydown", key);
    };
  }, [open, close, trigger]);
  return ref;
}

const pill = (active: boolean): CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6, height: 40, padding: "0 14px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
  background: active ? "rgba(39,204,216,0.10)" : "#121717", border: `1px solid ${active ? "rgba(39,216,199,0.45)" : "rgba(255,255,255,0.12)"}`,
  color: "var(--text)", fontSize: 15, fontWeight: 600,
});

const panel: CSSProperties = {
  position: "absolute", zIndex: 30, top: 46, left: 0, minWidth: 260, maxHeight: 420, overflowY: "auto", padding: "6px 0", borderRadius: 18,
  background: "var(--menu-bg)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
};

export function FilterMenu({
  label,
  choices,
  selected,
  onChange,
  searchPlaceholder,
  shown = 12,
}: {
  label: string;
  choices: Choice[];
  selected: string[];
  onChange: (values: string[]) => void;
  /** A search box at the top (Area e borsa: 30 exchanges). */
  searchPlaceholder?: string;
  /** Choices drawn before «+ altre N: scrivi per cercarle» (with a search box only). */
  shown?: number;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    setQ("");
  }, []);
  const ref = useOutside(open, close, trigger);
  const id = useId();
  // A value not among the choices (counts not loaded yet, an exchange from an old link) still shows, raw.
  const firstValue = selected[0];
  const first = choices.find((c) => c.value === firstValue);
  const firstLabel = first ? first.label : firstValue?.replace(/^mic:/, "");
  const value = firstLabel ? `${firstLabel}${selected.length > 1 ? ` +${selected.length - 1}` : ""}` : null;
  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    const hits = t ? choices.filter((c) => c.label.toLowerCase().includes(t) || c.value.toLowerCase().includes(t)) : choices;
    return searchPlaceholder && !t ? hits.slice(0, shown) : hits;
  }, [choices, q, searchPlaceholder, shown]);
  const hidden = searchPlaceholder && !q.trim() ? Math.max(0, choices.length - shown) : 0;
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
        <button ref={trigger} type="button" style={pill(!!value)} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => (open ? close() : setOpen(true))}>
          {label}
          {value ? <span style={{ color: "var(--accent-soft)", fontWeight: 650 }}>{value}</span> : null}
          <Icon name="down" size={15} />
        </button>
        {value ? (
          <button type="button" className="link-btn" aria-label={`Togli il filtro ${label}`} style={{ marginLeft: 4, padding: 6, color: "var(--text-3)" }} onClick={() => onChange([])}>
            <Icon name="close" size={13} />
          </button>
        ) : null}
      </span>
      {open ? (
        <div id={id} role="group" aria-label={label} style={panel}>
          {searchPlaceholder ? (
            <div style={{ padding: "6px 10px 8px" }}>
              <input className="input" style={{ height: 38, fontSize: 14 }} placeholder={searchPlaceholder} aria-label={searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            </div>
          ) : null}
          {visible.map((c, i) => (
            <div key={c.value}>
              {i > 0 && c.group && visible[i - 1].group !== c.group ? <div style={{ height: 1, margin: "6px 14px", background: "var(--hair)" }} /> : null}
              <label style={{ display: "flex", alignItems: "center", gap: 10, height: 40, padding: "0 14px", cursor: "pointer", fontSize: 15, fontWeight: 500, color: selected.includes(c.value) ? "var(--text)" : "var(--text-2)" }}>
                <input type="checkbox" checked={selected.includes(c.value)} onChange={() => toggle(c.value)} style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
                <span style={{ flex: 1 }}>{c.label}</span>
                {c.count !== undefined ? <span className="muted" style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{num(c.count)}</span> : null}
              </label>
            </div>
          ))}
          {hidden ? <p className="note" style={{ padding: "8px 14px 6px" }}>+ altre {hidden} borse: scrivi per cercarle</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function SortMenu({ value, options, onChange, disabled = false }: { value: string; options: [string, string][]; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutside(open, close, trigger);
  const id = useId();
  const label = options.find(([k]) => k === value)?.[1] ?? options[0][1];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button ref={trigger} type="button" disabled={disabled} style={{ ...pill(false), height: 36, opacity: disabled ? 0.38 : 1, cursor: disabled ? "default" : "pointer" }} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}>
        Ordina: {label}
        <Icon name="down" size={14} />
      </button>
      {open ? (
        <div id={id} role="group" aria-label="Ordina per" style={{ ...panel, left: "auto", right: 0, top: 42 }}>
          <p className="note" style={{ padding: "6px 14px", fontWeight: 650 }}>Ordina per</p>
          {options.map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={k === value}
              onClick={() => {
                onChange(k);
                close();
                trigger.current?.focus();
              }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", height: 40, padding: "0 14px", background: "none", border: 0, cursor: "pointer", fontSize: 15, color: k === value ? "var(--text)" : "var(--text-2)", fontWeight: k === value ? 650 : 500 }}
            >
              <span style={{ width: 16, color: "var(--accent)", display: "inline-flex" }}>{k === value ? <Icon name="check" size={16} /> : null}</span>
              {l}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
