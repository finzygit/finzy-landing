/**
 * Piani e prezzi dell'app. Fonte unica di verità: la sezione Prezzi, i dati
 * strutturati SoftwareApplication e llms.txt leggono da qui, così il prezzo
 * mostrato a schermo e quello dichiarato ai crawler non possono divergere.
 */

// Nomi commerciali + prezzo mensile (in €) + piano evidenziato. Non tradotti.
export const PLANS = [
  { name: "Free", price: 0, href: "#contatti", popular: false },
  { name: "Premium", price: 4.99, href: "#contatti", popular: false },
  { name: "Unlimited", price: 6.99, href: "#contatti", popular: true },
];

export type Plan = (typeof PLANS)[number];

export const PRICE_CURRENCY = "EUR";

/** Sconto del piano annuale sul prezzo mensile (badge "-20%"). */
export const ANNUAL_DISCOUNT = 0.2;

/** Prezzo al mese con fatturazione annuale. */
export function annualMonthlyPrice(price: number) {
  return Math.round(price * (1 - ANNUAL_DISCOUNT) * 100) / 100;
}
