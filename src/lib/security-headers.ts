/**
 * Header di sicurezza di finzyapp.com (MOB-625), usati da `next.config.ts`.
 *
 * Solo dati e funzioni pure: li legge anche `src/lib/security-headers.test.ts`.
 *
 * La CSP segue quello che il sito carica davvero. Verificata il 9/11/2026 con
 * `next start` su ogni pagina, senza violazioni nella console, sia senza
 * iubenda (com'è oggi in produzione) sia con un Site ID di prova: si carica
 * tutta la catena di iubenda (`cdn.`, `cs.`, `idb.`). Il banner vero e proprio
 * non si è potuto vedere, perché sull'account iubenda la Cookie Solution è
 * ancora spenta (`csEnabled = false`): quando la si accende, ricontrollare la
 * console. In sintesi:
 * - script, stili, font e immagini dal sito stesso: i font di `next/font`
 *   sono serviti da `/_next/static`, nessuna chiamata a Google Fonts;
 * - `'unsafe-inline'` negli script: le pagine sono statiche e Next vi scrive
 *   script inline (`self.__next_f`). Un nonce obbligherebbe a rendere ogni
 *   pagina a ogni richiesta, cioè a perdere la cache di Vercel;
 * - `'unsafe-inline'` negli stili: React scrive attributi `style` (count-up,
 *   mappa, animazioni) e iubenda inietta il suo CSS;
 * - iubenda (banner dei cookie, MOB-815) da `*.iubenda.com`: gli script da
 *   `cdn.` e `cs.`, il consenso salvato su `idb.`; anche font, immagini e
 *   finestre, per il banner e il pannello delle preferenze;
 * - le chiamate all'API di Finzy (news, ticker) partono dal server, non dal
 *   browser, quindi `connect-src` non le cita.
 */

const IUBENDA = "https://*.iubenda.com";

/**
 * La barra delle anteprime di Vercel (commenti, toolbar). Vercel la inietta
 * nei deploy di anteprima. In produzione non va ammessa di proposito: se un
 * membro del team accende la toolbar anche lì, vedrà violazioni CSP in
 * console solo lui, e va bene così (MOB-625).
 */
const VERCEL_LIVE = {
  script: ["https://vercel.live"],
  style: ["https://vercel.live"],
  img: ["https://vercel.live", "https://vercel.com"],
  font: ["https://vercel.live", "https://assets.vercel.com"],
  connect: ["https://vercel.live", "wss://ws-us3.pusher.com"],
  frame: ["https://vercel.live"],
};

export type CspOptions = {
  /** `next dev`: React usa `eval` per ricostruire gli stack del server. */
  dev: boolean;
  /** Deploy di anteprima su Vercel (`VERCEL_ENV=preview`). */
  vercelPreview: boolean;
};

export function contentSecurityPolicy({ dev, vercelPreview }: CspOptions): string {
  const v = (list: string[]) => (vercelPreview ? list : []);
  const directives: [string, string[]][] = [
    ["default-src", ["'self'"]],
    [
      "script-src",
      ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : []), IUBENDA, ...v(VERCEL_LIVE.script)],
    ],
    ["style-src", ["'self'", "'unsafe-inline'", IUBENDA, ...v(VERCEL_LIVE.style)]],
    // data: per i segnaposto sfocati di next/image e il logo dell'immagine OG.
    ["img-src", ["'self'", "data:", IUBENDA, ...v(VERCEL_LIVE.img)]],
    ["font-src", ["'self'", IUBENDA, ...v(VERCEL_LIVE.font)]],
    ["connect-src", ["'self'", IUBENDA, ...v(VERCEL_LIVE.connect)]],
    ["frame-src", [IUBENDA, ...v(VERCEL_LIVE.frame)]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
    // Non in `next dev`: da un telefono su http://192.168.x.x Safari porterebbe
    // gli asset della pagina su https, e la pagina si rompe.
    ...(dev ? [] : ([["upgrade-insecure-requests", []]] as [string, string[]][])),
  ];
  return directives
    .map(([name, sources]) => [name, ...sources].join(" "))
    .join("; ");
}

/** Gli header che ogni risposta del sito porta. */
export function securityHeaders(options: CspOptions) {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    // `frame-ancestors 'none'` fa lo stesso nei browser recenti; questo vale
    // anche per quelli che non leggono la CSP.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ];
}
