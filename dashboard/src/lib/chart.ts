// MOB-1198 (FZW-WEB-02, 13): the chart's periods and geometry.
// The eight periods of the boards map onto stock-values windows; the daily
// ones ask for the per-day indicators (?indicators=daily) so SMA 20, EMA,
// RSI 14 and MACD show the values the backend computed for each day.
import type { PricePoint } from "./types.ts";

export const PERIODS = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"] as const;
export type Period = (typeof PERIODS)[number];

/** Days each windowed period shows; the backend sends 14 extra lead-in days (MOB-594). */
const PERIOD_DAYS: Partial<Record<Period, number>> = { "1M": 30, "6M": 182, "1Y": 365, "5Y": 1825 };

export function windowQuery(period: Period): Record<string, string> {
  return period === "1D" ? { window: "1D" } : { window: period, indicators: "daily" };
}

function day(value: string): number {
  return new Date(value.length === 10 ? `${value}T00:00:00Z` : value).getTime();
}

/** The points of the period itself, oldest first, with a close. */
export function periodPoints(points: PricePoint[], period: Period): PricePoint[] {
  const valid = points.filter((p) => typeof p.close === "number" && Number.isFinite(p.close)).sort((a, b) => day(a.date) - day(b.date));
  const days = PERIOD_DAYS[period];
  if (!days || valid.length === 0) return valid;
  const last = day(valid[valid.length - 1].date);
  const from = last - days * 86_400_000;
  return valid.filter((p) => day(p.date) >= from);
}

/** Design decision 5: the colour follows the change over the period shown. */
export function periodRises(points: PricePoint[]): boolean {
  if (points.length < 2) return true;
  return (points[points.length - 1].close ?? 0) >= (points[0].close ?? 0);
}

/** Five round ticks covering [min, max], top first. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) {
    const pad = Math.abs(min) * 0.02 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; ticks.length < count + 2 && v <= max + step; v += step) ticks.push(Number(v.toFixed(10)));
  while (ticks.length > count && ticks[ticks.length - 1] > max) ticks.pop();
  while (ticks.length > count && ticks[0] < min) ticks.shift();
  return ticks.reverse();
}

export type Scale = { x: (i: number) => number; y: (v: number) => number; min: number; max: number };

export function makeScale(values: number[], n: number, width: number, height: number, pad = 0.06): Scale {
  const finite = values.filter((v) => Number.isFinite(v));
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (!finite.length) {
    min = 0;
    max = 1;
  }
  const span = max - min || Math.abs(max) || 1;
  min -= span * pad;
  max += span * pad;
  return {
    x: (i) => (n <= 1 ? width / 2 : (i / (n - 1)) * width),
    y: (v) => height - ((v - min) / (max - min)) * height,
    min,
    max,
  };
}

/** An SVG path through the points that have a value; gaps break the line. */
export function linePath(values: (number | null | undefined)[], scale: Scale): string {
  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${scale.x(i).toFixed(1)} ${scale.y(v).toFixed(1)}`;
    pen = true;
  });
  return d;
}

/** X labels: up to `count` evenly spaced indices. */
export function labelIndices(n: number, count: number): number[] {
  if (n <= 0) return [];
  if (n <= count) return Array.from({ length: n }, (_, i) => i);
  return Array.from({ length: count }, (_, k) => Math.round((k * (n - 1)) / (count - 1)));
}
