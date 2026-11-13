/**
 * Titolo e descrizione per Google e per le anteprime social (MOB-1271).
 *
 * Il testo riprende la scheda dell'App Store (sottotitolo «Borsa, azioni e
 * investimenti»; «Finzy ti mostra cosa si è mosso oggi sui mercati e ti
 * spiega perché»). Limiti: titolo ≤ 60 caratteri, descrizione ≤ 155, così
 * Google non li taglia (verificati da seo.test.ts).
 *
 * Il sito ha un solo indirizzo per tutte le lingue e la pagina è in italiano
 * (`<html lang="it">`), quindi i meta tag usano `it`. Il testo `en` è pronto
 * per quando il sito avrà pagine per lingua.
 */
export const META = {
  it: {
    title: "Finzy — Notizie di Borsa, azioni e investimenti",
    description:
      "Finzy ti mostra cosa si è mosso oggi sui mercati e perché: notizie riassunte dall'AI, pagine dei titoli, report Stock Snapshot sui 10-K e videolezioni.",
  },
  en: {
    title: "Finzy — Market news, stocks and investing",
    description:
      "Finzy shows you what moved on the markets today and why: AI news summaries, stock pages, Stock Snapshot reports on 10-K filings and video lessons.",
  },
} as const;
