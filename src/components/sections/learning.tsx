"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/lib/i18n";

// Emoji per ciascuna card (nell'ordine di t.learning.cards).
const EMOJI = ["📚", "🎥", "🏫"];

export function Learning() {
  const { t } = useLanguage();

  return (
    <section
      id="learning"
      className="relative bg-background py-20 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal className="flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {t.learning.overline}
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl leading-tight sm:text-5xl">
            {t.learning.title}
          </h2>
          <p className="mt-5 max-w-2xl text-center text-lg text-primary sm:mt-4 sm:text-xl">
            {t.learning.subtitle}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:mt-16 lg:grid-cols-3">
          {t.learning.cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 90} className="h-full">
              <div className="h-full rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-6 shadow-lg shadow-black/20 transition-colors duration-200 hover:border-white/10 sm:p-7">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                    <span aria-hidden>{EMOJI[i] ?? EMOJI[0]}</span>
                  </div>
                  <span className="rounded-full bg-[#FF3D9A]/15 px-3 py-1 text-xs font-semibold text-[#FF3D9A]">
                    {card.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground sm:text-xl">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
