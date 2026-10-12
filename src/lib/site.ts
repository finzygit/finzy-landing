/**
 * Identità del sito: fonte unica per metadata, dati strutturati, robots,
 * sitemap e llms.txt, così le descrizioni per i crawler non possono divergere.
 */
export const SITE_URL = "https://finzyapp.com";

export const SITE_NAME = "Finzy";

/** Lingue dell'interfaccia (vedi `LANGUAGES` in src/lib/i18n.tsx). */
export const SITE_LANGUAGES = ["it", "en", "es", "fr", "pt"];

/** Descrizione del prodotto per crawler e modelli linguistici. */
export const APP_DESCRIPTION =
  "Finzy è un'app per iOS e Android che rende la finanza accessibile: notizie finanziarie riassunte dall'IA in 60 secondi, un feed personalizzato sui tuoi interessi e prezzi dei titoli in tempo reale.";
