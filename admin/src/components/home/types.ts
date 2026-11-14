// MOB-1373: the answer of GET /api/admin/home (backend AdminHomePayload).
// A group is present only if the role opens its page; a group whose query
// failed is {error: "unavailable"}. Times are ISO 8601 with the Rome offset,
// money in dollars.

export type Failed = { error: "unavailable" };
export type Period = { today: number; week: number; month: number };
export type LineKey = "images" | "articles" | "stock_snapshot" | "financial_report";

export type AiSpend = {
  week: number;
  month: number;
  week_from: string;
  month_from: string;
  lines: Record<LineKey, { today: number; month: number }>;
  latest_at: string | null;
};

export type PlanKey = "free" | "premium" | "unlimited" | "trial";

export type Users = {
  new: { today: number; d7: number; d30: number };
  registered: number;
  per_plan: Record<PlanKey, number>;
  store_started_month: number;
  latest_at: string | null;
};

export type News = { mt: { collected: Period; selected: Period }; latest_at: string | null };

export type Alert =
  | { kind: "budget"; level: "critical"; group: "ai_spend"; provider: string; spend: number; budget: number; percent: number }
  | { kind: "customer_io"; level: "warning"; group: "ai_spend"; count: number }
  | { kind: "mt_stopped"; level: "warning"; group: "news"; latest_at: string; hours: number };

export type GroupKey = "ai_spend" | "users" | "news";

export type HomeData = {
  generated_at: string;
  groups: { ai_spend?: AiSpend | Failed; users?: Users | Failed; news?: News | Failed };
  alerts: Alert[];
};

export const isFailed = (g: unknown): g is Failed => typeof g === "object" && g !== null && "error" in g;

/** The permission of each group's page: the group shows only with it (decision 6 on MOB-1373). */
export const GROUP_PERM: Record<GroupKey, string> = { ai_spend: "console.spend.view", users: "console.users.view", news: "console.news.view" };
