// MOB-1378: the «Report AI» group of the console (boards ADM-REPORTS-*, kit
// Kit-ADM-REPORTS, texts design/v2/ADMIN-AI-REPORTS.md). API shapes, Italian
// words and formatters shared by the three pages. Everything here only reads:
// no page retries or regenerates a report or a portfolio (each is a paid AI call).

// ---------------------------------------------------------------- API shapes

export type ReportStatusKey = "completed" | "failed" | "pending" | "archived";
export type ReportTypeKey = "deck" | "10k" | "cum" | "fut" | "debt";
export type ReportReason = "no_usable_10k" | "no_10k" | "credit" | "generic";

export type ReportRow = {
  id: number;
  symbol: string;
  name: string | null;
  type: ReportTypeKey;
  status: ReportStatusKey;
  fiscal_year: number | null;
  filing_date: string | null;
  generated_at: string | null;
  tried_at: string | null;
  reason: ReportReason | null;
};
export type ReportCounts = { all: number; completed: number; failed: number; archived: number; pending?: number };
export type ReportPage = { rows: ReportRow[]; total: number; page: number; per_page: number; counts: ReportCounts };

export type ReportDetail = ReportRow & {
  azione_id: number | null;
  title: string;
  filing: { accession: string | null; date: string | null } | null;
  provider: string | null;
  model: string | null;
  has_pdf: boolean;
  preview: { kind: "html" | "pdf" | "none"; languages: ("it" | "en")[]; html: Partial<Record<"it" | "en", string>> | null };
  failure: { reason: ReportReason; technical: string | null; app_keeps: { id: number; filing_date: string | null; generated_at: string | null } | null } | null;
};

export type CoverageGroup = "complete" | "incomplete" | "no_filing";
export type RegionCoverage = { size: number; complete: number; incomplete: number; no_filing: number; snapshot_date: string | null };
export type Coverage = { regions: Record<string, RegionCoverage>; target: Record<string, number>; computed_at: string | null };

export type UniverseRow = {
  rank: number | null;
  symbol: string;
  name: string | null;
  exchange: string | null;
  market_cap: number | null;
  region: string;
  group: CoverageGroup;
  filing_type: string | null;
  filing_period: string | null;
  report_status: "generated" | "missing" | "failed" | null;
  reason: "us_not_synced" | "eu_not_linked" | null;
  scope: "in_scope" | "out_of_scope";
  azione_id: number;
  report_id: number | null;
};
export type UniversePage = { rows: UniverseRow[]; total: number; page: number; per_page: number };

export type PortfolioReason = { code: "weight_sum"; category: string; sum: number; expected: number } | { code: "generic" };
export type GenerationRow = {
  id: number;
  portfolio: string;
  name: string;
  status: "published" | "failed" | "running" | "pending";
  reason: PortfolioReason | null;
  prompt_version: number;
  list: { list: string | null; risk_date: string | null };
  started_at: string | null;
  published_at: string | null;
};
export type PortfolioCardData = {
  key: string;
  name: string;
  risk_profile: string;
  enabled: boolean;
  latest: { id: number; status: GenerationRow["status"]; started_at: string | null; published_at: string | null } | null;
  published: { id: number; published_at: string | null; prompt_version: number; categories: Record<string, number>; instruments: number } | null;
};
export type BuilderPage = {
  portfolios: PortfolioCardData[];
  next_run: string;
  history: { rows: GenerationRow[]; total: number; page: number; per_page: number };
};
export type Allocation = { category: string; weight: number; rationale: string };
export type Instrument = { category: string; symbol: string; name: string; risk: "low" | "medium" | "high" | null; weight: number; rationale: string };
export type Generation = GenerationRow & {
  risk_profile: string;
  in_app: boolean;
  categories: Allocation[];
  instruments: Instrument[];
  failure: {
    reason: PortfolioReason;
    technical: string | null;
    first: boolean;
    app_had: { id: number; published_at: string | null } | null;
    next_published: { id: number; published_at: string | null } | null;
  } | null;
};

export type ConsentRow = { id: number; user_id: number | null; email: string | null; version: number; os: string | null; accepted_at: string };
export type ConsentPage = { rows: ConsentRow[]; total: number; page: number; per_page: number; with_email: number; versions: number[] };

// ---------------------------------------------------------------- words (IT)

export const T = {
  grp: "Report AI",
  rep_title: "Report e copertura",
  rep_sub: "I report che l’AI ha scritto sui titoli e quanta parte dell’universo coprono. Solo lettura.",
  cov_title: "Copertura dell’universo",
  cov_note: "I primi 100 titoli per capitalizzazione di ogni regione. Un titolo è coperto quando ha il documento ufficiale e la presentazione di bilancio fatta su quel documento.",
  cov_complete: "Coperti",
  cov_incomplete: "Report mancante",
  cov_nofiling: "Senza documento",
  cov_eu_note: "I documenti delle società europee non sono ancora collegati: per ora l’Europa non ha report.",
  cov_empty_t: "L’universo non è ancora stato calcolato",
  cov_empty_b: "Si calcola ogni notte alle 05:45 (ora di Roma): domattina qui trovi la copertura.",
  cov_error: "Copertura non disponibile.",
  tab_reports: "Report",
  tab_universe: "Universo",
  f_type: "Tipo",
  f_search: "Cerca per ticker",
  f_region: "Regione",
  f_cov: "Copertura",
  f_scope: "Ambito",
  spend_link: "Quanto costano: Costi e servizi",
  list_error: "Non è stato possibile caricare i report",
  rep_empty_t: "Ancora nessun report",
  rep_empty_b: "I report arrivano dal giro di ogni notte: le presentazioni alle 06:00, le analisi del 10-K alle 04:30.",
  uni_error: "Non è stato possibile caricare l’universo",
  pv_title: "Anteprima",
  pv_isolated: "Isolata dal pannello: nessuno script del documento viene eseguito",
  pv_dl: "Scarica PDF",
  pv_dl_error: "Download non riuscito.",
  pv_unavail_t: "Nessuna anteprima per questo report",
  pv_unavail_b: "Il report non ha né il testo né il PDF.",
  pv_error: "Anteprima non caricata.",
  fail_title: "Il report non è stato generato",
  fail_paid: "Rigenerarla è una chiamata AI a pagamento: dal pannello non si fa.",
  fail_next_none: "Nell’app questo titolo resta senza analisi del 10-K.",
  fail_next_none_deck: "Nell’app questo titolo resta senza presentazione.",
  tech: "Dettaglio tecnico",
  archived: "Archiviato: è un tipo di report che l’app non mostra più. Resta qui per consultazione.",
  nf_t: "Report non trovato",
  nf_b: "Forse è stato sostituito da uno più recente. Torna all’elenco.",
  back_list: "Torna ai report",
  d_open_stock: "Scheda del titolo",
  pb_title: "Portfolio Builder",
  pb_sub: "I portafogli che l’AI compone ogni mese. L’app mostra l’ultima generazione pubblicata di ciascuno. Solo lettura.",
  pb_hist: "Storico delle generazioni",
  pb_hist_note: "Ogni riga è un tentativo. Uno non riuscito non tocca l’app: resta la versione pubblicata prima.",
  pf_off: "Non attivo: nessuna generazione finché non viene acceso.",
  pf_empty_t: "Ancora nessuna generazione",
  pf_empty_b: "La prima arriva il 1° del mese alle 03:30.",
  pf_none: "Ancora nessuna generazione",
  g_nf_t: "Generazione non trovata",
  g_nf_b: "Torna al Portfolio Builder e scegli una riga dello storico.",
  g_back: "Torna al Portfolio Builder",
  pb_error: "Non è stato possibile caricare il Portfolio Builder",
  g_running: "La generazione è in corso: di solito finisce in meno di un minuto. Ricarica la pagina per vedere l’esito.",
  g_alloc: "Allocazione per classe",
  g_instr: "Strumenti",
  g_alloc_note: "Come il modello ha diviso il portafoglio, con il motivo che ha dato. È ciò che vede l’app.",
  g_fail_title: "La generazione non è riuscita",
  g_fail_kept: "L’app continua a mostrare la generazione pubblicata prima.",
  g_next_link: "Apri la generazione pubblicata",
  cs_title: "Consensi",
  cs_sub: "Chi ha accettato l’avviso del Portfolio Builder, con la versione e la data. Lo vede solo il super amministratore.",
  cs_search: "Cerca per email",
  cs_export: "Esporta CSV",
  cs_exp_t: "Esportare i consensi?",
  cs_exp_ok: "Esporta",
  cs_done_t: "File pronto",
  cs_exp_err: "Esportazione non riuscita. Riprova.",
  cs_empty_t: "Ancora nessun consenso",
  cs_empty_b: "Compare qui chi accetta l’avviso aprendo il Portfolio Builder nell’app.",
  cs_none_b: "Controlla l’email o togli i filtri.",
  cs_denied_t: "Il registro dei consensi lo vede solo il super amministratore",
  cs_denied_b: "Contiene le email degli utenti. Se ti serve per una richiesta, chiedi a un super amministratore.",
  cs_error: "Non è stato possibile caricare i consensi",
  deleted_user: "Account eliminato",
} as const;

export const TYPE_LABEL: Record<ReportTypeKey, string> = {
  deck: "Presentazione",
  "10k": "Analisi del 10-K",
  cum: "Bilanci cumulati",
  fut: "Futuro e sostenibilità",
  debt: "Qualità del debito",
};

/** A status is a dot and a word (Status of the shell): ok turquoise, warn amber, off grey. */
export const STATUS_WORD: Record<string, [string, "ok" | "warn" | "off"]> = {
  completed: ["Completato", "ok"],
  failed: ["Non riuscito", "warn"],
  archived: ["Archiviato", "off"],
  pending: ["In corso", "off"],
  generated: ["Completato", "ok"],
  missing: ["Manca", "warn"],
  published: ["Pubblicata", "ok"],
  gen_failed: ["Non riuscita", "warn"],
  running: ["In corso", "off"],
  off: ["Non attivo", "off"],
};

export const REPORT_REASON: Record<ReportReason, string> = {
  no_usable_10k: "Per questo titolo non c’è un 10-K utilizzabile.",
  no_10k: "La società non ha depositato un 10-K.",
  generic: "La generazione si è interrotta senza un motivo preciso.",
  credit: "Il fornitore AI ha rifiutato la richiesta: credito esaurito.",
};

export const UNIVERSE_REASON: Record<string, string> = {
  us_not_synced: "10-K non ancora scaricato dalla SEC",
  eu_not_linked: "Documenti europei non ancora collegati",
};

export const REGION_LABEL: Record<string, string> = { US: "Stati Uniti", EU: "Europa" };

/** The five Portfolio Builder classes: name, the article for «ha dato …», and the app's colour (19 Oct). */
export const CATEGORY: Record<string, { label: string; dative: string; colour: string }> = {
  stocks: { label: "Azioni", dative: "alle azioni", colour: "#378ADD" },
  equity_etfs: { label: "ETF azionari", dative: "agli ETF azionari", colour: "#CBB59A" },
  bonds: { label: "Obbligazioni", dative: "alle obbligazioni", colour: "#8E99AB" },
  commodities: { label: "Materie prime", dative: "alle materie prime", colour: "#F2C230" },
  forex: { label: "Forex", dative: "al forex", colour: "#21B36B" },
};
/** «1 strumento», «24 strumenti»; «1 classe», «4 classi». */
export const instrumentCount = (n: number) => `${n} ${n === 1 ? "strumento" : "strumenti"}`;
export const classCount = (n: number) => `${n} ${n === 1 ? "classe" : "classi"}`;
export const categoryOf = (k: string) => CATEGORY[k] ?? { label: k, dative: k, colour: "rgba(236,244,241,0.4)" };

export const RISK_WORD: Record<string, string> = { low: "Basso", medium: "Medio", high: "Alto" };

const PROVIDER: Record<string, string> = { anthropic: "Anthropic", openai: "OpenAI", google: "Google" };
export const providerLabel = (p: string | null) => (p ? (PROVIDER[p.toLowerCase()] ?? p) : null);

// ---------------------------------------------------------------- formatters

const TZ = "Europe/Rome";
const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const MONTHS_SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

function parts(iso: string): { d: string; m: string; y: string; h: string; min: string } {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { d: p.day, m: p.month, y: p.year, h: p.hour, min: p.minute };
}

/** «13/11/2026, 06:01» (Rome). */
export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const p = parts(iso);
  return `${p.d}/${p.m}/${p.y}, ${p.h}:${p.min}`;
}

/** «26/02/2026» from a plain YYYY-MM-DD (no time-zone shift) or an ISO time (Rome). */
export function date(s: string | null | undefined): string {
  if (!s) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const p = parts(s);
  return `${p.d}/${p.m}/${p.y}`;
}

/** «04:29» (Rome). */
export function time(iso: string | null | undefined): string {
  if (!iso) return "—";
  const p = parts(iso);
  return `${p.h}:${p.min}`;
}

/** «1° dicembre alle 03:30» (Rome). */
export function dayAt(iso: string): string {
  const p = parts(iso);
  const day = Number(p.d);
  return `${day === 1 ? "1°" : day} ${MONTHS[Number(p.m) - 1]} alle ${p.h}:${p.min}`;
}

/** Italian elision before a day: «dell’08/11», «dell’11/10», «del 25/10». */
export function delDay(dmy: string): string {
  const day = Number(dmy.slice(0, 2));
  return [1, 8, 11].includes(day) ? `dell’${dmy}` : `del ${dmy}`;
}

/** Italian number with thousands dot and decimal comma. */
export function num(n: number, decimals = 0): string {
  const [i, d] = Math.abs(n).toFixed(decimals).split(".");
  const s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d ? `,${d}` : "");
  return n < 0 ? `-${s}` : s;
}

/** «$4.410,2 Mld»: US caps in dollars, European ones in euro. */
export function marketCap(n: number | null, region: string): string {
  if (n === null || n === undefined) return "—";
  const cur = region === "EU" ? "€" : "$";
  if (n >= 1e9) return `${cur}${num(n / 1e9, 1)} Mld`;
  if (n >= 1e6) return `${cur}${num(n / 1e6, 1)} Mln`;
  return `${cur}${num(n)}`;
}

/** «40%», «4,5%». */
export function pct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${num(n, Number.isInteger(n) ? 0 : 1)}%`;
}

/** A report's period: «FY2026 · 10-K del 26/02/2026» (10-K) or «FY2025». */
export function period(r: Pick<ReportRow, "type" | "fiscal_year" | "filing_date">): string {
  if (!r.fiscal_year) return "—";
  return r.type === "10k" && r.filing_date ? `FY${r.fiscal_year} · 10-K del ${date(r.filing_date)}` : `FY${r.fiscal_year}`;
}

/** The instrument list of a generation: «set 2026 · rischio dell’08/11». */
export function listLabel(l: GenerationRow["list"], long = false): string {
  const m = /^(\d{4})-(\d{2})/.exec(l.list ?? "");
  const risk = l.risk_date ? delDay(date(l.risk_date).slice(0, 5)) : null;
  if (long) {
    const month = m ? MONTHS[Number(m[2]) - 1] : null;
    return [month ? `elenco strumenti di ${month}` : null, risk ? `rischio ${risk}` : null].filter(Boolean).join(", ");
  }
  return [m ? `${MONTHS_SHORT[Number(m[2]) - 1]} ${m[1]}` : l.list, risk ? `rischio ${risk}` : null].filter(Boolean).join(" · ");
}

/** History row: «Azioni al 55% invece di 50%». */
export function shortPortfolioReason(r: PortfolioReason | null): string | null {
  if (!r) return null;
  if (r.code === "weight_sum") return `${categoryOf(r.category).label} al ${pct(r.sum)} invece di ${pct(r.expected)}`;
  return REPORT_REASON.generic;
}

/** Generation page: the reason as one sentence. */
export function longPortfolioReason(r: PortfolioReason): string {
  if (r.code === "weight_sum") {
    return `Il modello ha dato ${categoryOf(r.category).dative} pesi che sommano ${pct(r.sum)} invece di ${pct(r.expected)}: il controllo prima della pubblicazione l’ha fermata.`;
  }
  return REPORT_REASON.generic;
}

/** «Calcolata oggi alle 05:45 · si ricalcola ogni notte». */
export function freshness(iso: string, now: Date = new Date()): string {
  const p = parts(iso);
  const today = parts(now.toISOString());
  const when = p.d === today.d && p.m === today.m && p.y === today.y ? "oggi" : `il ${p.d}/${p.m}`;
  return `Calcolata ${when} alle ${p.h}:${p.min} · si ricalcola ogni notte`;
}

/** What the app shows after a failed report. */
export function reportNext(d: ReportDetail): string {
  const keeps = d.failure?.app_keeps;
  if (keeps) {
    const on = keeps.filing_date ? `, sul 10-K del ${date(keeps.filing_date)}` : "";
    const what = d.type === "deck" ? "la presentazione precedente" : "l’analisi precedente";
    return `Nell’app resta ${what}${on}. ${T.fail_paid}`;
  }
  return d.type === "deck" ? T.fail_next_none_deck : T.fail_next_none;
}

/** What the app showed after a failed generation, and what came next. */
export function generationNext(g: Generation): string {
  const f = g.failure;
  if (!f) return "";
  const first = f.first ? `Era la prima generazione di ${g.name}: l’app non mostrava ancora questo portafoglio.` : T.g_fail_kept;
  const next = f.next_published?.published_at ? ` Il tentativo successivo, alle ${time(f.next_published.published_at)}, è stato pubblicato.` : "";
  return first + next;
}

export const languagesLabel = (langs: string[]) =>
  langs.includes("it") && langs.includes("en") ? "Italiano e inglese" : langs.includes("it") ? "Italiano" : langs.includes("en") ? "Inglese" : null;

/** The 10-K preview as a whole document for the sandboxed frame: its own CSP (nothing loads, nothing runs) and the panel's dark page. */
export function previewDocument(html: string, lang: "it" | "en"): string {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">`
    + `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">`
    + `<style>html{color-scheme:dark}body{margin:0;padding:30px 36px;background:#0b1314;color:#f4f7f6;font:15px/1.6 -apple-system,"SF Pro Text",Inter,system-ui,sans-serif}`
    + `h1,h2,h3,h4{line-height:1.25;margin:1.4em 0 .5em}h1{font-size:24px}h2{font-size:20px}h3{font-size:17px}p,li{color:rgba(236,244,241,.82)}`
    + `table{border-collapse:collapse;margin:12px 0 18px;width:100%}th,td{border:1px solid rgba(255,255,255,.14);padding:6px 10px;text-align:left;font-size:14px}`
    + `th{background:rgba(255,255,255,.08)}blockquote{margin:0;padding-left:14px;border-left:3px solid rgba(39,216,199,.5)}code,pre{font-family:ui-monospace,Menlo,monospace}</style>`
    + `</head><body>${html}</body></html>`;
}
