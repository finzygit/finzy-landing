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
  alBudget: (p: string, s: string, b: string, pct: number) => `Spesa ${p} del mese: ${s} su un budget di ${b} (${pct}%).`,

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

export const PLANS = [
  { key: "free", label: "Free", dot: "rgba(236, 244, 241, 0.4)" },
  { key: "premium", label: "Premium", dot: "#E6EBEA" },
  { key: "unlimited", label: "Unlimited", dot: "#E2BE78" },
  { key: "trial", label: "In prova", dot: "var(--accent)" },
] as const;
