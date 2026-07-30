"use client";

import { Container } from "@/components/ui/container";
import { StoreButtons } from "@/components/ui/store-buttons";
import { Reveal } from "@/components/ui/reveal";
import { PhoneParallax } from "@/components/sections/phone-parallax";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const CARD_TITLE_CLASSES = ["text-foreground", "text-primary"];

export function About() {
  const { t } = useLanguage();

  return (
    <section
      id="cos-e-finzy"
      className="relative bg-background py-20 sm:py-28 lg:py-32"
    >
      {/* iPhone decorativi ai lati, tra sfondo e contenuto */}
      <PhoneParallax />

      <Container className="relative z-10 flex flex-col items-center">
        <Reveal className="flex w-full flex-col items-center">
          <h2 className="text-center font-display text-4xl leading-tight sm:text-5xl">
            {t.about.title}
          </h2>
          <p className="mt-5 max-w-2xl text-center text-lg text-primary sm:mt-4 sm:text-xl">
            {t.about.subtitle}
          </p>
        </Reveal>

        {/* Box affiancati al centro, tra i due iPhone in parallasse */}
        <Reveal delay={100} className="mt-14 w-full max-w-4xl lg:mt-16">
          <div className="grid gap-5 px-4 sm:grid-cols-2 sm:px-0">
            {t.about.cards.map((card, i) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-navy/40 p-5 sm:p-8"
              >
                <h3
                  className={cn(
                    "text-base font-semibold sm:text-xl",
                    CARD_TITLE_CLASSES[i],
                  )}
                >
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Download sotto la sezione */}
        <Reveal delay={120} className="w-full">
          <StoreButtons className="mt-16 lg:mt-20" />
        </Reveal>
      </Container>
    </section>
  );
}
