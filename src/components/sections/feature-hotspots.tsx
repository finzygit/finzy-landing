"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };

type Spot = {
  /** Punto da lg in su. */
  lg: Point;
  /** Sotto lg l'immagine è tagliata ai lati: punto sul tratto che resta a schermo. */
  sm: Point;
  /** Lato del tooltip da lg in su; sotto lg il tooltip sta sotto il pallino. */
  side: "left" | "right";
};

/**
 * Posizioni dei pallini sul cordone del corallo, in frazione dell'immagine
 * hero (0–1, non del riquadro).
 */
const SPOTS: Spot[] = [
  { lg: { x: 0.16, y: 0.712 }, sm: { x: 0.31, y: 0.5 }, side: "right" },
  { lg: { x: 0.37, y: 0.441 }, sm: { x: 0.43, y: 0.47 }, side: "right" },
  { lg: { x: 0.589, y: 0.579 }, sm: { x: 0.56, y: 0.6 }, side: "left" },
  { lg: { x: 0.825, y: 0.645 }, sm: { x: 0.68, y: 0.45 }, side: "left" },
];

// Devono rispecchiare come hero.tsx disegna /hero-img.png: proporzioni
// dell'immagine e `lg:-translate-y-[15%]` (sotto lg non è spostata).
const IMAGE_RATIO = (1672 / 941).toFixed(4);
const IMAGE_SHIFT = 15;

// Il bottone (h-11 w-11) è più grande del pallino: area di tocco di 44px.
const BUTTON_HALF = "1.375rem";
// Tooltip sotto lg: largo al massimo 15rem, sempre dentro lo schermo.
const TIP_WIDTH = "min(15rem, 100cqw - 2rem)";

/**
 * Converte un punto dell'immagine in coordinate del riquadro hero, rifacendo
 * il conto di `object-cover object-center` con le container query units: così
 * il pallino resta sullo stesso punto del corallo a ogni dimensione. Il clamp
 * lo tiene a schermo quando l'immagine viene tagliata ai lati.
 */
function spotPosition({ x, y }: Point, shift: number, margin: string) {
  const imageWidth = `max(100cqw, ${IMAGE_RATIO} * 100cqh)`;
  const imageHeight = `max(100cqh, 100cqw / ${IMAGE_RATIO})`;
  return {
    left: `clamp(${margin}, calc(50cqw + ${(x - 0.5).toFixed(4)} * ${imageWidth}), calc(100cqw - ${margin}))`,
    top: `calc(${50 - shift}cqh + ${(y - 0.5).toFixed(4)} * ${imageHeight})`,
  };
}

/**
 * Variabili CSS lette dalle classi: posizione sotto lg e da lg, e scarto
 * del tooltip sotto lg per centrarlo sul pallino senza uscire dal riquadro.
 */
function spotStyle({ lg, sm }: Spot): CSSProperties {
  const small = spotPosition(sm, 0, "1.5rem");
  const large = spotPosition(lg, IMAGE_SHIFT, "4rem");
  return {
    "--spot-left": small.left,
    "--spot-top": small.top,
    "--spot-left-lg": large.left,
    "--spot-top-lg": large.top,
    "--tip-width": TIP_WIDTH,
    "--tip-left": `calc(clamp(1rem, ${small.left} - ${TIP_WIDTH} / 2, 100cqw - 1rem - ${TIP_WIDTH}) - ${small.left} + ${BUTTON_HALF})`,
  } as CSSProperties;
}

export function FeatureHotspots() {
  const { t } = useLanguage();
  const features = t.hero.features;
  const [pinned, setPinned] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const active = pinned ?? hovered;
  const total = Math.min(SPOTS.length, features.length);

  // Con un pallino "fissato" al click o al tocco: chiudi toccando fuori o con Esc.
  useEffect(() => {
    if (pinned === null) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPinned(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(null);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  // Sotto lg il riquadro coincide con quello dell'immagine in hero.tsx
  // (top-[2svh] h-[50svh]), da lg con tutta l'area del hero.
  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-x-0 top-[2svh] z-[15] h-[50svh] [container-type:size] lg:top-0 lg:bottom-0 lg:h-auto"
    >
      {SPOTS.map((spot, i) => {
        const feature = features[i];
        if (!feature) return null;
        const open = active === i;
        const tipId = `${id}-${i}`;
        return (
          <div
            key={feature.title}
            data-hotspot
            className={cn(
              "pointer-events-auto absolute top-(--spot-top) left-(--spot-left) -translate-x-1/2 -translate-y-1/2 lg:top-(--spot-top-lg) lg:left-(--spot-left-lg)",
              // Il tooltip aperto copre gli altri pallini.
              open && "z-10",
            )}
            style={spotStyle(spot)}
            // Solo il mouse apre al passaggio: col tocco resterebbe aperto.
            onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(i)}
            onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
          >
            <button
              type="button"
              aria-label={t.hero.featureLabel
                .replace("{n}", String(i + 1))
                .replace("{total}", String(total))
                .replace("{title}", feature.title)}
              aria-expanded={open}
              aria-controls={tipId}
              onClick={() => setPinned((p) => (p === i ? null : i))}
              className="relative flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3D9A] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* Onde radar concentriche (due, sfalsate) */}
              <span
                aria-hidden
                className="animate-hotspot-ping absolute inset-1.5 rounded-full border border-[#FF3D9A]/70"
              />
              <span
                aria-hidden
                className="animate-hotspot-ping absolute inset-1.5 rounded-full border border-[#FF3D9A]/50"
                style={{ animationDelay: "1.2s" }}
              />
              {/* Puntino pieno al centro */}
              <span
                aria-hidden
                className={cn(
                  "relative inline-flex rounded-full bg-[#FF3D9A] shadow-[0_0_12px_3px_rgba(255,61,154,0.75)] transition-all duration-200 motion-reduce:transition-none",
                  open ? "h-4 w-4 ring-2 ring-[#FF3D9A]/50" : "h-3 w-3",
                )}
              />
            </button>

            <div
              id={tipId}
              role="tooltip"
              className={cn(
                "absolute top-[calc(100%+0.25rem)] left-(--tip-left) w-(--tip-width) rounded-2xl border border-white/10 bg-[#0b1018]/95 p-4 text-left shadow-2xl backdrop-blur-md transition-all duration-200 motion-reduce:transition-none lg:top-1/2 lg:w-60 lg:-translate-y-1/2",
                spot.side === "right"
                  ? "lg:left-[calc(100%+0.5rem)]"
                  : "lg:right-[calc(100%+0.5rem)] lg:left-auto",
                open
                  ? "visible translate-0 opacity-100"
                  : cn(
                      "invisible -translate-y-1 opacity-0",
                      spot.side === "right"
                        ? "lg:-translate-x-1"
                        : "lg:translate-x-1",
                    ),
              )}
            >
              <span
                aria-hidden
                className="mb-3 inline-flex h-2.5 w-2.5 rounded-full bg-[#FF3D9A] shadow-[0_0_10px_2px_rgba(255,61,154,0.7)]"
              />
              <p className="text-sm font-semibold text-foreground">
                {feature.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
