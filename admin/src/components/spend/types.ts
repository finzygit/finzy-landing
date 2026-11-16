// MOB-1461: the parts of GET /ai-spend and GET /health (backend AiSpendReport,
// ServiceHealthReport, AdminGrowthStats) that these pages draw. The other
// fields of MOB-1379 (period, budget, breakdowns, failures, services) are not
// read here yet.

export type TypeKey = "images" | "articles" | "stock_snapshot" | "financial_report";

export type Generation = {
  units: { today: number; d7: number; d30: number; all: number };
  spend: { today: number; d7: number; d30: number; all: number };
  unit_cost_30: number | null;
};

export type DaySpend = { day: string } & Record<TypeKey | "other", number>;

export type SpendData = {
  period: { generated_at: string };
  summary: { today: number; d7: number; d30: number; d7_from: string; d30_from: string; generations_30: number; lines_spend_30: number; unit_cost_30: number | null };
  per_day: DaySpend[];
  generations: Record<TypeKey, Generation>;
  generations_since: string | null;
};

export type Source = { key: string; requests: number; failed: number; last_at: string | null; status: "ok" | "warn"; reason: "failed_share" | "source_check" | null };

export type HealthData = { checked_at: string; sources: { counting_since: string | null; items: Source[] } };
