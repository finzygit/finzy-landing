"use client";

// MOB-1198 (FZW-WEB-02, 13): web_chart, web_ranges, web_indicator_chip,
// web_pane. Eight periods; SMA 20 and EMA over the price, RSI 14 and MACD
// (signal and histogram) in panes under it, each switched on and off. The
// values are the backend's for each day (stock-values ?indicators=daily).
// The line is lime or red by the change over the period shown (decision 5).
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useApp, useLoad } from "@/lib/app";
import { labelIndices, linePath, makeScale, PERIODS, periodPoints, periodRises, windowQuery, type Period } from "@/lib/chart";
import { formatDate, formatMoney, formatNumber, monthName, type Lang } from "@/lib/format";
import { list } from "@/lib/i18n";
import type { PricePoint, StockHeader } from "@/lib/types";
import { Skeleton } from "./ui";

type Indicator = "sma" | "ema" | "rsi" | "macd";
const INDICATORS: Indicator[] = ["sma", "ema", "rsi", "macd"];
const COLOR: Record<Indicator | "signal", string> = { sma: "#C9A7FF", ema: "#6FB6FF", rsi: "#9EE6EB", macd: "#6FB6FF", signal: "#C9A7FF" };
const UP = "#89F336";
const DOWN = "#FF453A";
const GUTTER = 52;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function xLabel(p: PricePoint, period: Period, lang: Lang): string {
  // Daily bars are calendar days ("2026-11-13T00:00:00.000000Z"): read the day, not the instant.
  const d = new Date(period === "1D" ? p.date : `${p.date.slice(0, 10)}T12:00:00Z`);
  if (period === "1D") return d.toLocaleTimeString(lang === "it" ? "it-IT" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: lang === "en" });
  if (period === "5D") return String(d.getUTCDate());
  if (period === "1M") return formatDate(p.date.slice(0, 10), lang) ?? "";
  if (period === "5Y" || period === "MAX") return String(d.getUTCFullYear());
  return monthName(d.getUTCMonth(), lang);
}

function compactPrice(v: number, currency: string | null, lang: Lang, span: number): string {
  return formatMoney(v, currency, lang, span < 20 ? 2 : 0);
}

export function IndicatorChip({ label, color, on, disabled, onClick }: { label: string; color: string; on: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-full px-3 text-label font-semibold disabled:opacity-40 ${on ? "border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.14)] text-ink" : "chip text-ink-2"}`}
    >
      <span className="inline-block h-[3px] w-3 rounded-sm" style={{ background: on ? color : "rgba(255,255,255,0.28)" }} />
      {label}
    </button>
  );
}

function Pane({
  kind,
  points,
  width,
  hover,
  lang,
  labels,
}: {
  kind: "rsi" | "macd";
  points: PricePoint[];
  width: number;
  hover: number | null;
  lang: Lang;
  labels: { rsi: string; macd: string; signal: string; hist: string };
}) {
  const h = 92;
  const w = Math.max(10, width - GUTTER);
  const i = hover ?? points.length - 1;
  if (kind === "rsi") {
    const vals = points.map((p) => p.rsi_14 ?? null);
    const scale = { ...makeScale([0, 100], points.length, w, h, 0), y: (v: number) => h - (v / 100) * h };
    const last = vals[i];
    return (
      <div className="border-t border-hair pt-3">
        <div className="mb-1.5 flex items-center gap-2 text-meta font-semibold text-ink-2">
          <span className="inline-block h-[3px] w-3 rounded-sm" style={{ background: COLOR.rsi }} />
          {labels.rsi} <span className="tnum text-ink">{typeof last === "number" ? formatNumber(last, lang, 1) : "—"}</span>
        </div>
        <svg width={width} height={h} role="img" aria-label={labels.rsi} className="block overflow-visible">
          <rect x={0} y={scale.y(70)} width={w} height={scale.y(30) - scale.y(70)} fill="rgba(158,230,235,0.06)" />
          {[70, 30].map((v) => (
            <g key={v}>
              <line x1={0} x2={w} y1={scale.y(v)} y2={scale.y(v)} stroke="rgba(255,255,255,0.14)" strokeDasharray="3 4" />
              <text x={w + 8} y={scale.y(v) + 4} className="fill-[rgba(236,244,241,0.48)] text-[12px]">
                {v}
              </text>
            </g>
          ))}
          <path d={linePath(vals, scale)} fill="none" stroke={COLOR.rsi} strokeWidth={1.6} />
          {hover !== null && <line x1={scale.x(hover)} x2={scale.x(hover)} y1={0} y2={h} stroke="rgba(255,255,255,0.25)" />}
        </svg>
      </div>
    );
  }
  const macd = points.map((p) => p.macd_value ?? null);
  const signal = points.map((p) => p.macd_signal ?? null);
  const hist = points.map((p) => p.macd_histogram ?? null);
  const all = [...macd, ...signal, ...hist, 0].filter((v): v is number => typeof v === "number");
  const scale = makeScale(all, points.length, w, h, 0.08);
  const zero = scale.y(0);
  const barW = Math.max(1, (w / Math.max(1, points.length)) * 0.6);
  const v = (arr: (number | null)[]) => (typeof arr[i] === "number" ? formatNumber(arr[i] as number, lang, 2) : "—");
  return (
    <div className="border-t border-hair pt-3">
      <div className="mb-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta font-semibold text-ink-2">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-[3px] w-3 rounded-sm" style={{ background: COLOR.macd }} />
          {labels.macd} <span className="tnum text-ink">{v(macd)}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-[3px] w-3 rounded-sm" style={{ background: COLOR.signal }} />
          {labels.signal} <span className="tnum text-ink">{v(signal)}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-[3px] w-3 rounded-sm bg-[rgba(255,255,255,0.28)]" />
          {labels.hist} <span className="tnum text-ink">{v(hist)}</span>
        </span>
      </div>
      <svg width={width} height={h} role="img" aria-label={labels.macd} className="block overflow-visible">
        <line x1={0} x2={w} y1={zero} y2={zero} stroke="rgba(255,255,255,0.10)" />
        <text x={w + 8} y={zero + 4} className="fill-[rgba(236,244,241,0.48)] text-[12px]">
          0
        </text>
        {hist.map((x, k) =>
          typeof x === "number" ? (
            <rect key={k} x={scale.x(k) - barW / 2} y={Math.min(zero, scale.y(x))} width={barW} height={Math.abs(scale.y(x) - zero)} fill="rgba(111,182,255,0.42)" />
          ) : null,
        )}
        <path d={linePath(macd, scale)} fill="none" stroke={COLOR.macd} strokeWidth={1.5} />
        <path d={linePath(signal, scale)} fill="none" stroke={COLOR.signal} strokeWidth={1.5} />
        {hover !== null && <line x1={scale.x(hover)} x2={scale.x(hover)} y1={0} y2={h} stroke="rgba(255,255,255,0.25)" />}
      </svg>
    </div>
  );
}

export function PriceChart({ stock, phone = false }: { stock: StockHeader; phone?: boolean }) {
  const { api, t, lang } = useApp();
  const [period, setPeriod] = useState<Period>("6M");
  const [on, setOn] = useState<Record<Indicator, boolean>>({ sma: false, ema: false, rsi: false, macd: false });
  const [hover, setHover] = useState<number | null>(null);
  const [boxRef, width] = useWidth<HTMLDivElement>();
  const load = useLoad(`chart:${stock.symbol}:${period}`, () => api.get<PricePoint[]>(`/stock-values/${encodeURIComponent(stock.symbol)}`, windowQuery(period)));
  const points = useMemo(() => (load.status === "ready" ? periodPoints(load.data ?? [], period) : []), [load, period]);
  const periodNames = list(lang, "periods");
  const h = phone ? 220 : 300;
  const w = Math.max(10, width - GUTTER);
  const rises = periodRises(points);
  const color = rises ? UP : DOWN;
  const intraday = period === "1D";

  const overlays = (["sma", "ema"] as const).filter((k) => on[k] && !intraday);
  const prices = points.map((p) => p.close as number);
  const scaleValues = [...prices, ...overlays.flatMap((k) => points.map((p) => (k === "sma" ? p.sma_20 : p.ema_20) ?? NaN))];
  const scale = makeScale(scaleValues, points.length, w, h);
  // Five labels evenly spaced on the data's range, as the boards draw them.
  const ticks = points.length ? Array.from({ length: 5 }, (_, k) => scale.max - ((scale.max - scale.min) * (k + 0.5)) / 5) : [];
  const pricePath = linePath(prices, scale);
  const area = points.length > 1 ? `${pricePath}L${scale.x(points.length - 1).toFixed(1)} ${h}L0 ${h}Z` : "";
  const xs = labelIndices(points.length, phone ? 4 : 6);
  const gradId = `g-${stock.symbol.replace(/\W/g, "")}-${rises ? "u" : "d"}`;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const i = Math.round((x / w) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };
  const hp = hover !== null ? points[hover] : null;

  return (
    <section className="card px-4 pb-3.5 pt-4 sm:px-6 sm:pb-[18px] sm:pt-5" aria-label={stock.name}>
      <div className={`flex gap-3 ${phone ? "flex-col" : "flex-wrap items-center justify-between gap-y-3"}`}>
        <div role="radiogroup" aria-label={t("periods")} className="flex w-full items-center gap-0.5 sm:w-auto sm:gap-1">
          {PERIODS.map((p, i) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={p === period}
              onClick={() => {
                setPeriod(p);
                setHover(null);
              }}
              className={`h-9 min-w-0 flex-1 rounded-full border border-transparent px-0 text-[14px] font-semibold sm:flex-none sm:px-3.5 sm:text-row ${p === period ? "pill-on" : "text-ink-3"}`}
            >
              {periodNames[i]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {INDICATORS.map((k) => (
            <IndicatorChip key={k} label={t(`ind_${k}`)} color={COLOR[k]} on={on[k] && !intraday} disabled={intraday} onClick={() => setOn((s) => ({ ...s, [k]: !s[k] }))} />
          ))}
        </div>
      </div>

      <div ref={boxRef} className="relative mt-[18px] w-full">
        {(load.status === "loading" || (load.status === "ready" && points.length > 0 && width === 0)) && (
          <div style={{ height: h + 24 }}>
            <Skeleton className="h-full w-full rounded-tile" />
          </div>
        )}
        {load.status !== "loading" && points.length === 0 && (
          <div className="flex items-center justify-center rounded-tile text-row text-ink-3" style={{ height: h }}>
            {load.status === "error" ? t("err_title") : t("chart_empty")}
          </div>
        )}
        {load.status === "ready" && points.length > 0 && width > 0 && (
          <>
            <svg width={width} height={h + 24} role="img" aria-label={`${stock.name} · ${periodNames[PERIODS.indexOf(period)]}`} onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
              tabIndex={0}
              onBlur={() => setHover(null)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                e.preventDefault();
                const step = e.key === "ArrowLeft" ? -1 : 1;
                setHover((h) => Math.max(0, Math.min(points.length - 1, (h ?? points.length - 1) + step)));
              }}
              className="block touch-pan-y overflow-visible focus-visible:outline-none">
              <defs>
                <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              {ticks.map((v) => (
                <g key={v}>
                  <line x1={0} x2={w} y1={scale.y(v)} y2={scale.y(v)} stroke="rgba(255,255,255,0.06)" />
                  <text x={w + 10} y={scale.y(v) + 4} className="tnum fill-[rgba(236,244,241,0.48)] text-[12px]">
                    {compactPrice(v, stock.currency, lang, scale.max - scale.min)}
                  </text>
                </g>
              ))}
              <path d={area} fill={`url(#${gradId})`} />
              <path d={pricePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
              {overlays.map((k) => (
                <path key={k} d={linePath(points.map((p) => (k === "sma" ? p.sma_20 : p.ema_20)), scale)} fill="none" stroke={COLOR[k]} strokeWidth={1.6} />
              ))}
              {xs.map((i) => (
                <text key={i} x={Math.min(w - 4, Math.max(0, scale.x(i)))} y={h + 18} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="fill-[rgba(236,244,241,0.48)] text-[12px]">
                  {xLabel(points[i], period, lang)}
                </text>
              ))}
              {hp && hover !== null && (
                <g>
                  <line x1={scale.x(hover)} x2={scale.x(hover)} y1={0} y2={h} stroke="rgba(255,255,255,0.35)" />
                  <circle cx={scale.x(hover)} cy={scale.y(hp.close as number)} r={4.5} fill={color} stroke="#000" strokeWidth={2} />
                </g>
              )}
            </svg>
            {hp && hover !== null && (
              <div
                className="glass-menu pointer-events-none absolute top-2 z-10 flex min-w-[170px] flex-col gap-1 rounded-[14px] px-3 py-2.5 text-meta"
                style={{ left: Math.min(Math.max(0, scale.x(hover) + (scale.x(hover) > w / 2 ? -186 : 14)), Math.max(0, width - 180)) }}
              >
                <span className="text-ink-3">{formatDate(intraday ? hp.date : hp.date.slice(0, 10), lang, { year: true, time: intraday })}</span>
                <span className="flex justify-between gap-4 text-ink-2">
                  {t("price")} <span className="tnum font-semibold text-ink">{formatMoney(hp.close as number, stock.currency, lang)}</span>
                </span>
                {overlays.map((k) => {
                  const v = k === "sma" ? hp.sma_20 : hp.ema_20;
                  return (
                    <span key={k} className="flex justify-between gap-4 text-ink-2">
                      {t(`ind_${k}`)} <span className="tnum font-semibold text-ink">{typeof v === "number" ? formatMoney(v, stock.currency, lang) : "—"}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      {load.status === "ready" && points.length > 0 && width > 0 && !intraday && (
        <div className="mt-3 flex flex-col gap-3">
          {on.rsi && <Pane kind="rsi" points={points} width={width} hover={hover} lang={lang} labels={{ rsi: t("ind_rsi"), macd: t("ind_macd"), signal: t("macd_signal"), hist: t("macd_hist") }} />}
          {on.macd && <Pane kind="macd" points={points} width={width} hover={hover} lang={lang} labels={{ rsi: t("ind_rsi"), macd: t("ind_macd"), signal: t("macd_signal"), hist: t("macd_hist") }} />}
        </div>
      )}
    </section>
  );
}
