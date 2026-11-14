// MOB-1198: the JSON the dashboard reads. Shapes marked «to align» come from
// backend PRs not merged yet (feat/mob-1198-device-sessions,
// feat/mob-1198-dashboard-data, feat/mob-1198-dashboard-scores-api): they
// follow the drafts of those lanes on 14 Nov and must be checked against
// the merged controllers. The others are read from backend main.

/** GET /api/web/me (to align: feat/mob-1198-device-sessions). */
export type Me = {
  id: number;
  email: string;
  name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  lang?: string | null;
  plan?: string | null;
  subscription_status?: string | null;
  premium_expires_at?: string | null;
  is_unlimited: boolean;
};

/** GET /api/dashboard/search and /api/dashboard/stocks/{symbol} (to align: feat/mob-1198-dashboard-data). */
export type StockHeader = {
  /** The aziones id: the watchlist (POST/DELETE) and the news (blogs?azione=) need it. To align: not in the 14 Nov draft. */
  id?: number | null;
  symbol: string;
  name: string;
  exchange: string | null;
  mic_code?: string | null;
  /** Prices are stored in USD for every venue, as the app shows them. */
  currency: string | null;
  trading_currency?: string | null;
  last_price: number | null;
  day_change_percent: number | null;
  quoted_at: string | null;
  is_us: boolean;
  logo_url: string | null;
};

/** GET /api/dashboard/stocks/{symbol}/profile (to align). */
export type Profile = {
  symbol: string;
  name: string | null;
  type: string | null;
  exchange: string | null;
  mic_code?: string | null;
  currency: string | null;
  country: string | null;
  sector: string | null;
  industry: string | null;
  employees: number | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  ceo: string | null;
  description: string | null;
  updated_at: string | null;
};

export type StatValue = number | string | null;

/** GET /api/dashboard/stocks/{symbol}/statistics (to align). Group => field => value. */
export type Statistics = {
  symbol: string;
  currency: string | null;
  updated_at: string | null;
  groups: Record<string, Record<string, StatValue>>;
};

export type NotComputable = { computable: false; reason: string | null; missing?: string[]; score: null };

export type PiotroskiCriterion = { key: string; passed: boolean; value: number | null; compared_to: number | null };

export type Piotroski =
  | { computable: true; reason: null; fiscal_date: string; score: number; max: number; criteria: PiotroskiCriterion[] }
  | NotComputable;

export type Altman =
  | {
      computable: true;
      reason: null;
      fiscal_date: string;
      score: number;
      zone: "distress" | "grey" | "safe";
      thresholds: { distress_below: number; safe_above: number };
    }
  | NotComputable;

export type Beneish =
  | { computable: true; reason: null; fiscal_date: string; score: number; threshold: number; above_threshold: boolean }
  | NotComputable;

/** GET /api/dashboard/stocks/{symbol}/scores (to align: feat/mob-1198-dashboard-scores-api). */
export type Scores = {
  symbol: string;
  fiscal_date: string | null;
  currency: string | null;
  computed_at: string | null;
  piotroski: Piotroski | null;
  altman: Altman | null;
  beneish: Beneish | null;
};

export type StatementKind = "income" | "balance" | "cashflow";
export type PeriodKind = "annual" | "quarterly";

/** GET /api/dashboard/stocks/{symbol}/financials?statement=&period= (to align). */
export type Financials = {
  symbol: string;
  statement: StatementKind;
  period: PeriodKind;
  currency: string | null;
  lines: string[];
  periods: { fiscal_date: string; year: number; quarter: number | null; currency: string | null; values: Record<string, number | null> }[];
};

/** GET /api/dashboard/stocks/{symbol}/documents (to align). */
export type DocumentRow = {
  kind: string;
  title: string | null;
  fiscal_year: number | null;
  date: string | null;
  download_url: string;
};

/** GET /api/stock-values/{symbol}?window=…&indicators=daily (backend main + the 5D/YTD/MAX windows to align). */
export type PricePoint = {
  date: string;
  close: number | null;
  adj_close?: number | null;
  sma_20?: number | null;
  ema_20?: number | null;
  rsi_14?: number | null;
  macd_value?: number | null;
  macd_signal?: number | null;
  macd_histogram?: number | null;
};

/** GET /api/analyst-consensus?symbol= (backend main). data null: not covered. */
export type Consensus = {
  symbol: string;
  analyst_count: number | null;
  distribution: { strong_buy: number | null; buy: number | null; hold: number | null; sell: number | null; strong_sell: number | null };
  price_target: { consensus: number | null; low: number | null; high: number | null; currency: string | null } | null;
  attribution?: string;
  updated_at?: string;
  analysts: {
    analyst_name?: string;
    firm: string;
    rating: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
    price_target: number | null;
    currency?: string;
    rated_at: string;
  }[];
};

/** GET /api/stock-commentary?symbol= (backend main): data null when none in the last 30 days. */
export type Commentary = {
  id: number;
  symbol: string;
  text: string;
  language: string;
  session_date: string;
  published_at: string;
  attribution: string;
  source_url: string | null;
};

/** GET /api/blogs?azione={id} and /api/blogs/{id} (backend main). */
export type Blog = {
  id: number;
  title: string;
  created_at: string;
  image_url: string | null;
  testata?: { name?: string | null } | null;
  summary?: Record<string, { happening?: string; meaning?: string; effects?: string; care?: string }> | null;
};

/** GET /api/watch-aziones (backend main): Azione rows. */
export type WatchRow = {
  id: number;
  symbol: string;
  name: string | null;
  common_name?: string | null;
  value?: number | string | null;
  percent_change?: number | string | null;
  exchange_mic?: string | null;
  exchange?: string | null;
  currency?: string | null;
  logo_url?: string | null;
};
