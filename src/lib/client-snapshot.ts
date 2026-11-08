import { useSyncExternalStore } from "react";

/**
 * Valori che esistono solo nel browser, letti senza setState dentro un effect
 * (regola react-hooks/set-state-in-effect, MOB-666). Sul server e durante
 * l'hydration valgono il default del server; subito dopo React ripassa con il
 * valore del browser, come faceva prima `useEffect(() => setX(...), [])`.
 *
 * Nessuna sottoscrizione: il valore si legge al render, come prima si leggeva
 * al mount. La pagina non reagisce a un cambio delle impostazioni di sistema a
 * visita in corso, esattamente come prima.
 */
export const noopSubscribe = () => () => {};

/** `true` nel browser dopo l'hydration (per i portal su `document.body`). */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** `prefers-reduced-motion: reduce` del visitatore; `false` sul server. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
