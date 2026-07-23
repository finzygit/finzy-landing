"use client";

import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { useLanguage } from "@/lib/i18n";

export function Story() {
  const { t } = useLanguage();

  return (
    <section id="storia" className="relative bg-background py-20 sm:py-28 lg:py-32">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          {/* Testo */}
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t.story.overline}
            </p>
            <h2 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              {t.story.titleLine1}
              <br />
              {t.story.titleLine2}
            </h2>
            <div className="mt-6 h-[3px] w-14 rounded-full bg-primary" />
            <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
              {t.story.body}
            </p>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
              {t.story.stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="text-3xl font-bold sm:text-4xl">
                    <CountUp value={stat.value} />
                  </dd>
                  <dt className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* Immagine con card flottante */}
          <Reveal delay={120} className="relative">
            <div className="relative aspect-[6/5] w-full overflow-hidden rounded-3xl">
              <Image
                src="/corals.webp"
                alt={t.story.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
              />
            </div>

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
