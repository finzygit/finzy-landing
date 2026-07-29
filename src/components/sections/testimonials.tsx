"use client";

import { Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/lib/i18n";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Testimonials() {
  const { t } = useLanguage();

  return (
    <section
      id="testimonianze"
      className="relative bg-background py-20 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal className="flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {t.testimonials.overline}
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl leading-tight sm:text-5xl">
            {t.testimonials.title}
          </h2>
          <p className="mt-4 max-w-2xl text-center text-lg text-primary sm:text-xl">
            {t.testimonials.subtitle}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:mt-16 lg:grid-cols-3">
          {t.testimonials.items.map((item, i) => (
            <Reveal key={item.name} delay={i * 90} className="h-full">
              <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-6 shadow-lg shadow-black/20 sm:p-7">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className="h-4 w-4 fill-[#FF3D9A] text-[#FF3D9A]"
                    />
                  ))}
                </div>
                <p className="mt-4 flex-1 leading-relaxed text-foreground/90">
                  “{item.quote}”
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-[#FF3D9A]/40 text-sm font-bold text-white">
                    {initials(item.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
