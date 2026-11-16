// MOB-1377 (D399, D400): the console's «Titoli». Types of /api/admin/stocks*,
// the Italian words for the data and the number and date formats the pages
// share. Prices are only ever shown, never edited.

export type PriceState = "fresh" | "stale" | "never";

export type StockRow = {
  id: number;
  symbol: string;
  name: string | null;
  common_name: string | null;
  type: string | null;
  mic: string | null;
  area: string | null;
  country: string | null;
  price: number | null;
  change: number | null;
  price_state: PriceState;
  price_at: string | null;
  price_day_only: boolean;
  not_found_at: string | null;
  market_cap: number | null;
  hidden: boolean;
  secondary: boolean;
  logo_url: string | null;
  reports?: { snapshots: number; ten_k: boolean; universe: boolean };
};

export type StockSummary = { all: number; stale: number; never: number; last_quote_at: string | null };
export type StockListPage = { rows: StockRow[]; total: number; page: number; per_page: number; summary: StockSummary };
export type Facets = { types: Record<string, number>; areas: Record<string, number>; mics: { mic: string; n: number }[] };

export type Activity = { id: number; at: string | null; who: string | null; event: string; kind: string; summary: string };

export type StockPage = StockRow & {
  common_name_source: "manual" | "ai" | null;
  common_name_locked: boolean;
  alternatives: string[];
  cik: string | null;
  sector: string | null;
  price_source: string | null;
  last_row_on: string | null;
  exchange_dropped: boolean;
  sync: { history_checked_at: string | null; history_not_found_at: string | null; fundamentals_checked_at: string | null; ten_k_checked_at: string | null };
  universe: { in: boolean; day: string | null };
  logo: { provider_url: string | null; uploaded_url: string | null };
  banner: { url: string | null };
  counts: { documents: number; reports: number; news: number };
  activity: Activity[];
};

export type PriceRow = { day: string; open: number | null; high: number | null; low: number | null; close: number | null; volume: number | null; source: string | null };
export type DocumentRow = { id: number; type: string | null; year: number | null; filed_on: string | null; mime: string | null; size: number; stored_at: string | null; url: string };
export type ReportRow = { id: number; type: string; type_label: string; period: string; status: string; at: string | null };
export type NewsRow = { id: number; title: string; at: string | null; source: string | null; relation: string | null };

// ---------------------------------------------------------------- words

export const TYPE_LABEL: Record<string, string> = {
  stock: "Azione", fund: "Fondo / ETF", bond: "Obbligazione", forex: "Valuta", commodity: "Materia prima", crypto: "Cripto",
};

export const AREA_LABEL: Record<string, string> = { USA: "USA", Europe: "Europa", "Asia-Pacific": "Asia-Pacifico", America: "America", none: "Senza area" };

/** Exchange names next to the MIC (the ones the boards show and the largest by count; the rest show the MIC alone). */
export const MIC_NAME: Record<string, string> = {
  XNAS: "Nasdaq", XNYS: "NYSE", ARCX: "NYSE Arca", BATS: "Cboe BZX", XASE: "NYSE American", OTCM: "OTC Markets",
  XLON: "Londra", XETR: "Xetra", XFRA: "Francoforte", XPAR: "Euronext Parigi", XAMS: "Euronext Amsterdam", XBRU: "Euronext Bruxelles",
  XLIS: "Euronext Lisbona", XMIL: "Borsa Italiana", XMAD: "Madrid", XSWX: "SIX Swiss", XSTO: "Stoccolma", XCSE: "Copenaghen", XHEL: "Helsinki",
  XOSL: "Oslo", XWBO: "Vienna", XDUB: "Euronext Dublino", XTAI: "Taipei", XKRX: "Seul", XTKS: "Tokyo", XHKG: "Hong Kong", XSHG: "Shanghai",
  XSHE: "Shenzhen", XASX: "Sydney", XTSE: "Toronto", XBOM: "Mumbai", XNSE: "NSE India", XSES: "Singapore",
};

export const SOURCE_LABEL: Record<string, string> = { twelvedata: "Twelve Data", marketstack: "Marketstack", massive: "Massive" };

export const sourceLabel = (s: string | null | undefined) => (s ? (SOURCE_LABEL[s.toLowerCase()] ?? s) : null);

export function micLabel(mic: string | null): string | null {
  if (!mic) return null;
  return MIC_NAME[mic] ? `${mic} · ${MIC_NAME[mic]}` : mic;
}

/** «Stati Uniti» from «US», in Italian, whatever the runtime's ICU has (the code itself when unknown). */
export function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    const n = new Intl.DisplayNames(["it"], { type: "region" }).of(code.toUpperCase());
    return n && n !== code.toUpperCase() ? n : code;
  } catch {
    return code;
  }
}

/** The name the app shows: the common name, else the official one. */
export const displayName = (s: Pick<StockRow, "common_name" | "name" | "symbol">) => s.common_name || s.name || s.symbol;

// ---------------------------------------------------------------- numbers and dates

/** Italian digits with a dot for thousands and a comma for decimals, independent of the runtime's ICU. */
export function num(n: number, decimals = 0): string {
  const [int, dec] = Math.abs(n).toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "−" : ""}${grouped}${dec ? `,${dec}` : ""}`;
}

/** $221,30 · $1,1621 for a currency pair under 10 · «—» for no price (never $0). */
export function usd(v: number | null, type?: string | null): string {
  if (v === null || !Number.isFinite(v) || v <= 0) return "—";
  return `$${num(v, type === "forex" && v < 10 ? 4 : 2)}`;
}

/** +0,62% · −3,16% · 0,00% */
export function pct(v: number): string {
  if (Math.abs(v) < 0.005) return "0,00%";
  return `${v > 0 ? "+" : "−"}${num(Math.abs(v), 2)}%`;
}

const TZ = "Europe/Rome";

function parts(iso: string): Record<string, string> {
  const d = new Date(iso);
  const out: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d)) {
    out[p.type] = p.value;
  }
  if (out.hour === "24") out.hour = "00";
  return out;
}

/** A day (YYYY-MM-DD, no time zone) as 26/02/2026, or 26/02 when short. */
export function day(ymd: string | null, short = false): string {
  if (!ymd) return "—";
  const [y, m, d] = ymd.slice(0, 10).split("-");
  return short ? `${d}/${m}` : `${d}/${m}/${y}`;
}

/** 14/11 22:05 (short) or 14/11/2026, 22:05, in Rome time. */
export function moment(iso: string | null, short = false): string {
  if (!iso) return "—";
  const p = parts(iso);
  return short ? `${p.day}/${p.month} ${p.hour}:${p.minute}` : `${p.day}/${p.month}/${p.year}, ${p.hour}:${p.minute}`;
}

export function time(iso: string): string {
  const p = parts(iso);
  return `${p.hour}:${p.minute}`;
}

export function isToday(iso: string, now = new Date()): boolean {
  const a = parts(iso);
  const b = parts(now.toISOString());
  return a.day === b.day && a.month === b.month && a.year === b.year;
}

/** Whole days between a moment and now (0 today). */
export function daysAgo(iso: string, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
}

/** When the price was written: «14/11 22:05», or the day alone when it comes from a daily row. */
export function priceWhen(s: Pick<StockRow, "price_at" | "price_day_only">, short = true): string {
  if (!s.price_at) return "—";
  if (s.price_day_only) return day(s.price_at.slice(0, 10), short);
  return moment(s.price_at, short);
}

/** The line under a stale price: «non trovato dal 10/11» or «12 giorni fa». */
export function staleWhy(s: Pick<StockRow, "price_at" | "not_found_at">, now = new Date()): string | null {
  if (s.not_found_at) return `non trovato dal ${moment(s.not_found_at, true).slice(0, 5)}`;
  if (!s.price_at) return null;
  const n = daysAgo(s.price_at, now);
  return n === 1 ? "1 giorno fa" : `${n} giorni fa`;
}

export function megabytes(bytes: number): string {
  return `${num(bytes / (1024 * 1024), 1)} MB`;
}

// ---------------------------------------------------------------- the list's filters

export type Filters = { q: string; type: string[]; area: string[]; mic: string[]; report: string[]; price: string[]; move: string[]; app: string[]; sort: string; page: number };

/** sessionStorage: the list's last query, so «‹ Titoli» on a stock page returns to the same list. */
export const LIST_QUERY_KEY = "console.stocks.list";

export const EMPTY_FILTERS: Filters = { q: "", type: [], area: [], mic: [], report: [], price: [], move: [], app: [], sort: "cap", page: 1 };

export const SORTS: [string, string][] = [["cap", "Capitalizzazione"], ["ticker", "Ticker A–Z"], ["change", "Variazione di oggi"], ["oldest", "Prezzo più vecchio"]];

export const LIST_KEYS = ["type", "area", "mic", "report", "price", "move", "app"] as const;

export function hasFilters(f: Filters): boolean {
  return LIST_KEYS.some((k) => f[k].length > 0);
}

/** The query the API reads: lists comma-separated, empties left out. */
export function toQuery(f: Filters): Record<string, string | number> {
  const q: Record<string, string | number> = {};
  if (f.q.trim()) q.q = f.q.trim();
  for (const k of LIST_KEYS) if (f[k].length) q[k] = f[k].join(",");
  if (f.sort !== "cap") q.sort = f.sort;
  if (f.page > 1) q.page = f.page;
  return q;
}

/** The filters back from the address bar (so «‹ Titoli» returns to the same list). */
export function fromSearch(params: URLSearchParams): Filters {
  const list = (k: string) => (params.get(k) ?? "").split(",").map((v) => v.trim()).filter(Boolean);
  const sort = params.get("sort") ?? "cap";
  const page = Number(params.get("page") ?? 1);
  return {
    q: params.get("q") ?? "",
    type: list("type"), area: list("area"), mic: list("mic"), report: list("report"), price: list("price"), move: list("move"), app: list("app"),
    sort: SORTS.some(([k]) => k === sort) ? sort : "cap",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

// ---------------------------------------------------------------- edits

export const MAX_IMAGE_BYTES = { logo: 1024 * 1024, banner: 3 * 1024 * 1024 } as const;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_ALTERNATIVES = 20;
export const TICKER_RE = /^[A-Za-z0-9][A-Za-z0-9.\-/:]*$/;
