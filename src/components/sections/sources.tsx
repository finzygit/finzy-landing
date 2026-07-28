"use client";

import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/lib/i18n";

/**
 * Wordmark testuali dei partner/fonti, ognuno con un font che richiama il logo
 * reale del brand (heavy sans per benzinga/massive/Adnkronos, serif editoriale
 * per Forbes e la Repubblica). Scorrono in continuo come il ticker di mercato.
 */
const BRANDS: { key: string; node: ReactNode }[] = [
  {
    key: "benzinga",
    node: (
      <span className="font-sans font-extrabold lowercase tracking-tight">
        benzinga
      </span>
    ),
  },
  {
    key: "mt-newswires",
    node: (
      <span className="font-sans">
        <span className="font-extrabold">MT</span>
        <span className="font-normal"> Newswires</span>
      </span>
    ),
  },
  {
    key: "massive",
    node: (
      <span className="font-sans font-extrabold lowercase tracking-tight">
        massive.com
      </span>
    ),
  },
  {
    key: "adnkronos",
    node: (
      <span className="font-sans font-extrabold tracking-tight">Adnkronos</span>
    ),
  },
  {
    key: "forbes",
    node: (
      <span className="font-serif font-black tracking-tight">Forbes</span>
    ),
  },
  {
    key: "repubblica",
    node: (
      <span className="font-serif">
        <span className="font-normal">la </span>
        <span className="font-black">Repubblica</span>
      </span>
    ),
  },
  {
    // Logo reale: serif elegante, "SanCarlo" (bordeaux) unito a "Invest" (grigio) + ®.
    key: "san-carlo-invest",
    node: (
      <span className="font-serif font-bold tracking-tight">
        <span className="text-white/65">SanCarlo</span>
        <span className="text-white/40">Invest</span>
        <sup className="ml-0.5 align-super text-[0.4em] font-normal text-white/40">
          ®
        </sup>
      </span>
    ),
  },
];

export function Sources() {
  const { t } = useLanguage();

  return (
    <section id="fonti" className="relative bg-background py-20 sm:py-28 lg:py-32">
      <Container className="flex flex-col items-center">
        <Reveal className="flex w-full flex-col items-center">
          <h2 className="text-center font-serif text-4xl leading-tight sm:text-5xl">
            {t.sources.title}
          </h2>
          <p className="mt-4 max-w-2xl text-center text-lg text-primary sm:text-xl">
            {t.sources.subtitle}
          </p>
        </Reveal>
      </Container>

      {/* Fascia scorrevole dei wordmark (a tutta larghezza, con dissolvenza ai bordi) */}
      <div className="mt-12 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)] sm:mt-16">
        <div className="flex w-max animate-marquee items-center gap-16 text-2xl text-white/50 sm:gap-24 sm:text-3xl">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span
              key={`${b.key}-${i}`}
              aria-hidden={i >= BRANDS.length}
              className="whitespace-nowrap leading-none transition-colors duration-200 hover:text-white/80"
            >
              {b.node}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
