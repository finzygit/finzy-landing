"use client";

import Image from "next/image";
import { MarketTicker } from "@/components/layout/market-ticker";
import { SiteHeader } from "@/components/layout/site-header";
import { FeatureHotspots } from "@/components/sections/feature-hotspots";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { FlipCard, type FlipCardItem } from "@/components/ui/flip-card";
import { useLanguage, type Lang } from "@/lib/i18n";
import type { NewsItem } from "@/lib/news";
import type { TickerQuote } from "@/lib/ticker";

/** Card affiancate nel hero. Le notizie si alternano tra una e l'altra. */
const CARD_COUNT = 2;

/**
 * Distribuisce le notizie sulle card, la più recente nella prima. Con meno
 * notizie che card restano solo le card che hanno qualcosa da mostrare.
 */
function toCards(news: NewsItem[], lang: Lang): FlipCardItem[][] {
  // Fuso fisso: server e browser devono scrivere la stessa data.
  const date = new Intl.DateTimeFormat(lang, {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Rome",
  });
  // Il backend traduce solo in italiano e in inglese.
  const titleLang = lang === "it" ? "it" : "en";

  const cards: FlipCardItem[][] = Array.from({ length: CARD_COUNT }, () => []);
  news.forEach((item, i) => {
    const day = date.format(new Date(item.publishedAt));
    cards[i % CARD_COUNT].push({
      key: item.id,
      label: item.source ? `${item.source} · ${day}` : day,
      title: item.title[titleLang],
      titleLang: titleLang === lang ? undefined : titleLang,
    });
  });
  return cards.filter((items) => items.length > 0);
}

export function Hero({
  quotes,
  news,
}: {
  quotes: TickerQuote[];
  news: NewsItem[];
}) {
  const { t, lang } = useLanguage();
  const cards = toCards(news, lang);

  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <MarketTicker quotes={quotes} />

      <div className="relative flex flex-1 flex-col">
        {/* Immagine di sfondo allineata in alto (spostata su, cielo clippato)
            + sfumatura che la fonde sul nero verso il basso.
            Sotto lg il container è più alto e più vicino all'header (top-[2svh],
            h-[50svh]) così il corallo occupa più schermo ed è meno "in
            lontananza"; sfuma sul nero prima che inizi il contenuto, così
            card e statistiche non si sovrappongono ai coralli.
            I pallini di FeatureHotspots sono ancorati a punti di questa
            immagine: se cambiano immagine, riquadro, object-fit o translate,
            aggiornare anche feature-hotspots.tsx. */}
        <div className="absolute inset-x-0 top-[2svh] h-[50svh] overflow-hidden lg:top-0 lg:bottom-0 lg:h-auto">
          <Image
            src="/hero-img.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center lg:-translate-y-[15%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent via-25% to-background to-[70%] lg:from-background/55" />
        </div>

        {/* Pallini pulsanti con le funzionalità dell'app */}
        <FeatureHotspots />

        {/* z-[45]: il dropdown lingua resta sopra il QR fisso (z-40) e sotto
            la StickyNav (z-50). */}
        <SiteHeader className="relative z-[45]" />

        {/* Contenuto in basso: box a sinistra, statistiche a destra.
            Sotto lg parte dopo la zona sfumata dell'immagine (niente overlap). */}
        <div className="relative z-10 mt-[28svh] w-full px-5 pb-8 sm:px-8 lg:mt-auto lg:px-12 lg:pb-10">
          <Reveal
            delay={150}
            className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8"
          >
            {cards.length > 0 && (
              <div className="flex gap-3 sm:gap-4">
                {cards.map((items) => (
                  <FlipCard key={items[0].key} items={items} />
                ))}
              </div>
            )}

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
