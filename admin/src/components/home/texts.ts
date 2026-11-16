// MOB-1373: the Home's words (design/v2/ADMIN-HOME.md on finzygit/finzy#700).
// «#239» texts are the backend home's, reused as they are; the others are new
// and wait for Victor's OK (D385). The links name the shell's menu pages
// (admin/src/lib/nav.ts), so they say where they go.

export const T = {
  title: "Home",
  sub: "Giorni e mesi sull’ora di Roma. I costi AI sono stime in dollari dai listini dei fornitori: fanno fede le fatture.",
  subNoAi: "Giorni e mesi sull’ora di Roma.",
  updated: (t: string) => `Aggiornato alle ${t}`,
  refresh: "Aggiorna",
  refreshFailed: (t: string) => `Aggiornamento non riuscito. I numeri sono quelli delle ${t}.`,

  ai: "Spesa AI",
  users: "Utenti",
  news: "Notizie",
  goAi: "Apri Spesa AI",
  goHealth: "Apri Salute dei servizi",
  goUsers: "Apri Utenti",
  goNews: "Apri Notizie",

  aiFresh: "Ultima chiamata AI registrata:",
  aiNone: "Nessuna chiamata AI registrata",
  usersFresh: "Ultima registrazione:",
  usersNone: "Nessuna registrazione",
  newsFresh: "Ultimo articolo:",
  newsNone: "Nessun articolo",

  total: "Spesa AI totale",
  totalDesc: "Tutti i servizi AI dell’app. Le chiamate fallite che non hanno consumato nulla non contano.",
  w7: "Ultimi 7 giorni",
  mtd: "Mese in corso",
  today: "Oggi",
  d30: "Ultimi 30 giorni",
  lineHead: "Voce di costo",
  foot: "La spesa totale comprende anche servizi fuori da queste quattro voci, come il Portfolio Builder: la somma delle voci non fa il totale.",

  newUsers: "Nuovi utenti",
  usersDesc: "Senza gli account interni.",
  byPlan: "Utenti registrati per piano",
  registered: (n: string) => `${n} registrati`,
  started: "Abbonamenti iniziati nel mese",
  startedDesc: "Utenti con un abbonamento Premium o Unlimited comprato sugli store dal 1° del mese, anche se poi disdetto o rimborsato",

  mt: "Articoli MT Newswires",
  mtDesc: "Raccolti: solo gli articoli con testo; i movimenti di mercato non contano.",
  collected: "Raccolti",
  selected: "Selezionati per il feed",

  groupError: "Dato non disponibile.",
  retry: "Riprova",

  alCio: (n: string) => `${n} invii a Customer.io non riusciti negli ultimi 7 giorni.`,
  alMt: (h: string, t: string) => `Nessun nuovo articolo MT Newswires da ${h} (l’ultimo alle ${t}).`,
  // New (D385): the last article was not today, so the day is written too.
  alMtDay: (h: string, at: string) => `Nessun nuovo articolo MT Newswires da ${h} (l’ultimo il ${at}).`,
  alBudget: (p: string, s: string, b: string, pct: number) => `Spesa ${p} del mese: ${s} su un budget di ${b} (${pct}%).`,

  // MOB-1461 (D444, design finzygit/finzy#750): new, waiting for Victor's OK (D385).
  revenue: "Ricavi",
  goRevenue: "Apri Ricavi e promozioni",
  mrr: "MRR · ricavo ricorrente al mese",
  mrrDesc: "Gli abbonamenti attivi sugli store riportati a un mese: un annuale conta un dodicesimo. Lordo, prima delle commissioni degli store.",
  mrrNone: "Nessun abbonamento attivo sugli store",
  mrrAt: (t: string) => `Calcolato alle ${t}`,
  growthPrev: (n: string) => `sui 30 giorni prima (${n})`,
  growthNone: "nessun utente nei 30 giorni prima",
  perDay: "Nuovi utenti al giorno",
  perDaySub: "Ultimi 30 giorni, senza gli account interni. L’ultima barra è oggi, ancora in corso.",
  perDayEmpty: "Nessun nuovo utente negli ultimi 30 giorni",
  unitHead: "Costo medio · 30 giorni",
  archive: "Articoli in archivio",
  archiveDesc: "MT Newswires e Adnkronos, solo gli articoli con testo.",
  archiveRow: "Articoli",
  allTime: "Da sempre",
  points: "Prezzi dei titoli in archivio",
  pointsDesc: "Prezzi giornalieri e durante la giornata, per tutti i titoli. Numero indicativo.",
  mln: (v: string) => `${v} milioni`,

  pageError: "Non è stato possibile caricare la Home",
  pageErrorBody: "Il server non ha risposto. Riprova tra poco.",
  deniedTitle: "Nessuna pagina disponibile",
  deniedBody: "Il tuo ruolo non apre nessuna pagina del pannello. Chiedi a un super admin.",
} as const;

export const LINES = [
  { key: "images", label: "Costo immagini", desc: "Generazione delle immagini degli articoli", dot: "#6FB6FF" },
  { key: "articles", label: "Costo articoli", desc: "Riassunti, traduzioni, parole chiave e classificazione", dot: "#C9A7FF" },
  { key: "stock_snapshot", label: "Costo Stock Snapshot", desc: "Generazione dei report e loro traduzione", dot: "var(--accent)" },
  { key: "financial_report", label: "Costo financial report", desc: "Testi, fonti e roadmap dei financial report", dot: "#E2BE78" },
] as const;

/** MOB-1461: what one generation of each line is (the unit under «Costo medio»). */
export const UNIT: Record<string, { one: string; none: string }> = {
  images: { one: "per immagine", none: "nessuna immagine in 30 giorni" },
  articles: { one: "per articolo", none: "nessun articolo in 30 giorni" },
  stock_snapshot: { one: "per titolo", none: "nessun titolo in 30 giorni" },
  financial_report: { one: "per report", none: "nessun report in 30 giorni" },
};

export const PLANS = [
  { key: "free", label: "Free", dot: "rgba(236, 244, 241, 0.4)" },
  { key: "premium", label: "Premium", dot: "#E6EBEA" },
  { key: "unlimited", label: "Unlimited", dot: "#E2BE78" },
  { key: "trial", label: "In prova", dot: "var(--accent)" },
] as const;
