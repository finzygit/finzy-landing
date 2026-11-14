// MOB-1198 (FZW-WEB-05, 06, 07): names of the data lines the backend sends
// by key (statement lines, statistics fields, Piotroski criteria). Where a
// board draws the line, its words are used (IT and EN); the others are the
// build lane's (new texts, D385: listed in the PR for Victor's OK).
import type { Lang } from "./format.ts";

type Pair = [it: string, en: string];

// ---------------------------------------------------------------- statements

/** total: bold row; sub: indented grey row; plain: normal row. */
export type RowKind = "total" | "sub" | "plain";
export type StatementLine = { label: Pair; kind: RowKind; perShare?: boolean };

const L = (it: string, en: string, kind: RowKind, perShare = false): StatementLine => ({ label: [it, en], kind, perShare });

export const STATEMENT_LINES: Record<string, StatementLine> = {
  // income_statement (board: Ricavi … Dividendi per azione)
  sales: L("Ricavi", "Revenue", "total"),
  cost_of_goods: L("Costo del venduto", "Cost of revenue", "sub"),
  gross_profit: L("Utile lordo", "Gross profit", "total"),
  "operating_expense.research_and_development": L("Ricerca e sviluppo", "Research and development", "sub"),
  "operating_expense.selling_general_and_administrative": L("Spese generali e amministrative", "SG&A", "sub"),
  "operating_expense.other_operating_expenses": L("Altri costi operativi", "Other operating expenses", "sub"),
  operating_income: L("Utile operativo", "Operating income", "total"),
  "non_operating_interest.income": L("Interessi attivi", "Interest income", "sub"),
  "non_operating_interest.expense": L("Interessi passivi", "Interest expense", "sub"),
  other_income_expense: L("Proventi e oneri finanziari", "Non-operating income", "sub"),
  pretax_income: L("Utile prima delle imposte", "Pretax income", "total"),
  income_tax: L("Imposte", "Income tax", "sub"),
  net_income: L("Utile netto", "Net income", "total"),
  net_income_continuous_operations: L("Utile delle attività continuative", "Net income from continuing operations", "plain"),
  minority_interests: L("Quota di terzi", "Minority interests", "plain"),
  preferred_stock_dividends: L("Dividendi su azioni privilegiate", "Preferred stock dividends", "plain"),
  eps_basic: L("EPS base", "Basic EPS", "plain", true),
  eps_diluted: L("EPS diluito", "Diluted EPS", "plain", true),
  basic_shares_outstanding: L("Azioni medie (base)", "Basic shares outstanding", "plain"),
  diluted_shares_outstanding: L("Azioni medie (diluite)", "Diluted shares outstanding", "plain"),
  ebit: L("EBIT", "EBIT", "plain"),
  ebitda: L("EBITDA", "EBITDA", "plain"),

  // balance_sheet (board: Totale attivo, Attivo corrente, Disponibilità liquide, …)
  "assets.current_assets.cash": L("Cassa", "Cash", "sub"),
  "assets.current_assets.cash_equivalents": L("Mezzi equivalenti", "Cash equivalents", "sub"),
  "assets.current_assets.cash_and_cash_equivalents": L("Disponibilità liquide", "Cash and cash equivalents", "sub"),
  "assets.current_assets.other_short_term_investments": L("Investimenti a breve", "Short-term investments", "sub"),
  "assets.current_assets.accounts_receivable": L("Crediti verso clienti", "Accounts receivable", "sub"),
  "assets.current_assets.other_receivables": L("Altri crediti", "Other receivables", "sub"),
  "assets.current_assets.inventory": L("Rimanenze", "Inventory", "sub"),
  "assets.current_assets.prepaid_assets": L("Risconti attivi", "Prepaid assets", "sub"),
  "assets.current_assets.restricted_cash": L("Liquidità vincolata", "Restricted cash", "sub"),
  "assets.current_assets.assets_held_for_sale": L("Attività destinate alla vendita", "Assets held for sale", "sub"),
  "assets.current_assets.hedging_assets": L("Attività di copertura", "Hedging assets", "sub"),
  "assets.current_assets.other_current_assets": L("Altre attività correnti", "Other current assets", "sub"),
  "assets.current_assets.total_current_assets": L("Attivo corrente", "Total current assets", "total"),
  "assets.non_current_assets.properties": L("Immobili", "Properties", "sub"),
  "assets.non_current_assets.land_and_improvements": L("Terreni e migliorie", "Land and improvements", "sub"),
  "assets.non_current_assets.machinery_furniture_equipment": L("Impianti e macchinari", "Machinery, furniture and equipment", "sub"),
  "assets.non_current_assets.construction_in_progress": L("Immobilizzazioni in corso", "Construction in progress", "sub"),
  "assets.non_current_assets.leases": L("Beni in leasing", "Leases", "sub"),
  "assets.non_current_assets.accumulated_depreciation": L("Fondo ammortamento", "Accumulated depreciation", "sub"),
  "assets.non_current_assets.goodwill": L("Avviamento", "Goodwill", "sub"),
  "assets.non_current_assets.investment_properties": L("Investimenti immobiliari", "Investment properties", "sub"),
  "assets.non_current_assets.financial_assets": L("Attività finanziarie", "Financial assets", "sub"),
  "assets.non_current_assets.intangible_assets": L("Immobilizzazioni immateriali", "Intangible assets", "sub"),
  "assets.non_current_assets.investments_and_advances": L("Partecipazioni e anticipi", "Investments and advances", "sub"),
  "assets.non_current_assets.other_non_current_assets": L("Altre attività non correnti", "Other non-current assets", "sub"),
  "assets.non_current_assets.total_non_current_assets": L("Attivo non corrente", "Total non-current assets", "total"),
  "assets.total_assets": L("Totale attivo", "Total assets", "total"),
  "liabilities.current_liabilities.accounts_payable": L("Debiti verso fornitori", "Accounts payable", "sub"),
  "liabilities.current_liabilities.accrued_expenses": L("Ratei passivi", "Accrued expenses", "sub"),
  "liabilities.current_liabilities.short_term_debt": L("Debito a breve termine", "Short-term debt", "sub"),
  "liabilities.current_liabilities.deferred_revenue": L("Ricavi differiti", "Deferred revenue", "sub"),
  "liabilities.current_liabilities.tax_payable": L("Debiti tributari", "Tax payable", "sub"),
  "liabilities.current_liabilities.pensions": L("Fondi pensione", "Pensions", "sub"),
  "liabilities.current_liabilities.other_current_liabilities": L("Altre passività correnti", "Other current liabilities", "sub"),
  "liabilities.current_liabilities.total_current_liabilities": L("Passivo corrente", "Total current liabilities", "total"),
  "liabilities.non_current_liabilities.long_term_provisions": L("Fondi a lungo termine", "Long-term provisions", "sub"),
  "liabilities.non_current_liabilities.long_term_debt": L("Debito a lungo termine", "Long-term debt", "sub"),
  "liabilities.non_current_liabilities.provision_for_risks_and_charges": L("Fondi rischi e oneri", "Provisions for risks and charges", "sub"),
  "liabilities.non_current_liabilities.deferred_liabilities": L("Passività differite", "Deferred liabilities", "sub"),
  "liabilities.non_current_liabilities.derivative_product_liabilities": L("Passività per derivati", "Derivative liabilities", "sub"),
  "liabilities.non_current_liabilities.other_non_current_liabilities": L("Altre passività non correnti", "Other non-current liabilities", "sub"),
  "liabilities.non_current_liabilities.total_non_current_liabilities": L("Passivo non corrente", "Total non-current liabilities", "total"),
  "liabilities.total_liabilities": L("Totale passivo", "Total liabilities", "total"),
  "shareholders_equity.common_stock": L("Capitale sociale", "Common stock", "sub"),
  "shareholders_equity.retained_earnings": L("Utili non distribuiti", "Retained earnings", "sub"),
  "shareholders_equity.other_shareholders_equity": L("Altre riserve", "Other shareholders’ equity", "sub"),
  "shareholders_equity.total_shareholders_equity": L("Patrimonio netto", "Total shareholders’ equity", "total"),
  "shareholders_equity.additional_paid_in_capital": L("Riserva sovrapprezzo", "Additional paid-in capital", "sub"),
  "shareholders_equity.treasury_stock": L("Azioni proprie", "Treasury stock", "sub"),
  "shareholders_equity.minority_interest": L("Patrimonio di terzi", "Minority interest", "sub"),

  // cash_flow (board: Flusso di cassa operativo … Free cash flow)
  "operating_activities.net_income": L("Utile netto", "Net income", "sub"),
  "operating_activities.depreciation": L("Ammortamenti", "Depreciation", "sub"),
  "operating_activities.deferred_taxes": L("Imposte differite", "Deferred taxes", "sub"),
  "operating_activities.stock_based_compensation": L("Compensi in azioni", "Stock-based compensation", "sub"),
  "operating_activities.other_non_cash_items": L("Altre voci non monetarie", "Other non-cash items", "sub"),
  "operating_activities.accounts_receivable": L("Variazione dei crediti", "Change in receivables", "sub"),
  "operating_activities.accounts_payable": L("Variazione dei debiti", "Change in payables", "sub"),
  "operating_activities.other_assets_liabilities": L("Altre attività e passività", "Other assets and liabilities", "sub"),
  "operating_activities.operating_cash_flow": L("Flusso di cassa operativo", "Operating cash flow", "total"),
  "investing_activities.capital_expenditures": L("Investimenti in impianti", "Capital expenditures", "sub"),
  "investing_activities.net_intangibles": L("Immobilizzazioni immateriali nette", "Net intangibles", "sub"),
  "investing_activities.net_acquisitions": L("Acquisizioni e altri investimenti", "Net acquisitions", "sub"),
  "investing_activities.purchase_of_investments": L("Acquisto di investimenti", "Purchase of investments", "sub"),
  "investing_activities.sale_of_investments": L("Vendita di investimenti", "Sale of investments", "sub"),
  "investing_activities.other_investing_activity": L("Altre attività di investimento", "Other investing activity", "sub"),
  "investing_activities.investing_cash_flow": L("Flusso di cassa da investimenti", "Investing cash flow", "total"),
  "financing_activities.long_term_debt_issuance": L("Emissione di debito a lungo", "Long-term debt issuance", "sub"),
  "financing_activities.long_term_debt_payments": L("Rimborso di debito a lungo", "Long-term debt payments", "sub"),
  "financing_activities.short_term_debt_issuance": L("Emissione di debito a breve", "Short-term debt issuance", "sub"),
  "financing_activities.common_stock_issuance": L("Emissione di azioni", "Common stock issuance", "sub"),
  "financing_activities.common_stock_repurchase": L("Riacquisto di azioni proprie", "Common stock repurchase", "sub"),
  "financing_activities.common_dividends": L("Dividendi pagati", "Dividends paid", "sub"),
  "financing_activities.other_financing_charges": L("Altri flussi di finanziamento", "Other financing charges", "sub"),
  "financing_activities.financing_cash_flow": L("Flusso di cassa da finanziamenti", "Financing cash flow", "total"),
  end_cash_position: L("Liquidità di fine periodo", "End cash position", "plain"),
  income_tax_paid: L("Imposte pagate", "Income tax paid", "plain"),
  interest_paid: L("Interessi pagati", "Interest paid", "plain"),
  free_cash_flow: L("Free cash flow", "Free cash flow", "total"),
};

/** A line the dictionary does not know yet: its key, readable. */
function humanize(key: string): string {
  const last = key.split(".").pop() ?? key;
  const s = last.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function statementLine(key: string, lang: Lang): { label: string; kind: RowKind; perShare: boolean } {
  const line = STATEMENT_LINES[key];
  if (!line) return { label: humanize(key), kind: key.includes(".") ? "sub" : "plain", perShare: false };
  return { label: line.label[lang === "it" ? 0 : 1], kind: line.kind, perShare: Boolean(line.perShare) };
}

// ---------------------------------------------------------------- statistics

/**
 * How a statistics field is written: money (compact, in the statistics
 * currency), perShare (money, 2 decimals), ratio (2 decimals, 1 for P/E),
 * pct (a fraction shown as %), count (compact, no currency), date, text.
 */
export type StatKind = "money" | "perShare" | "ratio" | "pe" | "pct" | "count" | "date" | "text";
type Stat = { label: Pair; kind: StatKind };
const S = (it: string, en: string, kind: StatKind): Stat => ({ label: [it, en], kind });

export const STAT_FIELDS: Record<string, Stat> = {
  market_capitalization: S("Capitalizzazione", "Market cap", "money"),
  enterprise_value: S("Enterprise value", "Enterprise value", "money"),
  trailing_pe: S("P/E (ultimi 12 mesi)", "P/E (trailing)", "pe"),
  forward_pe: S("P/E atteso", "Forward P/E", "pe"),
  peg_ratio: S("PEG", "PEG", "ratio"),
  price_to_sales_ttm: S("Prezzo / vendite", "Price / sales", "ratio"),
  price_to_book_mrq: S("Prezzo / valore contabile", "Price / book", "ratio"),
  enterprise_to_revenue: S("EV / ricavi", "EV / revenue", "ratio"),
  enterprise_to_ebitda: S("EV / EBITDA", "EV / EBITDA", "ratio"),
  fiscal_year_ends: S("Fine dell’esercizio", "Fiscal year ends", "date"),
  most_recent_quarter: S("Ultimo trimestre", "Most recent quarter", "date"),
  gross_margin: S("Margine lordo", "Gross margin", "pct"),
  profit_margin: S("Margine netto", "Net margin", "pct"),
  operating_margin: S("Margine operativo", "Operating margin", "pct"),
  return_on_assets_ttm: S("ROA", "ROA", "pct"),
  return_on_equity_ttm: S("ROE", "ROE", "pct"),
  revenue_ttm: S("Ricavi (12 mesi)", "Revenue (TTM)", "money"),
  revenue_per_share_ttm: S("Ricavi per azione", "Revenue per share", "perShare"),
  quarterly_revenue_growth: S("Crescita trimestrale dei ricavi", "Quarterly revenue growth", "pct"),
  gross_profit_ttm: S("Utile lordo", "Gross profit", "money"),
  ebitda: S("EBITDA", "EBITDA", "money"),
  net_income_to_common_ttm: S("Utile netto", "Net income", "money"),
  diluted_eps_ttm: S("EPS diluito", "Diluted EPS", "perShare"),
  quarterly_earnings_growth_yoy: S("Crescita trimestrale degli utili", "Quarterly earnings growth", "pct"),
  total_cash_mrq: S("Liquidità totale", "Total cash", "money"),
  total_cash_per_share_mrq: S("Liquidità per azione", "Cash per share", "perShare"),
  total_debt_mrq: S("Debito totale", "Total debt", "money"),
  total_debt_to_equity_mrq: S("Debito / patrimonio", "Debt / equity", "ratio"),
  current_ratio_mrq: S("Indice di liquidità corrente", "Current ratio", "ratio"),
  book_value_per_share_mrq: S("Valore contabile per azione", "Book value per share", "perShare"),
  operating_cash_flow_ttm: S("Flusso di cassa operativo", "Operating cash flow", "money"),
  levered_free_cash_flow_ttm: S("Free cash flow (levered)", "Levered free cash flow", "money"),
  shares_outstanding: S("Azioni in circolazione", "Shares outstanding", "count"),
  float_shares: S("Flottante", "Float", "count"),
  avg_10_volume: S("Volume medio 10 giorni", "Average volume (10 days)", "count"),
  avg_90_volume: S("Volume medio 90 giorni", "Average volume (90 days)", "count"),
  shares_short: S("Azioni allo scoperto", "Shares short", "count"),
  short_ratio: S("Short ratio", "Short ratio", "ratio"),
  short_percent_of_shares_outstanding: S("Scoperto sulle azioni in circolazione", "Short % of shares outstanding", "pct"),
  percent_held_by_insiders: S("Detenute da insider", "Held by insiders", "pct"),
  percent_held_by_institutions: S("Detenute da istituzioni", "Held by institutions", "pct"),
  fifty_two_week_low: S("Minimo 52 settimane", "52-week low", "perShare"),
  fifty_two_week_high: S("Massimo 52 settimane", "52-week high", "perShare"),
  fifty_two_week_change: S("Variazione 52 settimane", "52-week change", "pct"),
  beta: S("Beta (5 anni)", "Beta (5 years)", "ratio"),
  day_50_ma: S("Media mobile 50 giorni", "50-day moving average", "perShare"),
  day_200_ma: S("Media mobile 200 giorni", "200-day moving average", "perShare"),
  forward_annual_dividend_rate: S("Dividendo annuo", "Annual dividend", "perShare"),
  forward_annual_dividend_yield: S("Rendimento", "Yield", "pct"),
  trailing_annual_dividend_rate: S("Dividendo degli ultimi 12 mesi", "Trailing annual dividend", "perShare"),
  trailing_annual_dividend_yield: S("Rendimento degli ultimi 12 mesi", "Trailing annual yield", "pct"),
  "5_year_average_dividend_yield": S("Rendimento medio a 5 anni", "5-year average yield", "pct"),
  payout_ratio: S("Payout ratio", "Payout ratio", "pct"),
  dividend_frequency: S("Frequenza del dividendo", "Dividend frequency", "text"),
  dividend_date: S("Data di pagamento", "Payment date", "date"),
  ex_dividend_date: S("Data ex dividendo", "Ex-dividend date", "date"),
  last_split_factor: S("Ultimo frazionamento", "Last split", "text"),
  last_split_date: S("Data dell’ultimo frazionamento", "Last split date", "date"),
};

export function statField(key: string, lang: Lang): { label: string; kind: StatKind } {
  const f = STAT_FIELDS[key];
  if (!f) return { label: humanize(key), kind: "text" };
  return { label: f.label[lang === "it" ? 0 : 1], kind: f.kind };
}

// ---------------------------------------------------------------- Piotroski

/** Board words (PIOTROSKI in evo_evo-web.py); `format` says how value/compared_to read. */
export const PIOTROSKI: Record<string, { label: Pair; format: "pct" | "money" | "ratio" | "count" }> = {
  roa_positive: { label: ["Utile netto positivo", "Positive net income"], format: "pct" },
  operating_cash_flow_positive: { label: ["Flusso di cassa operativo positivo", "Positive operating cash flow"], format: "money" },
  roa_increasing: { label: ["ROA in crescita sull’anno prima", "Higher ROA than the year before"], format: "pct" },
  cash_flow_above_net_income: { label: ["Flusso di cassa operativo maggiore dell’utile netto", "Operating cash flow above net income"], format: "pct" },
  leverage_not_increasing: { label: ["Debito a lungo termine in calo", "Lower long-term debt"], format: "ratio" },
  current_ratio_increasing: { label: ["Indice di liquidità corrente in crescita", "Higher current ratio"], format: "ratio" },
  no_new_shares: { label: ["Nessuna nuova azione emessa", "No new shares issued"], format: "count" },
  gross_margin_increasing: { label: ["Margine lordo in crescita", "Higher gross margin"], format: "pct" },
  asset_turnover_increasing: { label: ["Rotazione dell’attivo in crescita", "Higher asset turnover"], format: "ratio" },
};

export const STATISTIC_GROUPS = [
  ["valuation", "g_val"],
  ["profitability", "g_prof"],
  ["income_statement", "g_inc"],
  ["balance_sheet", "g_bal"],
  ["cash_flow", "g_cf"],
  ["shares_and_float", "g_sh"],
  ["stock_price_history", "g_px"],
  ["dividends_and_splits", "g_div"],
] as const;
