/**
 * Dati dell'editore dell'app Finzy e recapiti di assistenza.
 *
 * Fonte unica di verità: la pagina /contatti, i dati strutturati JSON-LD e il
 * footer leggono da qui, così il contenuto visibile e quello per i crawler
 * (e per i revisori degli store) non possono divergere.
 *
 * L'email deve coincidere con i "Store Listing contact details" della scheda
 * Google Play: la policy News and Magazines richiede che i recapiti pubblicati
 * sul sito siano gli stessi dichiarati nello store. Il sito non pubblica un
 * numero di telefono.
 */

/** Casella di assistenza, come nella scheda Google Play. */
export const SUPPORT_EMAIL = "info@finzyapp.com";

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
