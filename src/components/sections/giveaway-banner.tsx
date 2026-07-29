"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/lib/i18n";

/**
 * Banner giveaway in-line (stesso bordo fucsia animato del popup, `.giveaway-card`).
 */
export function GiveawayBanner() {
  const { t } = useLanguage();
  const g = t.giveaway;

  return (
    <section id="giveaway" className="relative bg-background py-16 sm:py-20">
      <Container>
        <Reveal>
          <div className="giveaway-card mx-auto max-w-4xl">
            <div className="relative z-[2] overflow-hidden rounded-[calc(1.5rem-2px)] bg-[#08141d] px-6 py-12 text-center sm:px-12 sm:py-16">
              <div className="mb-5 text-5xl" aria-hidden>
                📱
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                {g.overline}
              </p>
              <h2 className="mt-4 text-4xl font-bold text-[#FF3D9A] sm:text-5xl">
                {g.title}
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-foreground/85">
                {g.bannerPre}
                <span className="font-semibold text-[#FF3D9A]">
                  {g.highlight}
                </span>
                {g.bannerPost}
              </p>
              <Link
                href="#contatti"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {g.cta}
              </Link>
              <p className="mt-6 text-xs text-muted-foreground">{g.fine}</p>

              <details className="mx-auto mt-3 max-w-xl text-left">
                <summary className="cursor-pointer list-none text-center text-xs font-medium text-primary/80 transition-colors hover:text-primary">
                  {g.rulesLabel}
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {g.rules}
                </p>
              </details>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
