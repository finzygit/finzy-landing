"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Marker = {
  /** Sigla della borsa mostrata nella pillola. */
  label: string;
  /** Posizione della città in % del riquadro mappa. */
  left: string;
  top: string;
  /** Lato in cui esce la linetta con la pillola. */
  side: "top" | "bottom";
  /** Lunghezza della linetta (px). */
  line: number;
  /** Nasconde il puntino (per borse nella stessa città, es. NASDAQ a NY). */
  hideDot?: boolean;
};

/** Borse monitorate, posizionate sulla città di riferimento. */
const MARKERS: Marker[] = [
  { label: "NYSE", left: "22.4%", top: "25.9%", side: "top", line: 26 }, // New York
  { label: "NASDAQ", left: "22.4%", top: "25.9%", side: "bottom", line: 22, hideDot: true },
  { label: "LSE", left: "41.3%", top: "21%", side: "top", line: 24 }, // Londra
  { label: "Euronext", left: "41.8%", top: "23.3%", side: "bottom", line: 24 }, // Parigi
  { label: "JPX", left: "80.8%", top: "32.3%", side: "top", line: 26 }, // Tokyo
  { label: "SSE", left: "76.8%", top: "36.6%", side: "bottom", line: 24 }, // Shanghai
];

const MAP_MASK: React.CSSProperties = {
  maskImage: "url(/world-map.svg)",
  maskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskImage: "url(/world-map.svg)",
  WebkitMaskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
};

/**
 * Mappa mondo in turchese (silhouette senza sfondo) con pillole che
 * compaiono in cascata sulle città delle principali borse monitorate.
 * Rispetta prefers-reduced-motion (nessuna transizione, pillole subito visibili).
 */
export function MarketMap({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Con prefers-reduced-motion le transizioni sono disattivate via CSS:
    // al primo intersect le pillole compaiono istantaneamente.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={cn("relative", className)}
      style={{ aspectRatio: "1602.714 / 741.713" }}
    >
      {/* Alone morbido dietro la mappa (stessa mask, sfocata) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 blur-2xl"
      >
        <div className="h-full w-full bg-primary" style={MAP_MASK} />
      </div>

      {/* Continenti in turchese: div colorato ritagliato dalla mask SVG */}
      <div
        aria-hidden
        className="absolute inset-0 bg-primary/90"
        style={MAP_MASK}
      />

      {/* Pillole con linetta sulle città delle borse */}
      {MARKERS.map((m, i) => (
        <div
          key={m.label}
          aria-hidden
          className={cn(
            "absolute transition-all duration-500 ease-out motion-reduce:transition-none",
            shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
          style={{ left: m.left, top: m.top, transitionDelay: `${i * 160}ms` }}
        >
          {/* Puntino sulla città, con onda radar in stile hotspot */}
          {!m.hideDot && (
            <span className="absolute flex h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <span className="animate-hotspot-ping absolute inset-0 rounded-full border border-[#FF3D9A]/70" />
              <span className="absolute inset-0 rounded-full bg-[#FF3D9A] shadow-[0_0_10px_2px_rgba(255,61,154,0.7)]" />
            </span>
          )}

          {/* Linetta + pillola, sopra o sotto il puntino */}
          <div
            className={cn(
              "absolute left-0 flex -translate-x-1/2 flex-col items-center",
              m.side === "top" ? "bottom-[3px]" : "top-[3px]",
            )}
          >
            {m.side === "bottom" && (
              <span className="w-px bg-white/40" style={{ height: m.line }} />
            )}
            <span className="whitespace-nowrap rounded-full border border-white/10 bg-[#0b1018]/95 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-foreground shadow-lg backdrop-blur-md sm:text-xs">
              {m.label}
            </span>
            {m.side === "top" && (
              <span className="w-px bg-white/40" style={{ height: m.line }} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
