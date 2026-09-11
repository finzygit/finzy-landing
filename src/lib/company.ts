/**
 * Dati dell'editore dell'app Finzy e recapiti di assistenza.
 *
 * Fonte unica di verità: la pagina /contatti, i dati strutturati JSON-LD e il
 * footer leggono da qui, così il contenuto visibile e quello per i crawler
 * (e per i revisori degli store) non possono divergere.
 *
 * Email e telefono coincidono con i "Store Listing contact details" della
 * scheda Google Play: la policy News and Magazines richiede che i recapiti
 * pubblicati sul sito siano gli stessi dichiarati nello store.
 */

/** Casella di assistenza, come nella scheda Google Play. */
export const SUPPORT_EMAIL = "cervo.carlo@finzyapp.com";

/** Formato E.164, per il link `tel:` e per i dati strutturati. */
export const SUPPORT_PHONE_E164 = "+393664114468";

/** Stesso numero, spaziato per la lettura a schermo. */
export const SUPPORT_PHONE_DISPLAY = "+39 366 411 4468";

export const PRIVACY_POLICY_URL =
  "https://www.iubenda.com/privacy-policy/68699235";

export type Publisher = {
  /** Ragione sociale completa, come in visura. */
  legalName: string;
  /** Indirizzo della sede legale su una riga. */
  address: string;
  /** Partita IVA, con prefisso paese (es. IT01234567890). */
  vatId: string;
  /** Numero di iscrizione al registro imprese / REA. Opzionale. */
  registrationNumber?: string;
};

/**
 * TODO(dati mancanti): ragione sociale, sede legale e partita IVA non sono
 * ancora stati forniti. Finché resta `null` la pagina /contatti non mostra il
 * blocco "Società editrice" e il JSON-LD non dichiara `legalName`/`vatID`:
 * meglio un blocco assente che dati inventati o incoerenti con la visura.
 * Compilare l'oggetto qui sotto è l'unica modifica necessaria per attivarlo.
 */
export const PUBLISHER: Publisher | null = null;
