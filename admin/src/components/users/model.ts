// MOB-1374: the Utenti pages' data (GET /api/admin/users…, backend
// UsersController / UserPlanController) and the words they share. Texts are the
// board's (design/v2/ADMIN-ADM-USERS.md on #706): «#234» and «#237» sentences
// word for word, the «nuovo» ones waiting for Victor's OK (D385).

export type Plan = "free" | "trial" | "premium" | "unlimited";
export const PLANS: Plan[] = ["free", "trial", "premium", "unlimited"];
export const PLAN_LABEL: Record<Plan, string> = { free: "Free", trial: "In prova", premium: "Premium", unlimited: "Unlimited" };

export type Generations = { total: number; snapshot: number; report: number; portal: number };

export type UserRow = {
  id: number;
  name: string | null;
  email: string;
  plan: Plan;
  plan_until: string | null;
  created_at: string | null;
  lang: string | null;
  // MOB-1462 (items 15–17, 19): consents, last access (ISO time, null before 16/11), generations, suspended since.
  terms_accepted_at?: string | null;
  privacy_accepted_at?: string | null;
  last_access_at?: string | null;
  generations_30d?: Generations;
  suspended_at?: string | null;
};

/** MOB-1462: GET /users/summary (backend UserSegments). Filters do not change it. */
export type Platform = "app_store" | "play_store" | "web" | "other";
export type UsersSummary = {
  total: number;
  paying: { count: number; pct: number };
  free: { count: number; pct: number };
  gifts_active: number;
  gifts_by_tier?: { premium: number; unlimited: number };
  suspended: number;
  conversions_90d: { total: number; premium: number; unlimited: number };
  segments: { platform: { key: Platform; count: number }[]; country: { code: string | null; count: number }[] };
  links?: { label: string; url: string }[];
};
export type UserList = {
  users: UserRow[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
  narrowed: boolean;
  plan_counts: Record<Plan, number>;
};

export type HistoryRow = {
  kind: "gift" | "store" | "profile";
  id: number | null;
  source: string | null;
  plan: Plan;
  from: string | null;
  to: string | null;
  state: string | null;
  active: boolean;
  renews: boolean;
  given_by: string | null;
  given_at: string | null;
  taken_by: string | null;
  taken_at: string | null;
  reason: string | null;
  close_reason: string | null;
};

export type UserPage = {
  user: {
    id: number;
    name: string | null;
    email: string;
    lang: string | null;
    created_at: string | null;
    has_avatar: boolean;
    avatar_url: string | null;
    onboarding_completed_at: string | null;
    terms_accepted_at: string | null;
    terms_version: string | null;
    privacy_accepted_at: string | null;
    privacy_version: string | null;
    marketing_accepted: boolean;
    staff: boolean;
    // MOB-1462
    last_access_at?: string | null;
    generations_30d?: Generations;
    suspended_at?: string | null;
  };
  /** MOB-1462: who suspended the account and why; null when it is not suspended. */
  suspension?: { at: string | null; by: string | null; reason: string | null } | null;
  plan: {
    plan: Plan;
    until: string | null;
    source: string;
    gift: { plan: Plan; until: string | null; by: string | null; at: string | null } | null;
    store: { name: string; plan: Plan; auto_renew: boolean; date: string | null } | null;
    revocable: boolean;
  };
  history: HistoryRow[];
  words: {
    paying_title: string | null;
    paying: string | null;
    replaces: string | null;
    lower: Partial<Record<"premium" | "unlimited", string | null>>;
    revoke: string | null;
  };
  /** Only for the super admin: the console role of this account. */
  access?: { role_id: number; role_name: string } | null;
  /** After a revoke: «Ora l'utente è …». */
  message?: string;
};

/** «2026-12-31» → «31/12/2026» (the backend sends Y-m-d in Rome time). */
export function dmy(day: string | null | undefined): string {
  if (!day) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : day;
}

/** «31/12/2026» → «2026-12-31», or null when it is not a real day. */
export function parseDmy(text: string): string | null {
  const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(text);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const at = new Date(Date.UTC(y, mo - 1, d));
  if (at.getUTCFullYear() !== y || at.getUTCMonth() !== mo - 1 || at.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Today in Rome (the backend's «after:today» is Europe/Rome time), as Y-m-d. */
export function todayYmd(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** A quick date: today in Rome plus n months, as dd/mm/yyyy; 31/08 + 6 months is 28/02 (or 29/02), never 03/03. */
export function monthsAhead(n: number, now = new Date()): string {
  const [y, m, d] = todayYmd(now).split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${String(day).padStart(2, "0")}/${String(target.getUTCMonth() + 1).padStart(2, "0")}/${target.getUTCFullYear()}`;
}

/** Italian thousands with a dot, whatever ICU the runtime has (as the shell's Pager). */
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function countLine(total: number, narrowed: boolean): string {
  if (narrowed) {
    if (total === 0) return "Nessun utente corrisponde ai filtri";
    return total === 1 ? "1 utente corrisponde ai filtri" : `${fmt(total)} utenti corrispondono ai filtri`;
  }
  return total === 1 ? "1 utente in tutto" : `${fmt(total)} utenti in tutto`;
}

export const LANG_SHORT: Record<string, string> = { it: "IT", en: "EN" };
export const LANG_LONG: Record<string, string> = { it: "Italiano", en: "English" };

export const SORTS: { key: "recent" | "name"; label: string }[] = [
  { key: "recent", label: "Iscritti di recente" },
  { key: "name", label: "Nome A–Z" },
];

/** The CSV file name, as UserCsvExport::fileName. */
export function csvName(plans: Plan[], now = new Date()): string {
  const part = plans.length === 0 ? "tutti" : PLANS.filter((p) => plans.includes(p)).map((p) => (p === "trial" ? "in-prova" : p)).join("-");
  return `utenti-${part}-${todayYmd(now)}.csv`;
}

/** «Premium o Unlimited» for the CSV dialog. */
export function plansInWords(plans: Plan[]): string {
  const labels = PLANS.filter((p) => plans.includes(p)).map((p) => PLAN_LABEL[p]);
  return labels.length <= 1 ? (labels[0] ?? "") : `${labels.slice(0, -1).join(", ")} o ${labels[labels.length - 1]}`;
}

/** «12,5%» with the Italian comma; whole numbers keep no decimals (MOB-1462). */
export function pct(n: number): string {
  return `${Number.isInteger(n) ? n : n.toFixed(1).replace(".", ",")}%`;
}

/** «Oggi, 09:12», «Ieri, 22:05», else «16/11/2026», in Rome time; «—» when there is none (MOB-1462: kept since 16/11). */
const ROME_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" });
const ROME_TIME = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false });

export function lastAccess(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "—";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "—";
  const day = ROME_DAY.format(at);
  const today = ROME_DAY.format(now);
  // Yesterday from Rome's calendar, not now − 24 h (wrong on the night clocks change).
  const [y, m, d] = today.split("-").map(Number);
  const yesterday = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
  const time = ROME_TIME.format(at);
  if (day === today) return `Oggi, ${time}`;
  if (day === yesterday) return `Ieri, ${time}`;
  return dmy(day);
}

export const PLATFORM_LABEL: Record<Platform, string> = { app_store: "App Store", play_store: "Google Play", web: "Web", other: "Altro" };

/** «IT» → «Italia»; null → «Non noto» (the store did not say). */
export function countryName(code: string | null): string {
  if (!code) return "Non noto";
  try {
    const name = new Intl.DisplayNames(["it"], { type: "region" }).of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
  } catch {
    return code;
  }
}

/** «Snapshot 4 · Report 1 · Portale 0» (design gen_tip). */
export function generationsLine(g: Generations): string {
  return `Snapshot ${g.snapshot} · Report ${g.report} · Portale ${g.portal}`;
}
