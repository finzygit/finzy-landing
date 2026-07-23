"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useLanguage, type Lang, type Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type BodyProps = {
  t: Dict;
  lang: Lang;
  setLang: (lang: Lang) => void;
  onClose: () => void;
  variant: "mobile" | "desktop";
};

function MenuBody({ t, lang, setLang, onClose, variant }: BodyProps) {
  const isMobile = variant === "mobile";
  return (
    <>
      {isMobile && (
        <div className="flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="finzy"
            width={742}
            height={1024}
            className="h-10 w-auto"
          />
          <button
            type="button"
            aria-label={t.nav.close}
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-6 w-6" strokeWidth={1.75} />
          </button>
        </div>
      )}

      <nav className={cn("flex flex-col gap-1", isMobile && "mt-10")}>
        {t.nav.links.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            onClick={onClose}
            className={cn(
              "rounded-lg px-3 font-medium text-foreground/90 transition-colors hover:bg-white/5 hover:text-primary",
              isMobile ? "py-3 text-2xl" : "py-2 text-lg",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div
        className={cn(
          isMobile
            ? "mt-auto space-y-6 pt-10"
            : "mt-4 space-y-5 border-t border-white/10 pt-5",
        )}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            {t.langLabel}
          </p>
          <div className="mt-3 inline-flex rounded-full border border-white/15 p-1">
            {(["it", "en"] as Lang[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  lang === code
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground",
                )}
              >
                {t.langNames[code]}
              </button>
            ))}
          </div>
        </div>

        <Link
          href="#contatti"
          onClick={onClose}
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {t.nav.cta}
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </>
  );
}

/**
 * Navigazione dall'hamburger:
 * - desktop (lg+): dropdown ancorato al pulsante (absolute, immune ai transform);
 * - mobile: drawer da destra reso in un portal su document.body, così i suoi
 *   elementi `fixed` coprono davvero il viewport anche quando l'hamburger vive
 *   dentro un antenato con transform (es. la navbar sticky).
 */
export function NavMenu({ triggerClassName }: { triggerClassName?: string }) {
  const { t, lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    let cleanupExtra = () => {};
    if (isMobile) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      cleanupExtra = () => {
        document.body.style.overflow = original;
      };
    } else {
      const onDown = (e: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", onDown);
      cleanupExtra = () => document.removeEventListener("mousedown", onDown);
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      cleanupExtra();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={t.nav.open}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          triggerClassName,
        )}
      >
        <Menu className="h-6 w-6" strokeWidth={1.75} />
      </button>

      {/* Dropdown desktop (ancorato al pulsante) */}
      <div
        className={cn(
          "absolute right-0 top-full z-[70] mt-3 hidden w-72 flex-col rounded-2xl border border-white/10 bg-[#0b1018] p-6 shadow-2xl transition-all duration-200 ease-out lg:flex",
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0",
        )}
      >
        <MenuBody
          t={t}
          lang={lang}
          setLang={setLang}
          onClose={close}
          variant="desktop"
        />
      </div>

      {/* Drawer mobile in portal su body (immune ai transform degli antenati) */}
      {mounted &&
        createPortal(
          <div className="lg:hidden">
            <div
              aria-hidden
              onClick={close}
              className={cn(
                "fixed inset-0 z-[60] bg-background/85 backdrop-blur-sm transition-opacity duration-300",
                open ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.nav.dialog}
              className={cn(
                "fixed right-0 top-0 z-[70] flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-[#0b1018] p-6 shadow-2xl transition-transform duration-300 ease-out sm:p-8",
                open ? "translate-x-0" : "pointer-events-none translate-x-full",
              )}
            >
              <MenuBody
                t={t}
                lang={lang}
                setLang={setLang}
                onClose={close}
                variant="mobile"
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
