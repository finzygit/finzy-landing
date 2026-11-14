// MOB-1198 (FZW-WEB-02, 07): numbers and dates of the dashboard, written by
// hand so they match the boards exactly in both languages:
// - IT: dot thousands (from 1.000: Intl's it-IT leaves 4 digits ungrouped),
//   comma decimals, "€ 742,60", "$5.390 Mrd", "13 nov, 22:00";
// - EN: "$221.30", "€742.60", "$5,390 B", "Nov 13, 10:00 PM" (design
//   decision 4: formats follow the language).
// The minus is U+2212, as on the boards. A missing value is the caller's
// «Non disponibile» (or a dash in the statement tables), never a zero.

export type Lang = "it" | "en";
export type StatementUnit = "thousands" | "millions" | "billions";

export const MINUS = "−";

const SEP: Record<Lang, { group: string; decimal: string }> = {
  it: { group: ".", decimal: "," },
  en: { group: ",", decimal: "." },
};

/** A finite number, or null. Strings from the API ("52.8") are read too. */
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function formatNumber(value: number, lang: Lang, decimals = 2): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const negative = value < 0 && Number(fixed) !== 0;
  const [int, frac] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, SEP[lang].group);
  return (negative ? MINUS : "") + grouped + (frac ? SEP[lang].decimal + frac : "");
}

const SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };

function withCurrency(amount: string, currency: string | null | undefined, lang: Lang): string {
  if (!currency) return amount;
  const negative = amount.startsWith(MINUS);
  const body = negative ? amount.slice(1) : amount;
  const symbol = SYMBOL[currency.toUpperCase()];
  let out: string;
  if (symbol === "€") out = lang === "it" ? `€ ${body}` : `€${body}`;
  else if (symbol) out = `${symbol}${body}`;
  else out = `${currency.toUpperCase()} ${body}`;
  return (negative ? MINUS : "") + out;
}

/**
 * London quotes in pence (Twelve Data «GBp» or «GBX»): shown in pounds, so a
 * 1.234 GBp figure is £12,34, not £1.234.
 */
export function inMajorUnit(value: number, currency: string | null | undefined): { value: number; currency: string | null | undefined } {
  if (currency === "GBp" || currency?.toUpperCase() === "GBX") return { value: value / 100, currency: "GBP" };
  return { value, currency };
}

export function formatMoney(value: number, currency: string | null | undefined, lang: Lang, decimals = 2): string {
  const m = inMajorUnit(value, currency);
  return withCurrency(formatNumber(m.value, lang, decimals), m.currency, lang);
}

const COMPACT: Record<Lang, { b: string; m: string; k: string }> = {
  it: { b: "Mrd", m: "Mln", k: "K" },
  en: { b: "B", m: "M", k: "K" },
};

/** K, M, B scaling: one decimal below 1.000 of the unit, none above. */
export function formatCompact(input: number, lang: Lang, money?: string | null): string {
  const { value, currency } = inMajorUnit(input, money);
  const abs = Math.abs(value);
  let scaled = value;
  let suffix = "";
  if (abs >= 1e9) {
    scaled = value / 1e9;
    suffix = COMPACT[lang].b;
  } else if (abs >= 1e6) {
    scaled = value / 1e6;
    suffix = COMPACT[lang].m;
  } else if (abs >= 1e3) {
    scaled = value / 1e3;
    suffix = COMPACT[lang].k;
  }
  if (!suffix) return withCurrency(formatNumber(value, lang, Number.isInteger(value) ? 0 : 2), currency, lang);
  // "5.390 Mrd", "72,9 Mrd", "292 Mrd" (a trailing ",0" is dropped).
  const oneDecimal = Math.round(Math.abs(scaled) * 10) % 10 !== 0;
  const decimals = Math.abs(scaled) >= 1000 || !oneDecimal ? 0 : 1;
  const number = formatNumber(scaled, lang, decimals);
  return `${withCurrency(number, currency, lang)} ${suffix}`;
}

export function formatPercent(value: number, lang: Lang, opts: { fraction?: boolean; signed?: boolean; decimals?: number } = {}): string {
  const pct = opts.fraction ? value * 100 : value;
  const decimals = opts.decimals ?? (Math.abs(pct) < 1 && pct !== 0 ? 2 : 1);
  const text = formatNumber(pct, lang, decimals);
  const sign = opts.signed && Number(Math.abs(pct).toFixed(decimals)) !== 0 && pct > 0 ? "+" : "";
  return `${sign}${text}%`;
}

/** The day's change in the header pill: signed, two decimals, zero unsigned. */
export function formatChange(value: number, lang: Lang): string {
  return formatPercent(value, lang, { signed: true, decimals: 2 });
}

const DIVISOR: Record<StatementUnit, number> = { thousands: 1e3, millions: 1e6, billions: 1e9 };

export function scaleStatement(value: number, unit: StatementUnit): number {
  return value / DIVISOR[unit];
}

/** A statement cell: millions and thousands without decimals, billions with two; per-share lines unscaled. */
export function formatStatementValue(
  value: number | null | undefined,
  unit: StatementUnit,
  lang: Lang,
  opts: { perShare?: boolean } = {},
): string | null {
  const n = toNumber(value);
  if (n === null) return null;
  if (opts.perShare) return formatNumber(n, lang, 2);
  return formatNumber(scaleStatement(n, unit), lang, unit === "billions" ? 2 : 0);
}

const MONTHS: Record<Lang, string[]> = {
  it: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export function monthName(month: number, lang: Lang): string {
  return MONTHS[lang][month];
}

type Parts = { year: number; month: number; day: number; hour: number; minute: number };

function parts(date: Date, timeZone?: string): Parts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const p: Record<string, number> = {};
  for (const part of f.formatToParts(date)) if (part.type !== "literal") p[part.type] = Number(part.value);
  return { year: p.year, month: p.month - 1, day: p.day, hour: p.hour % 24, minute: p.minute };
}

/** "YYYY-MM-DD" is a calendar day (no time zone shift); anything else is an instant. */
function parseDate(value: string): { date: Date; dayOnly: boolean } | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (day) return { date: new Date(Date.UTC(+day[1], +day[2] - 1, +day[3])), dayOnly: true };
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : { date, dayOnly: false };
}

export function formatDate(
  value: string | null | undefined,
  lang: Lang,
  opts: { year?: boolean; time?: boolean; timeZone?: string } = {},
): string | null {
  if (!value) return null;
  const parsed = parseDate(value);
  if (!parsed) return null;
  const p = parts(parsed.date, parsed.dayOnly ? "UTC" : opts.timeZone);
  const month = MONTHS[lang][p.month];
  let text = lang === "it" ? `${p.day} ${month}` : `${month} ${p.day}`;
  if (opts.year) text += lang === "it" ? ` ${p.year}` : `, ${p.year}`;
  if (opts.time && !parsed.dayOnly) {
    const mm = String(p.minute).padStart(2, "0");
    if (lang === "it") text += `, ${String(p.hour).padStart(2, "0")}:${mm}`;
    else text += `, ${p.hour % 12 === 0 ? 12 : p.hour % 12}:${mm} ${p.hour < 12 ? "AM" : "PM"}`;
  }
  return text;
}

export function formatPeriodLabel(period: { year: number; quarter: number | null }, lang: Lang): string {
  if (!period.quarter) return String(period.year);
  return `${lang === "it" ? "T" : "Q"}${period.quarter} ${period.year}`;
}
