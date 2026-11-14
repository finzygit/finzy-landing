// MOB-1198: the API the screenshots and layout checks run against: the
// boards' example data (NVDA, ASML, JPM, TSM), served by page.route. No call
// reaches staging or production.
import type { Page, Route } from "@playwright/test";

type Opts = { signedIn?: boolean; unlimited?: boolean; watch?: string[]; lang?: "it" | "en" };

const ok = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data, message: "ok" }) });

const HEADERS: Record<string, object> = {
  NVDA: { id: 101, symbol: "NVDA", name: "Nvidia Corp", exchange: "Nasdaq", currency: "USD", last_price: 221.3, day_change_percent: -3.16, quoted_at: "2026-11-13T21:00:00Z", is_us: true, logo_url: null },
  ASML: { id: 102, symbol: "ASML", name: "ASML Holding NV", exchange: "Euronext Amsterdam", currency: "USD", last_price: 742.6, day_change_percent: 1.24, quoted_at: "2026-11-13T16:35:00Z", is_us: false, logo_url: null },
  JPM: { id: 103, symbol: "JPM", name: "JPMorgan Chase & Co", exchange: "NYSE", currency: "USD", last_price: 301.18, day_change_percent: 0.42, quoted_at: "2026-11-13T21:00:00Z", is_us: true, logo_url: null },
  TSM: { id: 104, symbol: "TSM", name: "Taiwan Semiconductor Manufacturing Company Limited (ADR)", exchange: "NYSE", currency: "USD", last_price: 287.05, day_change_percent: 0, quoted_at: "2026-11-13T21:00:00Z", is_us: true, logo_url: null },
  MSFT: { id: 105, symbol: "MSFT", name: "Microsoft Corp", exchange: "Nasdaq", currency: "USD", last_price: 508.12, day_change_percent: -0.37, quoted_at: "2026-11-13T21:00:00Z", is_us: true, logo_url: null },
  MU: { id: 106, symbol: "MU", name: "Micron Technology Inc", exchange: "Nasdaq", currency: "USD", last_price: 212.64, day_change_percent: 1.82, quoted_at: "2026-11-13T21:00:00Z", is_us: true, logo_url: null },
  AMD: { id: 107, symbol: "AMD", name: "Advanced Micro Devices Inc", exchange: "Nasdaq", currency: "USD", last_price: 247.96, day_change_percent: -1.05, quoted_at: "2026-11-13T21:00:00Z", is_us: true, logo_url: null },
  AMZN: { id: 108, symbol: "AMZN", name: "Amazon.com Inc", exchange: "Nasdaq", currency: "USD", last_price: 214.57, day_change_percent: 0.84, quoted_at: "2026-11-13T21:00:00Z", is_us: true, logo_url: null },
};

const DESC =
  "NVIDIA Corporation, a computing infrastructure company, provides graphics and compute and networking solutions in the United States, Singapore, Taiwan, China, Hong Kong, and internationally. The Compute & Networking segment comprises Data Center computing platforms and end-to-end networking platforms, including Quantum for InfiniBand and Spectrum for Ethernet; the NVIDIA DGX Cloud computing services; and automotive platforms. The Graphics segment offers GeForce GPUs for gaming and PCs.";

function series(seed: number, last: number, n = 300): object[] {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const closes: number[] = [];
  let v = last * 0.72;
  for (let i = 0; i < n; i++) {
    v *= 1 + (rnd() - 0.47) * 0.035;
    closes.push(v);
  }
  const k = last / closes[n - 1];
  const out: object[] = [];
  const start = Date.UTC(2026, 10, 13) - (n - 1) * 86_400_000;
  let ema = closes[0] * k;
  let fast = ema;
  let slow = ema;
  let sig = 0;
  for (let i = 0; i < n; i++) {
    const c = closes[i] * k;
    const win = closes.slice(Math.max(0, i - 19), i + 1).map((y) => y * k);
    ema = ema + (2 / 21) * (c - ema);
    fast = fast + (2 / 13) * (c - fast);
    slow = slow + (2 / 27) * (c - slow);
    const macd = fast - slow;
    sig = sig + (2 / 10) * (macd - sig);
    const ups = win.slice(1).map((y, j) => Math.max(0, y - win[j])).reduce((a, b) => a + b, 0);
    const downs = win.slice(1).map((y, j) => Math.max(0, win[j] - y)).reduce((a, b) => a + b, 0) || 1;
    out.push({
      date: new Date(start + i * 86_400_000).toISOString().slice(0, 10),
      close: Number(c.toFixed(2)),
      sma_20: Number((win.reduce((a, b) => a + b, 0) / win.length).toFixed(2)),
      ema_20: Number(ema.toFixed(2)),
      rsi_14: Number((100 - 100 / (1 + ups / downs)).toFixed(1)),
      macd_value: Number(macd.toFixed(2)),
      macd_signal: Number(sig.toFixed(2)),
      macd_histogram: Number((macd - sig).toFixed(2)),
    });
  }
  return out;
}

const STATS = {
  symbol: "NVDA",
  currency: "USD",
  updated_at: "2026-11-13T06:00:00Z",
  groups: {
    valuation: { market_capitalization: 5.39e12, enterprise_value: 5.34e12, trailing_pe: 52.8, forward_pe: 38.6, peg_ratio: 1.14, price_to_sales_ttm: 28.1, price_to_book_mrq: 45.9, enterprise_to_revenue: 27.8, enterprise_to_ebitda: 45.0 },
    profitability: { fiscal_year_ends: "2026-01-25", most_recent_quarter: "2026-10-26", gross_margin: 0.75, profit_margin: 0.558, operating_margin: 0.624, return_on_assets_ttm: 0.531, return_on_equity_ttm: 1.094 },
    income_statement: { revenue_ttm: 165.2e9, revenue_per_share_ttm: 6.77, quarterly_revenue_growth: 0.556, gross_profit_ttm: 118.6e9, ebitda: 104e9, net_income_to_common_ttm: 92.2e9, diluted_eps_ttm: 4.19, quarterly_earnings_growth_yoy: 0.592 },
    balance_sheet: { total_cash_mrq: 56.8e9, total_cash_per_share_mrq: 2.33, total_debt_mrq: 10.6e9, total_debt_to_equity_mrq: 0.14, current_ratio_mrq: 4.44, book_value_per_share_mrq: 4.82 },
    cash_flow: { operating_cash_flow_ttm: 82.1e9, levered_free_cash_flow_ttm: null },
    shares_and_float: { shares_outstanding: 24.3e9, float_shares: 23.4e9, avg_10_volume: 182e6, avg_90_volume: 201e6, shares_short: 232.1e6, short_ratio: 1.21, short_percent_of_shares_outstanding: 0.0095, percent_held_by_insiders: 0.041, percent_held_by_institutions: 0.682 },
    stock_price_history: { fifty_two_week_low: 112.3, fifty_two_week_high: 236.48, fifty_two_week_change: 0.384, beta: 1.72, day_50_ma: 186.4, day_200_ma: 158.22 },
    dividends_and_splits: { forward_annual_dividend_rate: 0.04, forward_annual_dividend_yield: 0.0002, trailing_annual_dividend_rate: 0.04, trailing_annual_dividend_yield: 0.0002, "5_year_average_dividend_yield": 0.0008, payout_ratio: 0.0107, dividend_frequency: "Quarterly", dividend_date: "2026-10-03", ex_dividend_date: "2026-09-11", last_split_factor: "10:1", last_split_date: "2024-06-10" },
  },
};

const crit = (key: string, passed: boolean, value: number, compared_to: number) => ({ key, passed, value, compared_to });
const SCORES = {
  symbol: "NVDA",
  fiscal_date: "2026-01-25",
  currency: "USD",
  computed_at: "2026-11-13T06:00:00Z",
  piotroski: {
    computable: true,
    reason: null,
    fiscal_date: "2026-01-25",
    score: 7,
    max: 9,
    criteria: [
      crit("roa_positive", true, 0.653, 0),
      crit("operating_cash_flow_positive", true, 64.1e9, 0),
      crit("roa_increasing", true, 0.653, 0.453),
      crit("cash_flow_above_net_income", false, 0.574, 0.653),
      crit("leverage_not_increasing", true, 0.06, 0.07),
      crit("current_ratio_increasing", false, 4.17, 4.44),
      crit("no_new_shares", true, 24.5e9, 24.6e9),
      crit("gross_margin_increasing", true, 0.75, 0.727),
      crit("asset_turnover_increasing", true, 1.17, 0.93),
    ],
  },
  altman: { computable: true, reason: null, fiscal_date: "2026-01-25", score: 4.12, zone: "safe", thresholds: { distress_below: 1.81, safe_above: 2.99 } },
  beneish: { computable: true, reason: null, fiscal_date: "2026-01-25", score: -2.41, threshold: -1.78, above_threshold: false },
};
const FIN_NA = { computable: false, reason: "financial_sector", missing: [], score: null };

const INCOME_LINES = ["sales", "cost_of_goods", "gross_profit", "operating_expense.research_and_development", "operating_expense.selling_general_and_administrative", "operating_expense.other_operating_expenses", "operating_income", "non_operating_interest.income", "non_operating_interest.expense", "other_income_expense", "pretax_income", "income_tax", "net_income", "net_income_continuous_operations", "minority_interests", "preferred_stock_dividends", "eps_basic", "eps_diluted", "basic_shares_outstanding", "diluted_shares_outstanding", "ebit", "ebitda"];
const REV = [130497, 60922, 26974, 26914, 16675, 10918, 11716, 9714, 6910];

function financials(statement: string, period: string) {
  const years = period === "annual" ? 9 : 9;
  const periods = Array.from({ length: years }, (_, i) => {
    const year = period === "annual" ? 2026 - i : 2026 - Math.floor((i + 1) / 4);
    const quarter = period === "annual" ? null : ((3 - i) % 4 + 4) % 4 + 1;
    const r = REV[i] * 1e6 * (period === "annual" ? 1 : 0.27);
    const values: Record<string, number | null> = {};
    for (const line of INCOME_LINES) values[line] = null;
    Object.assign(values, {
      sales: r,
      cost_of_goods: r * 0.25,
      gross_profit: r * 0.75,
      "operating_expense.research_and_development": r * 0.099,
      "operating_expense.selling_general_and_administrative": r * 0.027,
      operating_income: r * 0.624,
      other_income_expense: i % 3 === 2 ? -r * 0.002 : r * 0.012,
      pretax_income: r * 0.636,
      income_tax: r * 0.085,
      net_income: r * 0.558,
      eps_basic: 2.97 / (i + 1),
      eps_diluted: 2.94 / (i + 1),
      ebitda: r * 0.638,
      ebit: r * 0.63,
    });
    return { fiscal_date: `${year}-01-25`, year, quarter, currency: "USD", values };
  });
  return { symbol: "NVDA", statement, period, currency: "USD", lines: INCOME_LINES, periods };
}

const CONSENSUS = {
  symbol: "NVDA",
  analyst_count: 25,
  distribution: { strong_buy: 5, buy: 13, hold: 6, sell: 1, strong_sell: 0 },
  price_target: { consensus: 212.4, low: 160, high: 275, currency: "USD" },
  analysts: [
    ["Cantor Fitzgerald", "buy", 275, "2026-11-12"],
    ["Morgan Stanley", "buy", 260, "2026-09-28"],
    ["Bernstein", "buy", 245, "2026-09-25"],
    ["Barclays", "hold", 200, "2026-09-19"],
    ["UBS", "buy", 250, "2026-09-12"],
    ["HSBC", "sell", 160, "2026-09-09"],
    ["Goldman Sachs", "buy", 240, "2026-09-04"],
    ["Jefferies", "hold", 210, "2026-08-29"],
    ["Citi", "buy", 235, "2026-08-22"],
    ["Wells Fargo", "buy", 230, "2026-08-20"],
  ].map(([firm, rating, pt, d]) => ({ firm, rating, price_target: pt, currency: "USD", rated_at: d })),
};

const WHY = {
  id: 1,
  symbol: "NVDA",
  text: "Nvidia shares are trading lower after the US Commerce Department tightened export rules on advanced chips to China. Analysts expect a limited impact on this quarter's revenue, while the whole semiconductor group trades lower in sympathy.",
  language: "en",
  session_date: "2026-11-13",
  published_at: "2026-11-13T19:10:00Z",
  attribution: "Benzinga",
  source_url: "https://www.benzinga.com/",
};

const SUM = {
  it: {
    happening: "Le azioni di Nvidia hanno chiuso in calo del 3,2% dopo che il Dipartimento del Commercio degli Stati Uniti ha esteso le restrizioni all’export di chip avanzati verso la Cina.",
    meaning: "Secondo l’azienda, le nuove regole riguardano una parte limitata dei ricavi del trimestre. Gli analisti si aspettano un impatto contenuto sui conti, mentre tutto il settore dei semiconduttori ha perso terreno.",
    effects: "Perché conta: la Cina valeva circa il 13% dei ricavi di Nvidia nell’ultimo esercizio.",
  },
};
const BLOGS = [
  ["Nvidia scende dopo le nuove regole USA sull’export di chip verso la Cina", "MT Newswires", "2026-11-13T17:42:00Z"],
  ["Cantor Fitzgerald ribadisce Overweight su Nvidia, obiettivo $275", "MT Newswires", "2026-11-12T14:10:00Z"],
  ["I semiconduttori trascinano il Nasdaq: Nvidia e Broadcom in calo", "Adnkronos", "2026-11-11T21:05:00Z"],
  ["Nvidia, i ricavi del data center superano le attese degli analisti", "MT Newswires", "2026-11-06T22:15:00Z"],
].map(([title, testata, created_at], i) => ({ id: 900 + i, title, created_at, image_url: null, testata: { name: testata }, summary: SUM }));

const DOCS = [
  { kind: "financial_report_deck", title: "Financial report", fiscal_year: 2026, date: "2026-10-02", download_url: "/api/stock-reports/financial/NVDA" },
  { kind: "ten_k_analysis", title: "10-K analysis", fiscal_year: 2026, date: "2026-10-02", download_url: "/api/stock-reports/55/download" },
  { kind: "ten_k_filing", title: "10-K", fiscal_year: 2026, date: "2026-02-26", download_url: "https://www.sec.gov/Archives/edgar/data/1045810/x.htm" },
  { kind: "ten_k_filing", title: "10-K", fiscal_year: 2025, date: "2025-02-26", download_url: "https://www.sec.gov/Archives/edgar/data/1045810/y.htm" },
  { kind: "ten_k_filing", title: "10-K", fiscal_year: 2024, date: "2024-02-21", download_url: "https://www.sec.gov/Archives/edgar/data/1045810/z.htm" },
];

const WATCH = ["AMZN", "MSFT", "JPM", "ASML", "NVDA"].map((s) => {
  const h = HEADERS[s] as { id: number; name: string; exchange: string; last_price: number; day_change_percent: number };
  return { id: h.id, symbol: s, name: h.name, exchange: h.exchange, value: h.last_price, percent_change: h.day_change_percent, logo_url: null };
});

export async function mockApi(page: Page, opts: Opts = {}) {
  const { signedIn = true, unlimited = true } = opts;
  let watch = (opts.watch ?? ["AMZN", "MSFT", "JPM", "ASML", "NVDA"]).map((s) => WATCH.find((w) => w.symbol === s)!).filter(Boolean);
  await page.route("**/api/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, "");
    const method = route.request().method();
    const q = url.searchParams;
    if (p === "/web/me") {
      return route.fulfill(signedIn ? ok({ id: 1, email: "valentina.russo@email.it", name: "Valentina Russo", first_name: "Valentina", lang: opts.lang ?? "it", is_unlimited: unlimited }) : { status: 401, body: "{}" });
    }
    if (p === "/web/refresh") return route.fulfill({ status: signedIn ? 200 : 401, body: "{}" });
    if (p === "/web/login" || p === "/web/logout") return route.fulfill(ok(null));
    if (p === "/dashboard/search") {
      const term = (q.get("q") ?? "").toLowerCase();
      const rows = Object.values(HEADERS).filter((h) => JSON.stringify(h).toLowerCase().includes(term));
      return route.fulfill(ok(term === "zzzx" ? [] : rows.slice(0, 3)));
    }
    const m = /^\/dashboard\/stocks\/([^/]+)(?:\/(\w+))?$/.exec(p);
    if (m) {
      const sym = m[1].toUpperCase();
      if (!HEADERS[sym]) return route.fulfill({ status: 404, body: '{"success":false}' });
      if (!m[2]) return route.fulfill(ok(HEADERS[sym]));
      if (m[2] === "profile")
        return route.fulfill(
          ok({ symbol: sym, name: (HEADERS[sym] as { name: string }).name, type: "Common Stock", exchange: "Nasdaq", currency: "USD", country: "United States", sector: "Technology", industry: "Semiconductors", employees: 36000, website: "https://www.nvidia.com", phone: "+1 408 486 2000", address: "2788 San Tomas Expressway, Santa Clara, CA 95051", ceo: "Jen-Hsun Huang", description: DESC, updated_at: "2026-11-01T00:00:00Z" }),
        );
      if (m[2] === "statistics") return route.fulfill(ok({ ...STATS, symbol: sym }));
      if (m[2] === "scores") return route.fulfill(ok(sym === "JPM" ? { symbol: sym, fiscal_date: null, currency: "USD", computed_at: null, piotroski: FIN_NA, altman: FIN_NA, beneish: FIN_NA } : SCORES));
      if (m[2] === "financials") return route.fulfill(ok(financials(q.get("statement") ?? "income", q.get("period") ?? "annual")));
      if (m[2] === "documents") return route.fulfill(ok(sym === "TSM" ? [] : DOCS));
    }
    const sv = /^\/stock-values\/(\w+)$/.exec(p);
    if (sv) {
      const h = HEADERS[sv[1]] as { last_price: number; id: number };
      const all = series(h.id, h.last_price);
      const w = q.get("window");
      if (w === "1D") {
        const start = Date.UTC(2026, 10, 13, 14, 30);
        const pts = (all.slice(-27) as { close: number }[]).map((x, i) => ({ date: new Date(start + i * 15 * 60_000).toISOString(), close: x.close }));
        return route.fulfill(ok(pts));
      }
      const n = { "1D": 0, "5D": 5, "1M": 44, "6M": 196, YTD: 230, "1Y": 300, "5Y": 300, MAX: 300 }[w ?? "6M"] ?? 196;
      return route.fulfill(ok(all.slice(-n || all.length)));
    }
    if (p === "/analyst-consensus") return route.fulfill(ok(q.get("symbol") === "NVDA" ? CONSENSUS : null));
    if (p === "/stock-commentary") return route.fulfill(ok(q.get("symbol") === "NVDA" ? WHY : null));
    if (p === "/blogs") return route.fulfill(ok(q.get("azione") === "101" ? BLOGS : []));
    if (p.startsWith("/blogs/")) return route.fulfill(ok(BLOGS[0]));
    if (p === "/watch-aziones") {
      if (method === "POST") {
        const id = JSON.parse(route.request().postData() ?? "{}").azione_id;
        const add = WATCH.find((x) => x.id === id) ?? { id, symbol: Object.keys(HEADERS).find((k) => (HEADERS[k] as { id: number }).id === id) };
        watch = [add as (typeof WATCH)[number], ...watch];
        return route.fulfill(ok(add));
      }
      return route.fulfill(ok(watch.slice(0, Number(q.get("limit") ?? 20))));
    }
    if (p.startsWith("/watch-aziones/") && method === "DELETE") {
      const id = Number(p.split("/").pop());
      watch = watch.filter((x) => x.id !== id);
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' });
    }
    return route.fulfill({ status: 404, body: '{"success":false}' });
  });
}
