"use client";

import Image from "next/image";
import { MarketTicker } from "@/components/layout/market-ticker";
import { SiteHeader } from "@/components/layout/site-header";
import { FeatureHotspots } from "@/components/sections/feature-hotspots";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { FlipCard, type Trend } from "@/components/ui/flip-card";
import { useLanguage } from "@/lib/i18n";

// Icona (trend) per faccia di ciascuna chip, nell'ordine delle tagline.
const CARD_TRENDS: Trend[][] = [
  ["up", "up", "up"], // Segnali
  ["up", "down", "up"], // Mercati
];

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-background text-foreground">
      <MarketTicker />

      <div className="relative flex flex-1 flex-col">
        {/* Immagine di sfondo + sfumature per la leggibilità */}
        <div className="absolute inset-0">
          <Image
            src="/hero-img.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/0 to-background/95" />
        </div>

        {/* Pallini pulsanti con le funzionalità dell'app */}
        <FeatureHotspots />

        <SiteHeader className="relative z-20" />

        {/* Contenuto in basso: box a sinistra, statistiche a destra */}
        <div className="relative z-10 mt-auto w-full px-5 pb-8 sm:px-8 lg:px-12 lg:pb-10">
          <Reveal
            delay={150}
            className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="flex gap-3 sm:gap-4">
              {t.hero.cards.map((card, i) => (
                <FlipCard
                  key={card.label}
                  label={card.label}
                  titles={card.titles}
                  trends={CARD_TRENDS[i] ?? []}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:flex sm:flex-wrap sm:items-end sm:gap-x-10 lg:justify-end">
              {t.hero.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <CountUp
                    value={stat.value}
                    className="text-3xl font-light text-accent sm:text-4xl"
                  />
                  <span className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
