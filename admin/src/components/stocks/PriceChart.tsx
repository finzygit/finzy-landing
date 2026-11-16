"use client";

// MOB-1377: the stock page's chart (board ADM-STOCKS-02-scheda-*): daily
// closes as a line with a soft fill, the range picker 1M / 6M / 1A / 5A / Max,
// five price lines on the right and the months under it. Read-only (D400):
// nothing on it can be dragged or edited. Lime when the range rises, red when
// it falls, as in the app.

import { useEffect, useMemo, useState } from "react";
import { num } from "@/lib/stocks";

export const RANGES = ["1M", "6M", "1A", "5A", "Max"] as const;
export type Range = (typeof RANGES)[number];

const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

export function RangePicker({ value, onChange, disabled = false }: { value: Range; onChange: (r: Range) => void; disabled?: boolean }) {
  return (
    <div role="group" aria-label="Periodo del grafico" style={{ display: "inline-flex", gap: 4, opacity: disabled ? 0.38 : 1 }}>
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={r === value}
          disabled={disabled}
          onClick={() => onChange(r)}
          style={{ height: 36, minWidth: 52, padding: "0 12px", borderRadius: 999, border: 0, cursor: disabled ? "default" : "pointer", fontWeight: 650, fontSize: 15,
            background: r === value ? "rgba(255,255,255,0.09)" : "none", color: r === value ? "var(--text)" : "var(--text-3)" }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function axisLabel(v: number): string {
  return `$${num(v, v < 10 ? 2 : 0)}`;
}

/** The drawing's real width, so the labels are never stretched (a callback ref: the box changes with the state). */
function useWidth() {
  const [el, ref] = useState<HTMLDivElement | null>(null);
  const [w, setW] = useState(800);
  useEffect(() => {
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return { ref, w };
}

export function PriceChart({ points, state = "default", emptyText, height = 260 }: { points: [string, number][]; state?: "default" | "loading" | "empty" | "error"; emptyText?: string; height?: number }) {
  const { ref, w: W } = useWidth();
  const H = height;
  const padR = 64;
  const padB = 26;
  const geo = useMemo(() => {
    if (points.length < 2) return null;
    const closes = points.map((p) => p[1]);
    let lo = Math.min(...closes);
    let hi = Math.max(...closes);
    if (hi === lo) {
      hi += 1;
      lo -= 1;
    }
    const span = hi - lo;
    lo -= span * 0.06;
    hi += span * 0.06;
    const x = (i: number) => (i / (points.length - 1)) * (W - padR);
    const y = (v: number) => 8 + (1 - (v - lo) / (hi - lo)) * (H - padB - 16);
    const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
    const area = `${line}L${x(points.length - 1).toFixed(1)},${H - padB}L0,${H - padB}Z`;
    const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * (4 - i)) / 4).map((v) => ({ v, y: y(v) }));
    const months: { label: string; x: number }[] = [];
    let last = "";
    const step = Math.max(1, Math.ceil(points.length / 8));
    points.forEach((p, i) => {
      const m = p[0].slice(0, 7);
      if (m !== last) {
        last = m;
        if (i === 0 || months.length === 0 || x(i) - months[months.length - 1].x > (W - padR) / 9 || step === 1) {
          const mm = Number(p[0].slice(5, 7)) - 1;
          months.push({ label: points.length > 600 && mm === 0 ? p[0].slice(0, 4) : MONTHS[mm], x: x(i) });
        }
      }
    });
    const up = closes[closes.length - 1] >= closes[0];
    return { line, area, ticks, months, up };
  }, [points, H, W]);

  if (state === "loading") return <div ref={ref}><span className="skeleton" style={{ height, borderRadius: 16 }} aria-busy="true" /></div>;
  if (state !== "default" || !geo) {
    return (
      <div ref={ref} style={{ height, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.12)", color: "var(--text-3)", fontSize: 15 }}>
        {emptyText}
      </div>
    );
  }
  const color = geo.up ? "#a6e22e" : "#ff453a";
  return (
    <div ref={ref}>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Chiusure giornaliere, ${points.length} giorni`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="stock-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {geo.ticks.map((t) => (
        <g key={t.y}>
          <line x1="0" x2={W - padR} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.06)" />
          <text x={W - padR + 10} y={t.y + 4} fill="rgba(236,244,241,0.48)" fontSize="13">{axisLabel(t.v)}</text>
        </g>
      ))}
      <path d={geo.area} fill="url(#stock-fill)" />
      <path d={geo.line} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
      {geo.months.map((m) => (
        <text key={`${m.label}-${m.x}`} x={m.x} y={H - 6} fill="rgba(236,244,241,0.48)" fontSize="13">{m.label}</text>
      ))}
    </svg>
    </div>
  );
}
