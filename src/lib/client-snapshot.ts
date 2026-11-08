import { useSyncExternalStore } from "react";

/**
 * Valori che esistono solo nel browser, letti senza setState dentro un effect
 * (regola react-hooks/set-state-in-effect, MOB-666). Sul server e durante
 * l'hydration valgono il default del server; subito dopo l'hydration React
 * ripassa con il valore del browser, come faceva prima
 * `useEffect(() => setX(...), [])`. Su un mount lato client senza hydration
 * (navigazione con Link) il valore del browser c'è già al primo render.
 *
 * Nessuna sottoscrizione: un cambio delle impostazioni di sistema a visita in
 * corso non cambia la pagina, come prima.
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

// Letto una volta per caricamento della pagina: un re-render (per esempio un
// cambio di lingua) non rilegge l'impostazione di sistema.
let reducedMotion: boolean | undefined;

function getReducedMotion(): boolean {
  reducedMotion ??= window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  return reducedMotion;
}

/** `prefers-reduced-motion: reduce` del visitatore; `false` sul server. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(noopSubscribe, getReducedMotion, () => false);
}
