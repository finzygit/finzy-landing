"use client";

import { useEffect, useRef, useState } from "react";

// Colonna verticale delle cifre: lo 0 finale serve al "giro completo".
const REEL = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const EASING = "cubic-bezier(0.16, 1, 0.3, 1)"; // easeOutExpo: frena come una slot

/**
 * Anima un valore numerico con effetto "odometro": ogni cifra scorre da 0 al
 * suo valore, una alla volta partendo da destra. Se una cifra è 0 compie un
 * giro completo. Preserva prefissi/suffissi non numerici (es. "250+", "60 sec",
 * "1 min"). Rispetta prefers-reduced-motion (mostra subito il valore finale).
 */
export function CountUp({
  value,
  className,
  duration = 2400,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const match = value.match(/^(\D*)(\d+)(.*)$/);
  const digits = match ? match[2] : "";
  // Durata per singola cifra (il totale scala col numero di cifre, con limiti).
  const stepMs = Math.min(950, Math.max(450, duration / (digits.length || 1)));

  const ref = useRef<HTMLSpanElement>(null);
  // offset[i] = indice di cella mostrato dalla cifra i (0 = "0").
  const [offsets, setOffsets] = useState<number[]>(() =>
    Array(digits.length).fill(0),
  );

  useEffect(() => {
    if (!match) return;
    const el = ref.current;
    if (!el) return;

    // Nessuna animazione: mostra subito il valore finale.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOffsets([...digits].map(Number));
      return;
    }

    setOffsets(Array(digits.length).fill(0));
    const timers: ReturnType<typeof setTimeout>[] = [];
    // La cifra successiva parte prima che la precedente finisca (~30% di overlap)
    // per rendere più fluido il passaggio da una cifra all'altra.
    const stagger = stepMs * 0.7;

    const run = () => {
      [...digits].forEach((d, i) => {
        const n = Number(d);
        const target = n === 0 ? 10 : n; // 0 => giro completo fino allo 0 finale
        const fromRight = digits.length - 1 - i; // le unità partono per prime
        timers.push(
          setTimeout(() => {
            setOffsets((prev) => {
              const next = [...prev];
              next[i] = target;
              return next;
            });
          }, fromRight * stagger),
        );
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!match) {
    return <span className={className}>{value}</span>;
  }

  const prefix = match[1];
  const suffix = match[3];
  // Difende da cambi di lingua (lunghezza diversa) prima che l'effetto giri.
  const reels = [...digits].map((_, i) => offsets[i] ?? 0);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{value}</span>
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "flex-end",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {prefix && <span style={{ whiteSpace: "pre" }}>{prefix}</span>}
        {reels.map((offset, i) => (
          <span
            key={i}
            style={{ display: "inline-block", height: "1em", overflow: "hidden" }}
          >
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                transform: `translateY(-${offset}em)`,
                transition: `transform ${stepMs}ms ${EASING}`,
                willChange: "transform",
              }}
            >
              {REEL.map((n, j) => (
                <span key={j} style={{ height: "1em" }}>
                  {n}
                </span>
              ))}
            </span>
          </span>
        ))}
        {suffix && <span style={{ whiteSpace: "pre" }}>{suffix}</span>}
      </span>
    </span>
  );
}
