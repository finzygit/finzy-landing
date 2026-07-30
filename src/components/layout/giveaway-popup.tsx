"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Popup giveaway: tema turchese con bordo fucsia luminoso che scorre (classe
 * `.giveaway-card` in globals.css). Si apre quando la 4ª sezione (Story) entra
 * in vista, a ogni caricamento della pagina. Portal su body.
 */
export function GiveawayPopup() {
  const { t } = useLanguage();
  const g = t.giveaway;
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const target = document.getElementById("storia");
    if (!target) return;
    let triggered = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !triggered) {
          triggered = true;
          setOpen(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => setOpen(false);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        aria-hidden
        onClick={close}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={g.title}
        className={cn(
          "giveaway-card relative w-full max-w-sm transition-all duration-300 ease-out",
          open ? "translate-y-0 scale-100" : "translate-y-4 scale-95",
        )}
      >
        <div className="relative z-[2] overflow-hidden rounded-[calc(1.5rem-2px)] bg-[#08141d] px-6 py-7 text-center sm:px-8">
          <button
            type="button"
            aria-label={g.close}
            onClick={close}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {g.overline}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-[#FF3D9A]">{g.title}</h3>
          <p className="mx-auto mt-4 max-w-sm leading-relaxed text-foreground/85">
            {g.bodyPre}
            <span className="font-semibold text-[#FF3D9A]">{g.highlight}</span>
            {g.bodyPost}
          </p>
          <Link
            href="#contatti"
            onClick={close}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {g.cta}
          </Link>
          <p className="mt-5 text-xs text-muted-foreground">{g.fine}</p>

          <details className="mt-3 text-left">
            <summary className="cursor-pointer list-none text-center text-xs font-medium text-primary/80 transition-colors hover:text-primary">
              {g.rulesLabel}
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {g.rules}
            </p>
          </details>
        </div>
      </div>
    </div>,
    document.body,
  );
}
