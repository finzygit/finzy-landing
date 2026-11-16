// MOB-1375: what GET /api/admin/revenue and /api/admin/promotions answer
// (finzy-backend RevenueController, PromotionController / PromotionPayload).

export type RevenueRow = {
  user: { id: number; name: string } | null;
  plan: string;
  cadence: "monthly" | "annual" | null;
  platform: string;
  at: string;
  kind: "payment" | "refund";
  currency: string;
  paid: number;
  gross: number;
  net: number;
};

export type Revenue = {
  month: string;
  first_month: string | null;
  last_month: string;
  updated_at: string | null;
  totals: { gross: number; commission: number; tax: number; net: number; payments: number; refunds: number; refunds_gross: number };
  previous: { month: string; net: number };
  trend: { month: string; net: number }[];
  by_plan: { label: string; net: number; share: number }[];
  by_platform: { label: string; net: number; share: number }[];
  filters: { plans: string[]; platforms: string[] };
  counts: { all: number; payments: number; refunds: number };
  rows: RevenueRow[];
  total: number;
  filtered_net: number;
  page: number;
  per_page: number;
  can_export: boolean;
};

export type FormulaKey = "quarterly" | "annual";
export const FORMULAS: FormulaKey[] = ["quarterly", "annual"];
export type Country = "IT" | "GB";
export const COUNTRIES: Country[] = ["IT", "GB"];
export type UserState = "trial" | "free" | "premium";
export const STATES: UserState[] = ["trial", "free", "premium"];
export const MONTHS: Record<FormulaKey, number> = { quarterly: 3, annual: 12 };
export const CURRENCY: Record<Country, string> = { IT: "EUR", GB: "GBP" };

export type Formula = {
  enabled: boolean;
  prices: Partial<Record<Country, string>>;
  apple_offer_id: string;
  apple_offer_code: string;
  google_offer_id: string;
};

export type PromoState = "active" | "scheduled" | "ended";

export type PromoRow = {
  id: number;
  name: string;
  code: string;
  starts_at: string;
  ends_at: string;
  countries: Country[];
  statuses: UserState[];
  formulas_on: FormulaKey[];
  state: PromoState;
};

export type PromoList = { rows: PromoRow[]; counts: { all: number; active: number; scheduled: number; ended: number }; can_update: boolean };

export type PromoDetail = PromoRow & {
  formulas: Record<FormulaKey, Formula>;
  totals: Partial<Record<FormulaKey, Partial<Record<Country, string>>>>;
  history: { created: { by: string | null; at: string } | null; updated: { by: string | null; at: string } | null };
};

/** The stepped form's state; prices as typed («5,99»), dates as datetime-local values. */
export type PromoDraft = {
  name: string;
  code: string;
  starts_at: string;
  ends_at: string;
  countries: Country[];
  statuses: UserState[];
  formulas: Record<FormulaKey, Formula>;
};

export function emptyFormula(): Formula {
  return { enabled: false, prices: {}, apple_offer_id: "", apple_offer_code: "", google_offer_id: "" };
}

export function emptyDraft(): PromoDraft {
  return { name: "", code: "", starts_at: "", ends_at: "", countries: [], statuses: [], formulas: { quarterly: emptyFormula(), annual: emptyFormula() } };
}
