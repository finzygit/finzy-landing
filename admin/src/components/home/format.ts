// MOB-1373: the Home's numbers in Italian, on Rome time, whatever ICU or
// zone the browser has (the shell's Pager does the same for thousands).

const ZONE = "Europe/Rome";
const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

const group3 = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** 1046 → «1.046». */
export function count(n: number): string {
  const sign = n < 0 ? "-" : "";
  return sign + group3(String(Math.trunc(Math.abs(n))));
}

/** 1234.5 → «$1.234,50». */
export function usd(n: number): string {
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const sign = n < 0 && `${int}${dec}` !== "000" ? "-" : ""; // the sign after rounding: never «-$0,00»
  return `${sign}$${group3(int)},${dec}`;
}

type Parts = { y: number; m: number; d: number; hh: string; mm: string };

const FMT = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** The Rome wall clock of an instant. */
export function rome(iso: string | Date): Parts {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const p = Object.fromEntries(FMT.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), hh: p.hour, mm: p.minute };
}

/** «22:30». */
export function clock(iso: string | Date): string {
  const p = rome(iso);
  return `${p.hh}:${p.mm}`;
}

const sameDay = (a: Parts, b: Parts) => a.y === b.y && a.m === b.m && a.d === b.d;
const pad = (n: number) => String(n).padStart(2, "0");

/** «oggi alle 22:18» for today (Rome), else «13/11/2026, 22:18» (#239). */
export function when(iso: string, now: string | Date): string {
  const p = rome(iso);
  if (sameDay(p, rome(now))) return `oggi alle ${p.hh}:${p.mm}`;
  return `${pad(p.d)}/${pad(p.m)}/${p.y}, ${p.hh}:${p.mm}`;
}

/** A date-only string (YYYY-MM-DD) as its parts. */
function day(ymd: string): Parts {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d, hh: "00", mm: "00" };
}

/** The days a tile covers: «7–13 nov», «26 ott–1 nov», «1 nov» (the first of the month). */
export function span(fromYmd: string, toIso: string): string {
  const a = day(fromYmd);
  const b = rome(toIso);
  if (sameDay(a, b)) return `${b.d} ${MONTHS[b.m - 1]}`;
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTHS[b.m - 1]}`;
  return `${a.d} ${MONTHS[a.m - 1]}–${b.d} ${MONTHS[b.m - 1]}`;
}

const PROVIDER: Record<string, string> = { gemini: "Gemini", openai: "OpenAI", anthropic: "Anthropic" };

/** The provider as people write it. */
export function provider(key: string): string {
  return PROVIDER[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/** «3 ore», «1 ora». */
export function hours(h: number): string {
  return h === 1 ? "1 ora" : `${count(h)} ore`;
}
