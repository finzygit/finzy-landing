"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Menu di navigazione a tutto schermo: l'hamburger apre un overlay con lo
 * sfondo coral sfocato e i link centrati (portal su body, così i suoi elementi
 * `fixed` coprono il viewport anche dentro antenati con transform). Chiude su
 * Esc, sulla X o cliccando un link. Blocca lo scroll del body quando aperto.
 */
export function NavMenu({ triggerClassName }: { triggerClassName?: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={t.nav.open}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          triggerClassName,
        )}
      >
        <Menu className="h-6 w-6" strokeWidth={1.75} />
      </button>

      {mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.dialog}
            className={cn(
              "fixed inset-0 z-[90] transition-opacity duration-300",
              open ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {/* Sfondo coral sfocato + velo scuro */}
            <div
              aria-hidden
              className="absolute inset-0 overflow-hidden bg-[#05070a]"
            >
              <Image
                src="/hero-img.png"
                alt=""
                fill
                sizes="100vw"
                className="scale-110 object-cover object-center opacity-30 blur-2xl"
              />
              <div className="absolute inset-0 bg-background/80" />
            </div>

            <button
              type="button"
              aria-label={t.nav.close}
              onClick={close}
              className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-8 sm:top-6"
            >
              <X className="h-7 w-7" strokeWidth={1.5} />
            </button>

            <nav
              className={cn(
                "relative flex h-full flex-col items-center justify-center gap-1 px-6 text-center transition-all duration-300 ease-out",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
            >
              {t.nav.links.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={close}
                  className="rounded-lg px-4 py-2 text-3xl font-light text-foreground/90 transition-colors hover:text-primary sm:text-4xl"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}
