// MOB-1375: numbers and dates as the boards write them, whatever ICU the
// runtime has: «$820,64», «€ 9,99», «−$57,88», «28/11 09:00» in Rome time.

const TZ = "Europe/Rome";

const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

/** «1234.5» → «1.234,50». */
export function decimal(n: number, digits = 2): string {
  const [int, frac] = Math.abs(n).toFixed(digits).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return frac ? `${grouped},${frac}` : grouped;
}

const SYMBOL: Record<string, string> = { USD: "$", EUR: "€ ", GBP: "£ " };

/** USD amounts of the report: «$820,64», «−$57,88». Others: «€ 9,99». */
export function money(n: number, currency = "USD"): string {
  const sym = SYMBOL[currency] ?? `${currency} `;
  return `${n < 0 ? "−" : ""}${sym}${decimal(n)}`;
}

/** «+12,36%» / «−3,10%». */
export function percent(n: number): string {
  return `${n < 0 ? "−" : "+"}${decimal(n * 100)}%`;
}

export function monthName(ym: string): string {
  return MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym;
}

export function monthShort(ym: string): string {
  return SHORT[Number(ym.slice(5, 7)) - 1] ?? ym;
}

/** «2026-11» → «Novembre 2026». */
export function monthTitle(ym: string): string {
  const m = monthName(ym);
  return `${m.slice(0, 1).toUpperCase()}${m.slice(1)} ${ym.slice(0, 4)}`;
}

export function shiftMonth(ym: string, by: number): string {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7)) - 1 + by;
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Every month from first to last, newest first. */
export function monthsBetween(first: string, last: string): string[] {
  const out: string[] = [];
  for (let m = last; m >= first && out.length < 240; m = shiftMonth(m, -1)) out.push(m);
  return out;
}

type Parts = { y: string; mo: string; d: string; h: string; mi: string };

/** The wall clock in Rome of an ISO instant. */
export function romeParts(iso: string): Parts {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(iso))) p[x.type] = x.value;
  return { y: p.year, mo: p.month, d: p.day, h: p.hour, mi: p.minute };
}

/** «28/11 09:00». */
export function dayTime(iso: string): string {
  const p = romeParts(iso);
  return `${p.d}/${p.mo} ${p.h}:${p.mi}`;
}

/** «28/11». */
export function dayMonth(iso: string): string {
  const p = romeParts(iso);
  return `${p.d}/${p.mo}`;
}

/** «28/11/2026». */
export function fullDay(iso: string): string {
  const p = romeParts(iso);
  return `${p.d}/${p.mo}/${p.y}`;
}

/** «02/01/2027 · 00:00». */
export function fullDayTime(iso: string): string {
  const p = romeParts(iso);
  return `${p.d}/${p.mo}/${p.y} · ${p.h}:${p.mi}`;
}

/** «09:40». */
export function time(iso: string): string {
  const p = romeParts(iso);
  return `${p.h}:${p.mi}`;
}

/** ISO instant → the value of an <input type="datetime-local"> in Rome time («2026-12-14T00:00»). */
export function toLocalInput(iso: string): string {
  const p = romeParts(iso);
  return `${p.y}-${p.mo}-${p.d}T${p.h}:${p.mi}`;
}

/** «5,99» or «5.99» → «5.99»; anything else stays as typed, the server says what is wrong. */
export function priceForServer(s: string): string {
  return s.trim().replace(",", ".");
}

/** «5.99» → «5,99». */
export function priceForField(s: string | undefined): string {
  return (s ?? "").replace(".", ",");
}

/** A typed monthly price as a number, or null. */
export function priceValue(s: string): number | null {
  const v = priceForServer(s);
  return /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0 ? Number(v) : null;
}

/** Monthly × months in cents, as the backend does (Promotion::total). */
export function totalOf(monthly: number, months: number): number {
  return (Math.round(monthly * 100) * months) / 100;
}

/** Whole days from now to an ISO instant, at least 1 when it is still ahead. */
export function daysUntil(iso: string, now: number = Date.now()): number {
  return Math.max(1, Math.ceil((new Date(iso).getTime() - now) / 86_400_000));
}
