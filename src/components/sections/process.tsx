"use client";

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

export function Process() {
  const { t } = useLanguage();

  return (
    <section
      id="processo"
      className="relative bg-background py-20 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal className="flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {t.process.overline}
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl leading-tight sm:text-5xl">
            {t.process.title}
          </h2>
          <p className="mt-4 text-center text-lg text-primary sm:text-xl">
            {t.process.subtitle}
          </p>
        </Reveal>

        <div className="relative mt-16 grid gap-y-14 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-x-6">
          {/* Linea di connessione (solo desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[12%] top-10 z-0 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block"
          />

          {t.process.steps.map((step, i) => {
            const meta = STEPS[i] ?? STEPS[0];
            return (
              <Reveal
                key={step.title}
                delay={i * 90}
                className="flex flex-col items-center text-center"
              >
                <div className="relative z-10 mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/60 bg-[#0b1018] text-3xl shadow-lg shadow-black/30">
                    <span aria-hidden>{meta.emoji}</span>
                  </div>
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF3D9A] text-xs font-bold text-white shadow-md">
                    {meta.num}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground sm:text-xl">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
