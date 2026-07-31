"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { MarketMap } from "@/components/sections/market-map";
import { useLanguage } from "@/lib/i18n";

export function Story() {
  const { t } = useLanguage();

  return (
    <section id="storia" className="relative bg-background py-12 sm:py-28 lg:py-32">
      <Container>
        <div className="grid items-center gap-8 sm:gap-14 lg:grid-cols-2 lg:gap-16">
          {/* Testo */}
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t.story.overline}
            </p>
            <h2 className="mt-4 font-display text-3xl leading-[1.1] sm:mt-5 sm:text-5xl">
              {t.story.titleLine1}
              <br />
              {t.story.titleLine2}
            </h2>
            <div className="mt-5 h-[3px] w-14 rounded-full bg-primary sm:mt-6" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
              {t.story.body}
            </p>

            <dl className="mt-6 grid grid-cols-3 gap-4 sm:mt-10 sm:flex sm:flex-wrap sm:gap-x-10 sm:gap-y-6">
              {t.story.stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="text-2xl font-bold sm:text-4xl">
                    <CountUp value={stat.value} />
                  </dd>
                  <dt className="mt-1 text-xs leading-tight text-primary sm:text-sm">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* Mappa dei mercati con card flottante */}
          <Reveal delay={120} className="relative">
            <MarketMap label={t.story.imageAlt} className="w-full" />

            <div className="animate-float absolute -bottom-6 left-6 rounded-2xl bg-white px-6 py-4 shadow-2xl shadow-black/40">
              <p className="text-xs text-neutral-500">{t.story.cardLabel}</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900">
                <CountUp value={t.story.cardValue} />
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
