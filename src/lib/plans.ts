/**
 * Piani e prezzi dell'app. Fonte unica di verità: la sezione Prezzi, i dati
 * strutturati SoftwareApplication e llms.txt leggono da qui, così il prezzo
 * mostrato a schermo e quello dichiarato ai crawler non possono divergere.
 *
 * I prezzi sono quelli degli store (App Store e Google Play, Italia), in vigore
 * dal 15/10/2026 (MOB-498): vanno cambiati qui quando cambiano sugli store.
 * Test: `src/lib/plans.test.ts` (MOB-592).
 */

// Nomi commerciali + prezzo mensile e annuale (in €) + piano evidenziato. Non tradotti.
// href: /download, lo smart link verso lo store (MOB-828: il modulo contatti non c'è più).
export const PLANS = [
  { name: "Free", price: 0, annualPrice: 0, href: "/download", popular: false },
  { name: "Premium", price: 7.99, annualPrice: 80, href: "/download", popular: false },
  { name: "Unlimited", price: 9.99, annualPrice: 100, href: "/download", popular: true },
];

export type Plan = (typeof PLANS)[number];

export const PRICE_CURRENCY = "EUR";

/** Prezzo al mese con fatturazione annuale: il prezzo annuale diviso 12. */
export function annualMonthlyPrice(plan: Plan) {
  return Math.round((plan.annualPrice / 12) * 100) / 100;
}

/** Sconto dell'annuale sul mensile pagato per 12 mesi (0,166 = 16,6%). */
export function annualDiscount(plan: Plan) {
  return plan.price > 0 ? 1 - plan.annualPrice / (plan.price * 12) : 0;
}

/**
 * Badge del piano annuale ("-17%"): lo sconto arrotondato, il più basso tra i
 * piani a pagamento, così il sito non promette mai più di quello che c'è.
 */
export const ANNUAL_BADGE = `-${Math.min(
  ...PLANS.filter((plan) => plan.price > 0).map((plan) =>
    Math.round(annualDiscount(plan) * 100),
  ),
)}%`;

/**
 * Lezioni di Learning attive nell'app (tabella `learning_videos`, active = 1,
 * letta in produzione il 7/11/2026: fondamenti 9, sistema finanziario 4,
 * mercati 6). Va aggiornato quando si aggiungono lezioni.
 */
export const LESSON_COUNT = 19;
