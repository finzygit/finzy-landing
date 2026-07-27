"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

export type Trend = "up" | "down";

function Face({
  label,
  title,
  trend,
}: {
  label: string;
  title: string;
  trend: Trend;
}) {
  const Icon = trend === "up" ? TrendingUp : TrendingDown;
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
      <Icon
        className={trend === "up" ? "text-[#7cf56b]" : "text-negative"}
        strokeWidth={2}
        size={22}
      />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm leading-snug text-foreground">{title}</p>
      </div>
    </div>
  );
}

/**
 * Chip che ruota come un cubo su asse X ogni `intervalMs`: la faccia inferiore
 * sale al posto di quella frontale rivelando la tagline successiva, poi il cubo
 * torna a 0° istantaneamente per un ciclo continuo. Rispetta reduced-motion.
 */
export function FlipCard({
  label,
  titles,
  trends,
  intervalMs = 5000,
  delayMs = 0,
}: {
  label: string;
  titles: string[];
  trends: Trend[];
  intervalMs?: number;
  delayMs?: number;
}) {
  const n = titles.length;
  const [current, setCurrent] = useState(0);
  const [flip, setFlip] = useState(false);
  const [snap, setSnap] = useState(false);
  const snapRaf = useRef<number | null>(null);
  const next = (current + 1) % n;

  useEffect(() => {
    if (n <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => setFlip(true), intervalMs);
    }, delayMs);

    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [n, intervalMs, delayMs]);

  useEffect(
    () => () => {
      if (snapRaf.current) cancelAnimationFrame(snapRaf.current);
    },
    [],
  );

  const handleEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "transform" || !flip) return;
    // La faccia "bottom" è ora davanti: la promuovo a corrente e torno a 0°
    // senza transizione, così il salto -90°→0° è invisibile.
    setSnap(true);
    setFlip(false);
    setCurrent((c) => (c + 1) % n);
    snapRaf.current = requestAnimationFrame(() =>
      requestAnimationFrame(() => setSnap(false)),
    );
  };

  return (
    <div className="flip-scene h-32 w-[8.5rem] sm:w-40">
      <div
        className="flip-cube"
        data-flip={flip ? "true" : undefined}
        data-snap={snap ? "true" : undefined}
        onTransitionEnd={handleEnd}
      >
        <div className="flip-face flip-face-front">
          <Face
            label={label}
            title={titles[current]}
            trend={trends[current] ?? "up"}
          />
        </div>
        <div className="flip-face flip-face-bottom">
          <Face
            label={label}
            title={titles[next]}
            trend={trends[next] ?? "up"}
          />
        </div>
      </div>
    </div>
  );
}
