/**
 * Strumenti del ticker di mercato e loro quotazioni reali.
 *
 * I valori arrivano dal DB dell'app tramite l'API pubblica del backend Finzy,
 * la stessa che usa l'app. Nel sito non c'è nessun prezzo scritto a mano.
 */

export type TickerInstrument = {
  /** Simbolo nel catalogo dell'app, ad esempio "NVDA" o "MC.PA". */
  symbol: string;
  /** Nome mostrato nel ticker. Se manca si usa quello del catalogo. */
  name?: string;
};

export type TickerQuote = {
  symbol: string;
  name: string;
  /** Simbolo della valuta come lo espone l'app, che normalizza i prezzi in USD. */
  currency: string;
  price: number;
  /** Variazione % giornaliera. */
  change: number;
};

/**
 * Set di partenza di MOB-406, usato quando TICKER_INSTRUMENTS non è impostata.
 * La variabile d'ambiente sostituisce la lista senza toccare il codice. Il
 * formato è nel README.
 */
const DEFAULT_INSTRUMENTS: TickerInstrument[] = [
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "SPCX", name: "SpaceX" },
  { symbol: "AVGO", name: "Broadcom" },
  { symbol: "META", name: "Meta" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "LLY", name: "Eli Lilly" },
  { symbol: "WMT", name: "Walmart" },
  { symbol: "JPM", name: "JPMorgan Chase" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "XOM", name: "Exxon Mobil" },
  { symbol: "V", name: "Visa" },
  { symbol: "TSM", name: "TSMC" },
  { symbol: "ASML", name: "ASML" },
  { symbol: "SAP", name: "SAP" },
  { symbol: "NVO", name: "Novo Nordisk" },
  { symbol: "MC.PA", name: "LVMH" },
];

const API_URL = "https://console.finzyapp.com/api/aziones";

/** Ogni quanti secondi il sito rilegge le quotazioni. */
const REVALIDATE_SECONDS = 300;

/**
 * Oltre questa età una quotazione non è più "di oggi" e lo strumento esce dal
 * ticker, invece di mostrare un prezzo fermo. Quattro giorni tollerano qualche
 * sync notturno saltato, non un feed morto.
 */
const MAX_QUOTE_AGE_MS = 4 * 24 * 60 * 60 * 1000;

/** Campi di /api/aziones che servono al ticker. */
type ApiAzione = {
  id: number;
  symbol: string;
  name: string | null;
  value: number | null;
  percent_change: number | null;
  valuta: string | null;
  quoted_at: string | null;
  updated_at: string | null;
};

type QuotedAzione = ApiAzione & { value: number; percent_change: number };

/** Formato "SIMBOLO:Nome,SIMBOLO:Nome". Il nome è facoltativo. */
function parseInstruments(raw: string | undefined): TickerInstrument[] {
  const instruments = (raw ?? "")
    .split(",")
    .map((entry) => {
      const [symbol, ...name] = entry.split(":");
      return {
        symbol: symbol.trim().toUpperCase(),
        name: name.join(":").trim() || undefined,
      };
    })
    .filter((instrument) => instrument.symbol !== "");

  return instruments.length > 0 ? instruments : DEFAULT_INSTRUMENTS;
}

/** Vero se la riga ha un prezzo, una variazione e una quotazione recente. */
function isQuoted(row: ApiAzione, now: number): row is QuotedAzione {
  // Come nel backend, updated_at vale finché il primo sync non scrive quoted_at.
  const quotedAt = Date.parse(row.quoted_at ?? row.updated_at ?? "");
  return (
    typeof row.value === "number" &&
    row.value > 0 &&
    typeof row.percent_change === "number" &&
    now - quotedAt <= MAX_QUOTE_AGE_MS
  );
}

/**
 * Quotazioni degli strumenti configurati, nell'ordine della configurazione.
 *
 * Non lancia mai. Se l'API non risponde torna una lista vuota e il ticker
 * sparisce fino alla rigenerazione successiva. Meglio nessun ticker che un
 * build bloccato o dei numeri inventati.
 */
export async function getTickerQuotes(): Promise<TickerQuote[]> {
  const instruments = parseInstruments(process.env.TICKER_INSTRUMENTS);

  try {
    const params = new URLSearchParams({
      azioni: instruments.map((instrument) => instrument.symbol).join(","),
    });
    const res = await fetch(`${API_URL}?${params}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body: { data?: unknown } = await res.json();
    const rows = Array.isArray(body.data) ? (body.data as ApiAzione[]) : [];

    // Una riga per simbolo, la più vecchia. È la regola dei movers nel backend.
    const now = Date.now();
    const bySymbol = new Map<string, QuotedAzione>();
    for (const row of rows) {
      if (!isQuoted(row, now)) continue;
      const current = bySymbol.get(row.symbol);
      if (!current || row.id < current.id) bySymbol.set(row.symbol, row);
    }

    return instruments.flatMap((instrument) => {
      const row = bySymbol.get(instrument.symbol);
      if (!row) return [];
      return [
        {
          symbol: instrument.symbol,
          name: instrument.name ?? row.name ?? instrument.symbol,
          currency: row.valuta ?? "",
          price: row.value,
          change: row.percent_change,
        },
      ];
    });
  } catch (error) {
    console.error("[ticker] quotazioni non disponibili:", error);
    return [];
  }
}
