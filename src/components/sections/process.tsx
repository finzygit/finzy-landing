"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/lib/i18n";

// Numero + emoji per ciascuno step (nell'ordine di t.process.steps).
const STEPS = [
  { num: "01", emoji: "📝" },
  { num: "02", emoji: "⚙️" },
  { num: "03", emoji: "📡" },
  { num: "04", emoji: "🚀" },
];

// Durata del "disegno" del percorso su mobile: i pallini compaiono in sync,
// sfalsati lungo questo intervallo man mano che la linea li raggiunge.
const DRAW_MS = 1800;

export function Process() {
  const { t } = useLanguage();
  const steps = t.process.steps;

  // Connettore curvo (solo mobile): calcola il percorso a serpentina passando
  // per i centri reali dei pallini, così funziona con testi di qualsiasi altezza.
  const wrapRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [curve, setCurve] = useState<{ w: number; h: number; d: string } | null>(
    null,
  );
  // Animazione "disegno" del percorso quando la sezione entra in vista.
  const [drawn, setDrawn] = useState(false);
  const [instant, setInstant] = useState(false);
  // Su mobile i pallini si sfalsano lungo tutta la durata del disegno;
  // su desktop (nessuna linea) restano una comparsa rapida a cascata.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const compute = () => {
      // Solo sotto lg (griglia orizzontale su desktop → nessuna curva).
      if (!window.matchMedia("(max-width: 1023px)").matches) {
        setCurve(null);
        return;
      }
      const box = wrap.getBoundingClientRect();
      const pts = circleRefs.current
        .map((c) => {
          if (!c) return null;
          const r = c.getBoundingClientRect();
          return {
            x: r.left - box.left + r.width / 2,
            top: r.top - box.top,
            bottom: r.top - box.top + r.height,
          };
        })
        .filter(Boolean) as { x: number; top: number; bottom: number }[];

      if (pts.length < 2) {
        setCurve(null);
        return;
      }

      const W = box.width;
      const H = box.height;
      let d = "";
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const Ra = (a.bottom - a.top) / 2;
        const Rb = (b.bottom - b.top) / 2;
        const cyA = a.top + Ra;
        const cyB = b.top + Rb;
        // Bombatura alternata: 01→02 a destra, 02→03 a sinistra, ecc.
        const dir = i % 2 === 0 ? 1 : -1;
        const ctrl = dir > 0 ? W * 1.02 : W * -0.02;
        // Estremi al CENTRO dei pallini: la linea passa sotto il cerchio ed esce
        // dal lato opposto (effetto "infilata"). I controlli, larghi e appena
        // sotto/sopra il bordo, la fanno uscire in basso-lato ed entrare in alto-lato.
        d += `M ${a.x} ${cyA} C ${ctrl} ${cyA + Ra * 1.35}, ${ctrl} ${cyB - Rb * 1.35}, ${b.x} ${cyB} `;
      }
      setCurve({ w: W, h: H, d });
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [steps.length]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInstant(true);
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="processo"
      className="relative bg-background py-20 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal className="flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {t.process.overline}
          </p>
          <h2 className="mt-4 text-center font-display text-4xl leading-tight sm:text-5xl">
            {t.process.subtitle}
          </h2>
        </Reveal>

        <div
          ref={wrapRef}
          className="relative mt-14 flex flex-col items-center gap-20 sm:mt-16 lg:mt-20 lg:grid lg:grid-cols-4 lg:gap-8"
        >
          {/* Connettore curvo a serpentina (mobile/tablet) */}
          {curve && (
            <svg
              aria-hidden
              viewBox={`0 0 ${curve.w} ${curve.h}`}
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full lg:hidden"
            >
              <path
                d={curve.d}
                pathLength={1}
                fill="none"
                stroke="#20e5d1"
                strokeOpacity="0.55"
                strokeWidth="2"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: drawn ? 0 : 1,
                  transition: instant
                    ? "none"
                    : `stroke-dashoffset ${DRAW_MS}ms linear`,
                }}
              />
            </svg>
          )}

          {/* Connessione orizzontale (desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[12%] top-10 z-0 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block"
          />

          {steps.map((step, i) => {
            const meta = STEPS[i] ?? STEPS[0];
            // Ritardo di comparsa: su mobile allineato al fronte della linea
            // (0 → DRAW_MS), su desktop cascata veloce.
            const delay = isMobile
              ? (i / Math.max(1, steps.length - 1)) * DRAW_MS
              : i * 90;
            const popStyle: CSSProperties = {
              opacity: drawn ? 1 : 0,
              transform: drawn ? "scale(1)" : "scale(0.4)",
              transition: instant
                ? "none"
                : "opacity 0.3s ease-out, transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
              transitionDelay: instant ? "0ms" : `${delay}ms`,
            };
            const textStyle: CSSProperties = {
              opacity: drawn ? 1 : 0,
              transform: drawn ? "none" : "translateY(8px)",
              transition: instant
                ? "none"
                : "opacity 0.4s ease-out, transform 0.4s ease-out",
              transitionDelay: instant ? "0ms" : `${delay + 120}ms`,
            };
            return (
              <div
                key={step.title}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="relative z-10 mb-8">
                  {/* slot statico: misurato per la curva, mai trasformato */}
                  <div
                    ref={(el) => {
                      circleRefs.current[i] = el;
                    }}
                    className="relative h-20 w-20"
                  >
                    {/* gruppo che fa "pop" in sync con la linea */}
                    <div className="relative h-20 w-20" style={popStyle}>
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/60 bg-[#0b1018] text-3xl shadow-lg shadow-black/30">
                        <span aria-hidden>{meta.emoji}</span>
                      </div>
                      <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF3D9A] text-xs font-bold text-white shadow-md">
                        {meta.num}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="max-w-[13rem]" style={textStyle}>
                  <h3 className="text-lg font-bold text-foreground sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:mt-3">
                    {step.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
