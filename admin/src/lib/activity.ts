// MOB-1372, MOB-1487: the activity log's events in words. The backend records
// `<area>.<thing>.<verb>` (App\Services\Admin\ActivityLog); the page shows the
// verb on the chip and verb + thing in the detail, never the code itself.

/** The verb of an event, as the chip says it. */
export const VERB: Record<string, string> = {
  create: "Ha creato", update: "Ha modificato", delete: "Ha eliminato", gift: "Ha regalato", revoke: "Ha revocato", remove: "Ha tolto",
  signin: "Accesso", signout: "Uscita", failed: "Codice sbagliato", locked: "Accesso bloccato", reset: "Ha azzerato", enable: "Ha attivato",
  regenerate: "Nuovi codici", export: "Ha esportato", hide: "Ha nascosto", show: "Ha mostrato",
  end: "Ha terminato", suspend: "Ha sospeso", reactivate: "Ha riattivato",
};

/** What the event acted on, with its article, after the verb: «Ha regalato un piano». */
const THING: Record<string, string> = {
  "users.plan": "un piano", "users.user": "un utente", "users.list": "l’elenco utenti", "users.avatar": "l’avatar di un utente",
  "promotions.promotion": "una promozione",
  "news.article": "un articolo", "news.link": "un collegamento", "news.source": "una fonte", "news.taxonomy": "una classificazione",
  "stocks.stock": "un titolo", "stocks.alternative": "un ticker alternativo", "stocks.logo": "il logo di un titolo", "stocks.banner": "il banner di un titolo",
  "revenue.payments": "i pagamenti",
  "reports.consents": "i consensi",
  "content.lesson": "una lezione", "content.lessons": "le lezioni", "content.lesson_cover": "la copertina di una lezione", "content.lesson_video": "il video di una lezione",
  "content.lesson_order": "l’ordine delle lezioni", "content.avatar": "un avatar", "content.avatar_image": "l’immagine di un avatar", "content.avatar_order": "l’ordine degli avatar",
  "content.tutorial_step": "un passo del tutorial", "content.tutorial_image": "l’immagine di un passo del tutorial", "content.tutorial_order": "l’ordine dei passi del tutorial",
  "content.maintenance": "la manutenzione", "content.setting": "un’impostazione",
  "admin.role": "un ruolo", "admin.person": "l’accesso di una persona", "admin.person.two_factor": "la verifica in due passaggi di una persona", "admin.activity": "il registro attività",
};

/** Sign-ins and codes read better as a whole sentence. */
const WHOLE: Record<string, string> = {
  "access.session.signin": "Accesso alla console",
  "access.session.signout": "Uscita dalla console",
  "access.two_factor.failed": "Codice di verifica sbagliato",
  "access.two_factor.locked": "Accesso bloccato dopo troppi codici sbagliati",
  "access.two_factor.enable": "Ha attivato la verifica in due passaggi",
  "access.recovery_codes.regenerate": "Ha creato nuovi codici di recupero",
};

/** The chip: the verb alone; «Altro» for a verb this page does not know yet. */
export function verbOf(event: string): string {
  const parts = event.split(".");
  return (parts.length > 1 && VERB[parts[parts.length - 1]]) || "Altro";
}

/** The detail's «Evento» line: «Ha regalato un piano»; the verb alone when the thing is new to this page. */
export function eventName(event: string): string {
  if (WHOLE[event]) return WHOLE[event];
  const verb = verbOf(event);
  const thing = THING[event.split(".").slice(0, -1).join(".")];
  return verb !== "Altro" && thing ? `${verb} ${thing}` : verb;
}

/**
 * MOB-1488: the detail's «Campo» column. The backend records English or Italian
 * keys (ActivityLog::record before/after); a person reads these names instead.
 * `_it` / `_en` at the end add «in italiano» / «in inglese».
 */
export const FIELD: Record<string, string> = {
  // content
  id: "Codice", attivo: "Attivo", name: "Nome", nome: "Nome", ordine: "Ordine", sezione: "Sezione", category: "Sezione",
  visibile: "Visibile", active: "Visibile", titolo: "Titolo", title: "Titolo", lezioni: "Lezioni", summary: "Riassunto",
  objectives: "Obiettivi", hashtags: "Hashtag", lingua: "Lingua", durata: "Durata (secondi)", pagina: "Pagina", funzione: "Funzione",
  body: "Testo", testo: "Testo", descrizione: "Descrizione", immagine: "Immagine",
  maintenance: "Manutenzione", ask_review: "Chiedi la recensione su iPhone", ask_review_android: "Chiedi la recensione su Android",
  min_version: "Numero di build minimo", privacy_url: "Informativa privacy", terms_url: "Termini e condizioni",
  // news
  azione_id: "Titolo collegato (n.)", giudizio: "Giudizio", relation_source: "Origine del collegamento",
  relation_confidence: "Affidabilità del collegamento", relation_type: "Tipo di collegamento",
  // people, users, plans, exports
  ruolo: "Ruolo", permessi: "Permessi", piano: "Piano", plan: "Piano", scadenza: "Scadenza", expires_at: "Scadenza", sospeso: "Sospeso",
  campi: "Campi cambiati", righe: "Righe", piani: "Piani", ricerca: "Con una ricerca", filtri: "Filtri", mese: "Mese", tipo: "Tipo", piattaforma: "Piattaforma",
  // promotions
  code: "Codice", starts_at: "Inizio", ends_at: "Fine", countries: "Paesi", statuses: "Stato dell’utente", formulas: "Formule",
  // stocks
  common_name: "Nome comune", common_name_locked: "Nome bloccato", alternatives: "Ticker alternativi", logo: "Logo", banner: "Banner dello Stock Snapshot",
};

const LANG: Record<string, string> = { it: "in italiano", en: "in inglese" };

/** «common_name_locked» → «Nome bloccato»; a key this page does not know yet reads as words («trial_days» → «Trial days»). */
export function fieldName(key: string): string {
  if (Object.hasOwn(FIELD, key)) return FIELD[key];
  const lang = key.match(/^(.+)_(it|en)$/);
  if (lang) return `${fieldName(lang[1])} ${LANG[lang[2]]}`;
  const words = key.replace(/[_.]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "—";
}

/** A value in the detail: yes/no for a switch, «—» for nothing, the rest as stored. */
export function fieldValue(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "boolean") return v ? "Sì" : "No";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}
