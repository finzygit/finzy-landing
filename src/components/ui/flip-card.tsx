"use client";

import { useEffect, useRef, useState } from "react";
import { Newspaper } from "lucide-react";

export type FlipCardItem = {
  key: string | number;
  label: string;
  title: string;
  /** Lingua del titolo, quando è diversa da quella della pagina. */
  titleLang?: string;
};

function Face({ item }: { item: FlipCardItem }) {
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
      <Newspaper className="text-accent" strokeWidth={2} size={22} />
      <div>
        <p className="truncate text-xs text-muted-foreground">{item.label}</p>
        <p
          lang={item.titleLang}
          title={item.title}
          className="mt-1 line-clamp-3 text-sm leading-snug text-foreground"
        >
          {item.title}
        </p>
      </div>
    </div>
  );
}

/**
 * Card che ruota come un cubo su asse X ogni `intervalMs`: la faccia inferiore
 * sale al posto di quella frontale rivelando la voce successiva, poi il cubo
 * torna a 0° istantaneamente per un ciclo continuo. Si ferma finché il
 * puntatore è sopra la card, così si riesce a leggere. Rispetta reduced-motion.
 */
export function FlipCard({
  items,
  intervalMs = 5000,
  delayMs = 0,
}: {
  items: FlipCardItem[];
  intervalMs?: number;
  delayMs?: number;
}) {
  const n = items.length;
  const [current, setCurrent] = useState(0);
  const [flip, setFlip] = useState(false);
  const [snap, setSnap] = useState(false);
  const snapRaf = useRef<number | null>(null);
  const paused = useRef(false);
  const next = (current + 1) % n;

  useEffect(() => {
    if (n <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        if (!paused.current) setFlip(true);
      }, intervalMs);
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

  if (n === 0) return null;

  return (
    <div
      className="flip-scene h-36 min-w-0 flex-1 lg:w-52 lg:flex-none xl:w-60"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div
        className="flip-cube"
        data-flip={flip ? "true" : undefined}
        data-snap={snap ? "true" : undefined}
        onTransitionEnd={handleEnd}
      >
        <div className="flip-face flip-face-front">
          <Face item={items[current]} />
        </div>
        {/* Solo scenografia: la voce successiva non va letta due volte. */}
        <div className="flip-face flip-face-bottom" aria-hidden>
          <Face item={items[next]} />
        </div>
      </div>
    </div>
  );
}
