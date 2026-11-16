// MOB-1461 (D444): the words of «Spesa AI» and «Salute dei servizi» that
// Carlo's dashboard asked for (design/v2/ADMIN-ADDITIONS-A.md on
// finzygit/finzy#750). «costi» texts are MOB-1379's (#711); the others are new
// and wait for Victor's OK (D385).

export const T = {
  spendTitle: "Spesa AI",
  healthTitle: "Salute dei servizi",
  sub: "Giorni e mesi sull’ora di Roma. I costi AI sono stime in dollari dai listini dei fornitori: fanno fede le fatture.",
  subHealth: "Orari sull’ora di Roma. I controlli si rifanno a ogni apertura della pagina e con «Aggiorna».",
  updated: (t: string) => `Aggiornato alle ${t}`,
  refresh: "Aggiorna",
  refreshFailed: (t: string) => `Aggiornamento non riuscito. I numeri sono quelli delle ${t}.`,
  retry: "Riprova",
  error: "Dato non disponibile.",
  pageError: "Non è stato possibile caricare i costi AI",
  pageErrorHealth: "Non è stato possibile caricare la salute dei servizi",
  pageErrorBody: "Il server non ha risposto. Riprova tra poco.",

  summary: "Riepilogo",
  summarySub: "Sempre oggi, gli ultimi 7 e gli ultimi 30 giorni.",
  today: "Oggi",
  d7: "Ultimi 7 giorni",
  d30: "Ultimi 30 giorni",
  todayUntil: (d: string, t: string) => `${d}, fino alle ${t}`,
  avg: "Costo medio",
  avgSub: (v: string, n: string) => `Ultimi 30 giorni, solo le quattro voci: ${v} su ${n} generazioni`,
  avgNone: "nessuna generazione in 30 giorni",

  byType: "Costo al giorno per tipo",
  byTypeSub: "Ultimi 30 giorni. Le quattro voci della Home più gli altri servizi.",
  empty30: "Nessuna spesa negli ultimi 30 giorni",
  todayDashed: "Il riquadro tratteggiato è oggi, ancora in corso.",

  gens: "Generazioni per tipo",
  gensSub: (since: string | null) =>
    "Una generazione è un’immagine creata, un articolo riassunto, un titolo con il suo Stock Snapshot o un financial report." +
    (since ? ` «Da sempre»: dal primo giorno registrato (${since}).` : ""),
  hType: "Tipo",
  hToday: "Oggi",
  hD7: "7 giorni",
  hD30: "30 giorni",
  hAll: "Da sempre",
  hSpend30: "Spesa 30 giorni",
  hAvg: "Costo medio",
  total: "Totale",

  sources: "Fonti dati",
  sourcesSub: (since: string | null) =>
    "Le richieste che il server ha fatto oggi a ogni fornitore, dalle 00:00 ora di Roma." + (since ? ` Conteggio attivo dal giorno ${since}.` : " Il conteggio parte con la prima richiesta."),
  callsToday: "chiamate oggi",
  failedN: (n: string) => `${n} fallite`,
  failedNone: "Nessuna fallita",
  lastCall: (t: string) => `Ultima alle ${t}`,
  noCall: "Nessuna chiamata oggi",
  warnFail: "Oltre il 5 % delle chiamate di oggi è fallito",
  warnCheck: "L’ultimo giro riuscito è troppo vecchio: vedi Servizi",
  ok: "Regolare",
  warn: "Da guardare",
} as const;

export const TYPES = [
  { key: "images", label: "Immagini", unit: "immagini create", dot: "#6FB6FF" },
  { key: "articles", label: "Articoli", unit: "articoli riassunti", dot: "#C9A7FF" },
  { key: "stock_snapshot", label: "Stock Snapshot", unit: "titoli con Stock Snapshot", dot: "#F2A7C8" },
  { key: "financial_report", label: "Financial report", unit: "report completati", dot: "#8E9BFF" },
] as const;

export const OTHER = { key: "other", label: "Altri servizi", dot: "rgba(236, 244, 241, 0.4)" } as const;

export const SOURCES: Record<string, { name: string; desc: string; icon: string }> = {
  twelve_data: { name: "Twelve Data", desc: "Prezzi, grafici e dati dei titoli", icon: "candles" },
  mt_newswires: { name: "MT Newswires", desc: "Notizie in inglese, un giro ogni ora", icon: "news" },
  benzinga: { name: "Benzinga", desc: "Giudizi degli analisti e motivi dei movimenti", icon: "pulse" },
  adnkronos: { name: "Adnkronos", desc: "Notizie in italiano, un giro ogni 2 ore dalle 6 alle 22", icon: "news" },
};
