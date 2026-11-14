// MOB-1198 (FZW-WEB-03, 05): a Twelve Data statistic as the boards write it.
// Fractions become percentages (profit_margin 0.558 → «55,8%»), money is
// compact in the statistics currency, a missing value is null (the card
// shows «Non disponibile»).
import { formatCompact, formatDate, formatMoney, formatNumber, formatPercent, toNumber, type Lang } from "./format.ts";
import type { StatKind } from "./labels.ts";
import type { StatValue, Statistics } from "./types.ts";

export function formatStat(value: StatValue | undefined, kind: StatKind, currency: string | null, lang: Lang): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (kind === "date") return typeof value === "string" ? formatDate(value.slice(0, 10), lang, { year: true }) ?? value : null;
  if (kind === "text") return String(value);
  const n = toNumber(value);
  if (n === null) return typeof value === "string" ? value : null;
  switch (kind) {
    case "money":
      return formatCompact(n, lang, currency);
    case "perShare":
      return formatMoney(n, currency, lang);
    case "pe":
      return formatNumber(n, lang, 1);
    case "ratio":
      return formatNumber(n, lang, 2);
    case "pct":
      return formatPercent(n, lang, { fraction: true });
    case "count":
      return formatCompact(n, lang);
  }
}

/** The eight key figures of the Summary (FZW-WEB-03), by their place in the groups. */
export const KEY_FIGURES = [
  ["s_cap", "valuation", "market_capitalization", "money"],
  ["s_beta", "stock_price_history", "beta", "ratio"],
  ["s_pe", "valuation", "trailing_pe", "pe"],
  ["s_div", "dividends_and_splits", "forward_annual_dividend_yield", "pct"],
  ["s_eps", "income_statement", "diluted_eps_ttm", "perShare"],
  ["s_margin", "profitability", "profit_margin", "pct"],
  ["s_low", "stock_price_history", "fifty_two_week_low", "perShare"],
  ["s_high", "stock_price_history", "fifty_two_week_high", "perShare"],
] as const;

export function keyFigure(stats: Statistics | null, group: string, field: string): StatValue {
  const g = stats?.groups?.[group];
  const v = g?.[field] ?? null;
  // The dividend yield: the trailing one when the forward one is missing.
  if (v === null && field === "forward_annual_dividend_yield") return g?.trailing_annual_dividend_yield ?? null;
  return v;
}
