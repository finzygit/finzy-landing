/**
 * Cosa fare quando l'API del backend non risponde (MOB-1281).
 *
 * Le notizie del hero e il ticker si leggono quando Next genera la pagina:
 * una volta in `next build`, poi a ogni rigenerazione (ogni 5 minuti). Se a
 * una rigenerazione l'API non risponde, una lista vuota diventerebbe la nuova
 * pagina in cache e card e ticker sparirebbero fino al ritorno dell'API.
 * Lanciare l'errore invece fa scartare la rigenerazione: Next continua a
 * servire l'ultima pagina buona e riprova alla richiesta successiva
 * (node_modules/next/dist/docs/01-app/02-guides/incremental-static-regeneration.md).
 *
 * Nel build non c'è una pagina precedente da tenere, e un errore bloccherebbe
 * il deploy: lì si torna `empty` e la sezione si nasconde. Lo stesso in
 * sviluppo e nei test.
 *
 * L'errore resta nei log di Vercel. Il controllo di raggiungibilità dell'API
 * è quello di MOB-620 (docs/monitoraggio.md del backend).
 */

/** Il valore di `process.env.NEXT_PHASE` durante `next build` (next/constants). */
const NEXT_BUILD_PHASE = "phase-production-build";

/** Vero quando Next rigenera una pagina in produzione (`next start`, Vercel). */
function isProductionRegeneration(): boolean {
  return process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== NEXT_BUILD_PHASE;
}

/**
 * Scrive l'errore nel log, poi lo rilancia durante una rigenerazione in
 * produzione e torna `empty` negli altri casi.
 */
export function onBackendOutage<T>(message: string, error: unknown, empty: T): T {
  console.error(message, error);
  if (isProductionRegeneration()) throw error;
  return empty;
}
