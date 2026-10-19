/**
 * Ultime notizie pubblicate nell'app, per le card del hero.
 *
 * Arrivano dall'API pubblica del backend Finzy, la stessa che usa l'app. Nel
 * sito non c'è nessun titolo scritto a mano.
 */

export type NewsItem = {
  id: number;
  /** Il backend traduce i titoli solo in italiano e in inglese. */
  title: { it: string; en: string };
  /** Data di pubblicazione nell'app, in ISO 8601. */
  publishedAt: string;
  /** Testata da citare accanto alla notizia, ad esempio "MTNewswires". */
  source: string;
};

const API_URL = "https://console.finzyapp.com/api/blogs";

/** Quante notizie ruotano nel hero, divise tra le card. */
const NEWS_COUNT = 6;

/**
 * Quante notizie chiedere all'API per riempire le card dopo il filtro. Nei
 * giorni di borsa circa una notizia su sette è un dispaccio di routine, nelle
 * ore più fitte fino a due su tre: su 30 ne restano comunque più di 6. L'API ne
 * dà al massimo 100. La cache di Next non salva risposte oltre 2 MB, contati in
 * base64: 30 righe arrivano a circa 1 MB, cioè 1,3 MB in cache. Oltre le 40
 * righe la cache rischia di saltare.
 */
const POOL_SIZE = 30;

/** Ogni quanti secondi il sito rilegge le notizie. */
const REVALIDATE_SECONDS = 300;

/** Campi di /api/blogs che servono alle card. */
type ApiBlog = {
  id: number;
  title: { it?: string | null; en?: string | null } | null;
  created_at: string | null;
  testata: { name: string | null } | null;
};

/**
 * Formati fissi delle agenzie (quasi tutti MT Newswires): classifiche, note di
 * apertura e chiusura, riepiloghi di dati. Nell'app servono, in vetrina no.
 *
 * Ogni voce è ancorata all'inizio del titolo inglese già normalizzato (vedi
 * `normalizeTitle`), così una notizia vera che contiene le stesse parole a metà
 * titolo resta. Per aggiungere un formato: una riga qui e un caso in
 * news.test.ts.
 */
const ROUTINE_WIRE_PATTERNS: RegExp[] = [
  // "Sector Update: Tech Stocks Fall Late Afternoon", "NZX Midday Sector Update: ..."
  // Con una borsa davanti serve i due punti: "Analysts Expect Sector Update" resta.
  /^(?:sector update\b|(?:[a-z0-9]+ ){1,5}sector update:)/,
  // "Top Premarket Decliners", "Top Midday Stories: ...", "Top After-Hours Gainers"
  /^top (?:pre ?market|pre bell|mid ?day|after ?hours|after the bell) (?:gainers|decliners|losers|movers|stories)\b/,
  // "Daily Roundup of Key US Economic Data for Oct. 16"
  /^daily roundup\b/,
  // "Asian Equities Traded in the US as American Depositary Receipts Edge Higher ..."
  /^(?:[a-z]+ ){0,2}equities traded in the us as american depositary receipts\b/,
  // "Exchange-Traded Funds, Equity Futures Mixed Pre-Bell Friday ...",
  // "Exchange-Traded Funds Rise as US Equities Advance After Midday"
  /^exchange ?traded funds\b.*\b(?:pre ?bell|pre ?market|midday|after ?hours)\b/,
  // "Top Cryptocurrencies Drop; Bitcoin Falls Below $82,000"
  /^top cryptocurrencies\b/,
  // "US Equity Markets End Higher ...", "US Equity Futures Mixed Pre-Bell ...",
  // "Update: US Equity Indexes Fall After Core Inflation Rate Rises"
  /^us equity (?:markets|indexes|indices|futures)\b/,
  // "US Dollar Falls Early Friday Ahead of Import Prices, ..."
  /^us dollar (?:[a-z]+ ){1,3}early (?:mon|tues|wednes|thurs|fri)day\b/,
  // "US Treasury Late-Day Levels", "US Treasury Closing Levels"
  /^us treasury (?:late ?day|closing) levels\b/,
];

/**
 * Minuscole, "U.S." come "us", trattini e punteggiatura come spazi, senza le
 * etichette "Update:" e "Correction:" davanti. Così "Update: Top Pre-Market
 * Decliners" e "top premarket decliners" finiscono sullo stesso formato.
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9:]+/g, " ")
    .replace(/^(?:\s*(?:update|correction)\s*\d*\s*:)+/, "")
    .trim();
}

/** Vero se il titolo inglese è uno dei formati di routine delle agenzie. */
export function isRoutineWire(title: string): boolean {
  const normalized = normalizeTitle(title);
  return ROUTINE_WIRE_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Le prime `count` notizie da mostrare, nell'ordine dell'API (dalla più nuova).
 *
 * Il filtro guarda il titolo inglese, o quello italiano se manca, e decide una
 * volta per notizia: le card italiane e inglesi mostrano le stesse notizie.
 * Con meno notizie valide di `count` torna solo quelle, anche nessuna.
 */
export function selectShowcaseNews(rows: unknown, count: number): NewsItem[] {
  if (!Array.isArray(rows)) return [];

  return (rows as ApiBlog[])
    .flatMap((row) => {
      const it = row.title?.it?.trim() || row.title?.en?.trim();
      const en = row.title?.en?.trim() || it;
      if (!it || !en || !row.created_at) return [];
      if (isRoutineWire(en)) return [];
      return [
        {
          id: row.id,
          title: { it, en },
          publishedAt: row.created_at,
          source: row.testata?.name ?? "",
        },
      ];
    })
    .slice(0, count);
}

/**
 * Le notizie più recenti da mostrare, dalla più nuova.
 *
 * Senza `latest=true`: quel filtro tiene solo le ultime 24 ore e resta vuoto
 * dopo un weekend. La lista base è già ordinata per data e copre 30 giorni.
 *
 * Non lancia mai. Se l'API non risponde torna una lista vuota e le card
 * spariscono fino alla rigenerazione successiva. Lo stesso se tutte le notizie
 * recenti sono dispacci di routine: meglio nessuna card che una classifica.
 */
export async function getLatestNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(`${API_URL}?limit=${POOL_SIZE}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body: { data?: unknown } = await res.json();
    return selectShowcaseNews(body.data, NEWS_COUNT);
  } catch (error) {
    console.error("[news] notizie non disponibili:", error);
    return [];
  }
}
