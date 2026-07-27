"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LANGUAGES, useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Selettore lingua in header: globo + bandiera + sigla con dropdown ancorato
 * (English, Italiano, Español, Français, Português). Chiude su click fuori/Esc.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Globe className="h-4 w-4 text-foreground/60" strokeWidth={1.75} />
        <span aria-hidden className="text-base leading-none">
          {active.flag}
        </span>
        <span>{active.short}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-foreground/60 transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>

      <div
        role="listbox"
        aria-label="Language"
        className={cn(
          "absolute right-0 top-full z-[80] mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1018] p-1.5 shadow-2xl transition-all duration-200 ease-out",
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0",
        )}
      >
        {LANGUAGES.map((l) => {
          const selected = l.code === lang;
          return (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                selected
                  ? "text-foreground"
                  : "text-foreground/75 hover:bg-white/5 hover:text-foreground",
              )}
            >
              <span aria-hidden className="text-base leading-none">
                {l.flag}
              </span>
              <span className="flex-1 text-left">{l.name}</span>
              {selected && (
                <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
