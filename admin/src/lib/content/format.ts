// MOB-1380: words and numbers of the «Contenuti app» pages (design/v2/ADMIN-CONTENT.md, TEXTS).

/** 371 → «6:11»; null → «». */
export function duration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "";
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/** Bytes in Italian: «412 MB», «1,2 GB», «840 KB». */
export function bytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = i >= 3 && v < 10 ? 1 : 0;
  return `${v.toFixed(digits).replace(".", ",")} ${units[i]}`;
}

/** Seconds left → «3 min», «40 s», «1 h 5 min». */
export function timeLeft(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  if (seconds < 60) return `${Math.ceil(seconds)} s`;
  const m = Math.ceil(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

// The backend sends ISO or «YYYY-MM-DD HH:MM:SS» in app time: read both the same way (as the shell does).
const parse = (at: string) => new Date(at.includes("T") ? at : at.replace(" ", "T"));

/** «12/11, 18:04» (the list column). */
export function shortWhen(at: string | null | undefined): string {
  if (!at) return "";
  const d = parse(at);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}, ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** «12 nov 2026, 18:04». */
export function longWhen(at: string | null | undefined): string {
  if (!at) return "";
  return parse(at).toLocaleString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** «3 ott 2026». */
export function day(at: string | null | undefined): string {
  if (!at) return "";
  return parse(at.length === 10 ? `${at}T12:00:00` : at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

/** «18:04». */
export function hour(at: string | null | undefined): string {
  if (!at) return "";
  return parse(at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

/** The app pages of config/tutorials.php, in the app's words (design APP_PAGES). */
export const PAGE_LABEL: Record<string, string> = {
  home: "Home",
  search: "Cerca",
  learn: "Impara",
  wallet: "Portafoglio",
  favorites: "Preferiti",
  tools: "Strumenti",
  market_heatmap: "Heatmap di mercato",
  market_comparison: "Confronto mercati",
  global_market_map: "Mappa dei mercati",
  financial_portal: "Portale finanziario",
  snapshot: "Stock Snapshot",
};

export const pageLabel = (key: string) => PAGE_LABEL[key] ?? key;

/** Fill «{n}»-style holes of a text. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
