"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Emoji + colore badge per ciascuna card (nell'ordine di t.features.items).
const ICONS = [
  { emoji: "📰", bg: "bg-blue-500/10" },
  { emoji: "⚙️", bg: "bg-orange-500/10" },
  { emoji: "📈", bg: "bg-red-500/10" },
  { emoji: "🤖", bg: "bg-[#7cf56b]/10" },
  { emoji: "⚡", bg: "bg-amber-400/10" },
  { emoji: "🎯", bg: "bg-primary/10" },
];

export function Features() {
  const { t } = useLanguage();

  return (
    <section
      id="funzionalita"
      className="relative bg-background py-20 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal className="flex flex-col items-center">
          <h2 className="text-center font-serif text-4xl leading-tight sm:text-5xl">
            {t.features.title}
          </h2>
          <p className="mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {t.features.subtitle}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((item, i) => {
            const { emoji, bg } = ICONS[i] ?? ICONS[0];
            return (
              <Reveal key={item.title} delay={(i % 3) * 90} className="h-full">
                <div className="h-full rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-6 shadow-lg shadow-black/20 transition-colors duration-200 hover:border-white/10 sm:p-7">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl text-2xl",
                      bg,
                    )}
                  >
                    <span aria-hidden>{emoji}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
