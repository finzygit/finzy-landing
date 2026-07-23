"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Anima un valore numerico da 0 al suo target quando entra nel viewport.
 * Preserva prefissi/suffissi non numerici (es. "200+", "60 sec", "1 min").
 * Rispetta prefers-reduced-motion (mostra subito il valore finale).
 */
export function CountUp({
  value,
  className,
  duration = 1200,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const match = value.match(/^(\D*)(\d+)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(
    match ? `${match[1]}0${match[3]}` : value,
  );

  useEffect(() => {
    if (!match) {
      setDisplay(value);
      return;
    }

    const prefix = match[1];
    const target = parseInt(match[2], 10);
    const suffix = match[3];
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    let start = 0;

    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(`${prefix}${Math.round(eased * target)}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          raf = requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
