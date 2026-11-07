/**
 * Consenso ai cookie con la Cookie Solution di iubenda (MOB-815).
 *
 * Qui c'è solo logica pura, senza React e senza `window`, così i test girano
 * con `node --test`. Il componente che carica iubenda è
 * `src/components/layout/cookie-consent.tsx`.
 *
 * Configurazione (nessun segreto, gli ID sono pubblici):
 * - `NEXT_PUBLIC_IUBENDA_SITE_ID`: il Site ID del sito in iubenda. Senza,
 *   il banner non si carica e il sito resta com'è.
 * - `NEXT_PUBLIC_IUBENDA_COOKIE_POLICY_IDS`: facoltativa. Gli ID della cookie
 *   policy per lingua, `it:68699235,en:58107777`. Senza, valgono quelli di
 *   `DEFAULT_COOKIE_POLICY_IDS`, cioè le versioni della privacy policy di
 *   Finzy pubblicate oggi su iubenda.
 */

/** Le cinque finalità di iubenda con `perPurposeConsent`, con i loro ID. */
export const PURPOSES = {
  necessary: "1",
  functionality: "2",
  experience: "3",
  measurement: "4",
  marketing: "5",
} as const;

export type Purpose = keyof typeof PURPOSES;

const ALL_PURPOSES = Object.keys(PURPOSES) as Purpose[];

/**
 * ID della privacy policy di Finzy su iubenda per ogni lingua del sito,
 * letti dal selettore lingua della policy pubblicata (6/11/2026). La cookie
 * policy di iubenda ha lo stesso ID della privacy policy.
 */
export const DEFAULT_COOKIE_POLICY_IDS: Record<string, number> = {
  it: 68699235,
  en: 58107777,
  fr: 71394607,
  es: 71912471,
  pt: 51987107,
};

/** Lingua di ripiego quando quella della pagina non ha una policy. */
const FALLBACK_LANG = "it";

export type IubendaConfig = {
  siteId: number;
  cookiePolicyIds: Record<string, number>;
};

function toId(value: string | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const id = Number(trimmed);
  return id > 0 ? id : null;
}

/**
 * Legge la configurazione dalle variabili d'ambiente. Restituisce `null`
 * (banner spento) se il Site ID manca o non è un numero.
 *
 * `cookiePolicyIds` accetta `lingua:ID` separati da virgole; una voce senza
 * lingua vale per l'italiano. Le voci non valide si ignorano, e le lingue non
 * indicate tengono l'ID di `DEFAULT_COOKIE_POLICY_IDS`.
 */
export function parseIubendaConfig(env: {
  siteId?: string;
  cookiePolicyIds?: string;
}): IubendaConfig | null {
  const siteId = toId(env.siteId);
  if (siteId === null) return null;

  const cookiePolicyIds = { ...DEFAULT_COOKIE_POLICY_IDS };
  for (const entry of (env.cookiePolicyIds ?? "").split(",")) {
    if (!entry.trim()) continue;
    const [first, second] = entry.split(":");
    const lang = second === undefined ? FALLBACK_LANG : first.trim().toLowerCase();
    const id = toId(second === undefined ? first : second);
    if (lang && id !== null) cookiePolicyIds[lang] = id;
  }
  return { siteId, cookiePolicyIds };
}

/** L'ID della cookie policy per la lingua, con ripiego sull'italiano. */
export function cookiePolicyIdFor(config: IubendaConfig, lang: string): number {
  return config.cookiePolicyIds[lang] ?? config.cookiePolicyIds[FALLBACK_LANG];
}

export function cookiePolicyUrl(cookiePolicyId: number): string {
  return `https://www.iubenda.com/privacy-policy/${cookiePolicyId}/cookie-policy`;
}

/**
 * La configurazione da mettere in `_iub.csConfiguration`, senza i callback
 * (li aggiunge il componente). Con l'embed nel codice il banner segue questa
 * configurazione, non l'anteprima del pannello di iubenda: i testi sono i
 * modelli di iubenda nella lingua della pagina, i colori quelli del sito.
 * Le regole che il sito deve rispettare:
 * - un consenso per ogni finalità, così uno script parte solo con la sua;
 * - "Rifiuta" visibile quanto "Accetta", e la X chiude rifiutando, come
 *   chiedono le linee guida del Garante del 2021;
 * - nessun ricaricamento della pagina al consenso;
 * - una sola scelta per tutte le lingue del sito.
 */
export function buildCsConfiguration(config: IubendaConfig, lang: string) {
  return {
    siteId: config.siteId,
    cookiePolicyId: cookiePolicyIdFor(config, lang),
    lang,
    perPurposeConsent: true,
    reloadOnConsent: false,
    // Ogni lingua ha la sua cookie policy, ma la scelta del visitatore vale
    // per tutto il sito: la si salva sotto il Site ID, non sotto l'ID della
    // policy, così cambiando lingua il banner non torna.
    storage: { useSiteId: true },
    banner: {
      acceptButtonDisplay: true,
      customizeButtonDisplay: true,
      rejectButtonDisplay: true,
      closeButtonRejects: true,
      explicitWithdrawal: true,
      listPurposes: true,
      position: "float-bottom-center",
      // Colori del sito (globals.css). "Rifiuta" ha lo stesso peso di
      // "Accetta": stesso colore, stessa dimensione.
      backgroundColor: "#10151C",
      textColor: "#EEF2F4",
      acceptButtonColor: "#20E5D1",
      acceptButtonCaptionColor: "#04211E",
      rejectButtonColor: "#20E5D1",
      rejectButtonCaptionColor: "#04211E",
      customizeButtonColor: "#1E2630",
      customizeButtonCaptionColor: "#EEF2F4",
    },
  };
}

/** La parte della preferenza di iubenda che serve al sito. */
export type IubendaPreference = {
  consent?: boolean;
  purposes?: Record<string, boolean>;
} | null | undefined;

/**
 * Le finalità concesse secondo la preferenza che iubenda passa ai callback.
 * Le necessarie sono sempre concesse. Senza preferenza, o con una che non si
 * capisce, vale solo il necessario: nel dubbio uno script non parte.
 */
export function grantedPurposes(preference: IubendaPreference): Set<Purpose> {
  const granted = new Set<Purpose>(["necessary"]);
  if (!preference) return granted;

  if (preference.purposes && typeof preference.purposes === "object") {
    for (const purpose of ALL_PURPOSES) {
      if (preference.purposes[PURPOSES[purpose]] === true) granted.add(purpose);
    }
    return granted;
  }
  // Senza il dettaglio per finalità, un consenso esplicito vale per tutte.
  if (preference.consent === true) {
    for (const purpose of ALL_PURPOSES) granted.add(purpose);
  }
  return granted;
}

/** Vero se tra `before` e `after` è stata tolta almeno una finalità. */
export function wasWithdrawn(
  before: ReadonlySet<Purpose>,
  after: ReadonlySet<Purpose>,
): boolean {
  for (const purpose of before) if (!after.has(purpose)) return true;
  return false;
}
