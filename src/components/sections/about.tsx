"use client";

import Image from "next/image";
import { Container } from "@/components/ui/container";
import { StoreButtons } from "@/components/ui/store-buttons";
import { Reveal } from "@/components/ui/reveal";
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
      <Container className="flex flex-col items-center">
        <Reveal className="flex w-full flex-col items-center">
          <h2 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
            {t.about.title}
          </h2>
          <p className="mt-4 max-w-2xl text-center text-lg text-primary sm:text-xl">
            {t.about.subtitle}
          </p>
        </Reveal>

        {/* Due colonne: screenshot a sinistra, box impilati a destra */}
        <Reveal
          delay={100}
          className="mt-14 grid w-full items-center gap-10 lg:mt-16 lg:grid-cols-[1.35fr_1fr] lg:gap-14"
        >
          <div className="flex justify-center lg:justify-start">
            <Image
              src="/screenshot.png"
              alt="Le schermate dell'app Finzy: dettaglio titolo, Wallet e sezione Impara"
              width={1536}
              height={1152}
              sizes="(max-width: 1024px) 100vw, 720px"
              className="h-auto w-full max-w-2xl"
            />
          </div>

          <div className="flex flex-col gap-5">
            {t.about.cards.map((card, i) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-navy/40 p-7 sm:p-8"
              >
                <h3
                  className={cn(
                    "text-lg font-semibold sm:text-xl",
                    CARD_TITLE_CLASSES[i],
                  )}
                >
                  {card.title}
                </h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
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
