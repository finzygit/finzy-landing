"use client";

import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Logo = { src: string; alt: string; padClass?: string };

const LOGOS: Logo[] = [
  { src: "/adnkronos-logo.webp", alt: "Adnkronos" },
  { src: "/mtnews-logo.webp", alt: "MT Newswires" },
  { src: "/massive-logo.webp", alt: "Massive" },
  // Logo molto largo: meno padding così riempie di più e non risulta piccolo.
  { src: "/marketstack-logo.png", alt: "MarketStack", padClass: "px-3" },
];

function LogoCard({ src, alt, padClass = "px-8" }: Logo) {
  return (
    <div
      className={cn(
        "flex h-32 items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/20 ring-1 ring-white/10 transition-transform duration-200 hover:-translate-y-1",
        padClass,
      )}
    >
      <div className="relative h-14 w-full">
        <Image src={src} alt={alt} fill sizes="240px" className="object-contain" />
      </div>
    </div>
  );
}

export function Sources() {
  const { t } = useLanguage();

  return (
    <section id="fonti" className="relative bg-background py-20 sm:py-28 lg:py-32">
      <Container className="flex flex-col items-center">
        <Reveal className="flex w-full flex-col items-center">
          <h2 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
            {t.sources.title}
          </h2>
          <p className="mt-4 max-w-2xl text-center text-lg text-primary sm:text-xl">
            {t.sources.subtitle}
          </p>
        </Reveal>

        <div className="mt-12 grid w-full max-w-5xl grid-cols-2 gap-5 sm:mt-16 lg:grid-cols-4">
          {LOGOS.map((logo, i) => (
            <Reveal key={logo.alt} delay={i * 90}>
              <LogoCard {...logo} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
