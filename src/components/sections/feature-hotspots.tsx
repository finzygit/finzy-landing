"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Spot = { x: number; y: number; side: "left" | "right" };

/**
 * Posizioni dei pallini sul cordone del corallo, in frazione dell'immagine
 * hero (0–1, non del riquadro), e lato del tooltip.
 */
const SPOTS: Spot[] = [
  { x: 0.16, y: 0.712, side: "right" },
  { x: 0.37, y: 0.441, side: "right" },
  { x: 0.589, y: 0.579, side: "left" },
  { x: 0.825, y: 0.645, side: "left" },
];

// Devono rispecchiare come hero.tsx disegna /hero-img.png da lg in su:
// proporzioni dell'immagine e `lg:-translate-y-[15%]`.
const IMAGE_RATIO = (1672 / 941).toFixed(4);
const IMAGE_SHIFT = 15;

/**
 * Converte un punto dell'immagine in coordinate del riquadro hero, rifacendo
 * il conto di `object-cover object-center` con le container query units: così
 * il pallino resta sullo stesso punto del corallo a ogni dimensione. Il clamp
 * lo tiene a schermo quando l'immagine viene tagliata ai lati.
 */
function spotPosition({ x, y }: Spot): CSSProperties {
  const imageWidth = `max(100cqw, ${IMAGE_RATIO} * 100cqh)`;
  const imageHeight = `max(100cqh, 100cqw / ${IMAGE_RATIO})`;
  return {
    left: `clamp(4rem, calc(50cqw + ${(x - 0.5).toFixed(4)} * ${imageWidth}), calc(100cqw - 4rem))`,
    top: `calc(${50 - IMAGE_SHIFT}cqh + ${(y - 0.5).toFixed(4)} * ${imageHeight})`,
  };
}

export function FeatureHotspots() {
  const { t } = useLanguage();
  const features = t.hero.features;
  const [pinned, setPinned] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = pinned ?? hovered;

  // Con un pallino "fissato" al click: chiudi cliccando fuori o con Esc.
  useEffect(() => {
    if (pinned === null) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPinned(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(null);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-[15] hidden [container-type:size] lg:block"
    >
      {SPOTS.map((spot, i) => {
        const feature = features[i];
        if (!feature) return null;
        const open = active === i;
        return (
          <div
            key={feature.title}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
            style={spotPosition(spot)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
          >
            <button
              type="button"
              aria-label={feature.title}
              aria-expanded={open}
              onClick={() => setPinned((p) => (p === i ? null : i))}
              className="relative flex h-8 w-8 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3D9A] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* Onde radar concentriche (due, sfalsate) */}
              <span
                aria-hidden
                className="animate-hotspot-ping absolute inset-0 rounded-full border border-[#FF3D9A]/70"
              />
              <span
                aria-hidden
                className="animate-hotspot-ping absolute inset-0 rounded-full border border-[#FF3D9A]/50"
                style={{ animationDelay: "1.2s" }}
              />
              {/* Puntino pieno al centro */}
              <span
                aria-hidden
                className={cn(
                  "relative inline-flex rounded-full bg-[#FF3D9A] shadow-[0_0_12px_3px_rgba(255,61,154,0.75)] transition-all duration-200",
                  open ? "h-4 w-4 ring-2 ring-[#FF3D9A]/50" : "h-3 w-3",
                )}
              />
            </button>

            <div
              role="tooltip"
              className={cn(
                "absolute top-1/2 w-60 max-w-[72vw] -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0b1018]/95 p-4 text-left shadow-2xl backdrop-blur-md transition-all duration-200",
                spot.side === "right"
                  ? "left-[calc(100%+14px)]"
                  : "right-[calc(100%+14px)]",
                open
                  ? "visible translate-x-0 opacity-100"
                  : cn(
                      "invisible opacity-0",
                      spot.side === "right" ? "-translate-x-1" : "translate-x-1",
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
