// MOB-1376: the News pages' data shapes (finzy-backend routes/admin/news.php),
// their Italian words (design/v2/ADMIN-NEWS.md) and the small formatters.

import { ApiError, CONSOLE_HEADER } from "./api";

export type SummaryState = "ready" | "pending" | "failed" | "none";
export type ImageState = "ready" | "uploaded" | "pending" | "failed" | "none";
export type Source = { id: number; name: string };

export type ArticleRow = {
  id: number;
  title: string;
  source: Source | null;
  created_at: string | null;
  in_feed: boolean;
  is_movement: boolean;
  summary: SummaryState;
  image: ImageState;
  image_url: string | null;
  active: boolean;
};
export type ArticlePage = { rows: ArticleRow[]; total: number; page: number; per_page: number };

export type Link = {
  blog_id: number;
  azione_id: number;
  symbol: string;
  name: string;
  logo_url: string | null;
  type: "indirect" | "direct";
  legacy: boolean;
  confidence: number | null;
  reason: string | null;
  source: string | null;
  review: "correct" | "wrong" | null;
  reviewed_at: string | null;
  reviewed_by: { id: number; name: string } | null;
  removed: boolean;
};
export type QueueLink = Link & {
  article: { id: number; title: string; excerpt: string; source: Source | null; created_at: string | null; url: string | null };
};
export type QueueTab = "todo" | "correct" | "wrong" | "removed";
export type QueuePage = {
  rows: QueueLink[];
  counts: Record<QueueTab, number>;
  total: number;
  page: number;
  per_page: number;
  filters: { tab: QueueTab; type: "indirect" | "direct"; max_confidence: number; days: number; source: number | null };
  meta: { judged_indirect: number; correct_indirect: number; total_indirect: number; judged_direct: number; total_direct: number; legacy: number; precision: number | null; min_verdicts: number };
};

export type SummaryBlock = { happening?: string; meaning?: string; effects?: string; care?: string };
type Named = { id: number; name: { it: string; en: string } };
export type Article = Omit<ArticleRow, "title" | "image" | "summary"> & {
  title: { it: string; en: string };
  text: { it: string; en: string };
  summary: { it: SummaryBlock | null; en: SummaryBlock | null } | null;
  summary_state: SummaryState;
  summary_at: string | null;
  image_state: ImageState;
  image: { url: string; origin: string } | null;
  image_info: { origin: string; at: string | null } | null;
  feed_category: string | null;
  url: string | null;
  topics: Named[];
  markets: Named[];
  links: Link[];
  last_edit: { at: string | null; who: { id: number; name: string } | null; event: string } | null;
};

export type SourceToday = {
  id: number;
  name: string;
  state: "ok" | "stop" | "quiet";
  collected: number;
  in_feed: number;
  movements: number;
  hours: number[];
  latest_at: string | null;
  silent_minutes: number | null;
  limit_minutes: number;
  working_hours: [number, number];
};
export type Counts = { ready: number; pending: number; failed: number; total: number };
export type Today = { updated_at: string; sources: SourceToday[]; ai: { summaries: Counts; images: Counts }; latest: ArticleRow[] };

export type TaxonomyKind = "sources" | "categories" | "topics" | "markets";
export type TaxonomyRow = {
  id: number;
  name: { it: string; en: string };
  articles: number;
  description?: { it: string; en: string };
  visible?: boolean;
  last_article_at?: string | null;
};

export const SUMMARY_WORD: Record<SummaryState, string> = { ready: "Pronto", pending: "In attesa", failed: "Non riuscito", none: "Non serve" };
export const STATE_WORD = { on: "Visibile", off: "Nascosto" };
export const SOURCE_WORD = { ok: "Attiva", stop: "Ferma", quiet: "Tranquilla" } as const;

/** Italian thousands with a dot, whatever ICU the runtime has. */
export const num = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const conf = (c: number | null) => (c === null ? "—" : c.toFixed(2).replace(".", ","));

const ROME = "Europe/Rome";
export const hhmm = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: ROME }) : "—");
export const dayTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: ROME }) : "—";
export const fullDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: ROME }) : "—";

/** «2 ore e 40 minuti fa», «10 minuti fa». */
export function ago(minutes: number | null): string {
  if (minutes === null) return "";
  if (minutes < 1) return "adesso";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hs = h === 1 ? "1 ora" : `${h} ore`;
  const ms = m === 1 ? "1 minuto" : `${m} minuti`;
  if (h === 0) return `${ms} fa`;
  return m === 0 ? `${hs} fa` : `${hs} e ${ms} fa`;
}

/** «2 ore e 40 minuti» (no «fa»), for the stop banner. */
export const span = (minutes: number) => ago(minutes).replace(/ fa$/, "");

/** YYYY-MM-DD of a day in Rome, for the period filter. */
export function romeDay(d: Date): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: ROME, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return p;
}

export type Period = "" | "today" | "yesterday" | "7" | "30" | "range";

/** The period as from/to days in Rome. */
export function periodRange(p: Period, from: string, to: string, now = new Date()): { from?: string; to?: string } {
  const day = (offset: number) => romeDay(new Date(now.getTime() - offset * 86_400_000));
  switch (p) {
    case "today": return { from: day(0), to: day(0) };
    case "yesterday": return { from: day(1), to: day(1) };
    case "7": return { from: day(6), to: day(0) };
    case "30": return { from: day(29), to: day(0) };
    case "range": return { from: from || undefined, to: to || undefined };
    default: return {};
  }
}

/**
 * The image upload is multipart, which the shell's JSON client does not send:
 * the same header, credentials and error shape, by hand.
 */
export async function uploadImage(blogId: number, file: File, base = "/api/admin"): Promise<Article> {
  const body = new FormData();
  body.append("image", file);
  let res: Response;
  try {
    res = await fetch(`${base}/news/articles/${blogId}/image`, { method: "POST", body, credentials: "same-origin", headers: { Accept: "application/json", [CONSOLE_HEADER]: "1" } });
  } catch {
    throw new ApiError(0, "offline");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (data as { code?: string } | null)?.code ?? null, data);
  return data as Article;
}
