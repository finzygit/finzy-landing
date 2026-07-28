"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Nomi commerciali + prezzo mensile (in €) + piano evidenziato. Non tradotti.
const PLANS = [
  { name: "Free", price: 0, href: "#contatti", popular: false },
  { name: "Premium", price: 4.99, href: "#contatti", popular: true },
  { name: "Unlimited Pro", price: 6.99, href: "#contatti", popular: false },
];

const LOCALE: Record<Lang, string> = {
  en: "en-US",
  it: "it-IT",
  es: "es-ES",
  fr: "fr-FR",
  pt: "pt-PT",
};

function formatAmount(value: number, lang: Lang) {
  return value.toLocaleString(LOCALE[lang], {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function Pricing() {
  const { t, lang } = useLanguage();
  const p = t.pricing;
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="prezzi"
      className="relative bg-background py-20 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal className="flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {p.overline}
          </p>
          <h2 className="mt-4 max-w-3xl text-center font-serif text-4xl leading-tight sm:text-5xl">
            {p.title}
          </h2>

          {/* Toggle mensile / annuale */}
          <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              aria-pressed={!annual}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                !annual
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground",
              )}
            >
              {p.monthly}
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              aria-pressed={annual}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors",
                annual
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground",
              )}
            >
              {p.annual}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold",
                  annual
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-primary/15 text-primary",
                )}
              >
                {p.annualBadge}
              </span>
            </button>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const info = p.plans[i];
            const amount = annual
              ? Math.round(plan.price * 0.8 * 100) / 100
              : plan.price;
            const popular = plan.popular;
            return (
              <Reveal key={plan.name} delay={i * 90} className="h-full">
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl border p-7 sm:p-8",
                    popular
                      ? "border-primary/60 bg-gradient-to-b from-primary/[0.08] to-white/[0.015] shadow-[0_0_40px_-12px_rgba(32,229,209,0.45)]"
                      : "border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.015]",
                  )}
                >
                  {popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {p.popular}
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {info.tagline}
                  </p>

                  <div className="mt-6">
                    {/* Prezzo mensile barrato (slot riservato: nessun salto di layout) */}
                    <div
                      className={cn(
                        "h-6 leading-6",
                        annual && plan.price > 0 ? "visible" : "invisible",
                      )}
                    >
                      <span className="text-base font-medium text-red-400/80 line-through">
                        €{formatAmount(plan.price, lang)}
                        <span className="ml-1 text-xs">{p.perMonth}</span>
                      </span>
                    </div>
                    <div className="mt-1 flex items-end gap-1">
                      <span className="mb-2 text-2xl font-light text-foreground/80">
                        €
                      </span>
                      <span className="text-5xl font-light tracking-tight text-foreground">
                        {formatAmount(amount, lang)}
                      </span>
                      <span className="mb-2 text-sm text-muted-foreground">
                        {p.perMonth}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {info.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-sm text-foreground/90"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          strokeWidth={2.5}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-8">
                    <Link
                      href={plan.href}
                      className={cn(
                        "inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-colors",
                        popular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border border-white/15 text-foreground hover:border-primary hover:text-primary",
                      )}
                    >
                      {info.cta}
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
