"use client";

import { useEffect } from "react";

/**
 * Rende fluido lo scroll verso le sezioni per tutti i link ad ancora (#id).
 * Intercetta in fase di cattura così vince sul routing di next/link, che
 * altrimenti salterebbe istantaneo. Rispetta prefers-reduced-motion e
 * l'offset della navbar (scroll-padding-top in globals.css).
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
      if (!hash || hash === "#") return;

      const target = document.getElementById(hash.slice(1));
      if (!target) return;

      e.preventDefault();
      e.stopPropagation();

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      target.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
      history.pushState(null, "", hash);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
