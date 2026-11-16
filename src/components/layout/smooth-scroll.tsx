"use client";

import { useEffect } from "react";

/**
 * Rende fluido lo scroll verso le sezioni per tutti i link ad ancora (#id).
 * Intercetta in fase di cattura e chiama preventDefault: next/link vede
 * `defaultPrevented` e non fa il suo salto istantaneo. Non ferma la
 * propagazione (MOB-1447): gli onClick dei link devono girare lo stesso,
 * per esempio quello che chiude il menu di navigazione. Rispetta
 * prefers-reduced-motion e l'offset della navbar (scroll-padding-top in
 * globals.css).
 *
 * Anche "/" dalla home: torna in cima con lo stesso scroll fluido.
 *
 * Gestisce anche i link in forma assoluta (/#id): dalle sottopagine (es.
 * /contatti) devono navigare davvero verso la home, dalla home invece si
 * comportano come una normale ancora.
 */
export function SmoothScroll() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const node = e.target as Element | null;
      const anchor = node?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // "#id" sempre; "/#id" solo se siamo già sulla home (altrimenti lascia
      // che next/link faccia la navigazione vera verso la home).
      let hash: string | null = null;
      if (href.startsWith("#")) hash = href;
      else if (href.startsWith("/#") && window.location.pathname === "/") {
        hash = href.slice(1);
      }
      // "/" dalla home (Home del menu, logo): torna in cima qui. Lasciato a
      // next/link, in WebKit una volta su dieci la pagina restava giù
      // (MOB-1447, anche prima della correzione del menu).
      const toTop = href === "/" && window.location.pathname === "/";
      if (!toTop && (!hash || hash === "#")) return;

      const target = toTop ? null : document.getElementById(hash!.slice(1));
      if (!toTop && !target) return;

      e.preventDefault();

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      history.pushState(null, "", toTop ? "/" : hash);
      // Al frame dopo (MOB-1447): questo listener gira prima dell'onClick del
      // link, e dal menu di navigazione il body ha ancora overflow: hidden.
      // Chiudendo il menu React lo rimette a posto; nei test WebKit uno scroll
      // fluido partito prima è rimasto fermo una volta su 48: difensivo.
      requestAnimationFrame(() => {
        const behavior = reduce ? "auto" : "smooth";
        if (target) target.scrollIntoView({ behavior, block: "start" });
        else window.scrollTo({ top: 0, behavior });
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
