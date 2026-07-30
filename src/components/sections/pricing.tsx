"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Nomi commerciali + prezzo mensile (in €) + piano evidenziato. Non tradotti.
const PLANS = [
  { name: "Free", price: 0, href: "#contatti", popular: false },
  { name: "Premium", price: 4.99, href: "#contatti", popular: false },
  { name: "Unlimited", price: 6.99, href: "#contatti", popular: true },
];

type Plan = (typeof PLANS)[number];
type PlanInfo = { tagline: string; features: string[]; cta: string };

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

type CardProps = {
  plan: Plan;
  info: PlanInfo;
  annual: boolean;
  lang: Lang;
  perMonth: string;
  popularLabel: string;
};

function PlanCard({ plan, info, annual, lang, perMonth, popularLabel }: CardProps) {
  const amount = annual ? Math.round(plan.price * 0.8 * 100) / 100 : plan.price;
  const popular = plan.popular;

  return (
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
            {popularLabel}
          </span>
        </div>
      )}

      <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{info.tagline}</p>

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
            <span className="ml-1 text-xs">{perMonth}</span>
          </span>
        </div>
        <div className="mt-1 flex items-end gap-1">
          <span className="mb-2 text-2xl font-light text-foreground/80">€</span>
          <span className="text-5xl font-light tracking-tight text-foreground">
            {formatAmount(amount, lang)}
          </span>
          <span className="mb-2 text-sm text-muted-foreground">{perMonth}</span>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {info.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2.5 text-sm text-foreground/90"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
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
  );
}

type CarouselProps = {
  infos: PlanInfo[];
  annual: boolean;
  lang: Lang;
  perMonth: string;
  popularLabel: string;
};

/**
 * Carosello prezzi per mobile: swipe con snap + loop infinito.
 * Tre copie dei piani; al fermarsi lo scroll viene riportato (senza animazione)
 * nella copia centrale, così si può scorrere all'infinito in entrambi i versi.
 */
function PricingCarousel({ infos, ...card }: CarouselProps) {
  const N = PLANS.length;
  const items = [...PLANS, ...PLANS, ...PLANS]; // 3 copie
  const scroller = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const idle = useRef<number | undefined>(undefined);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  const centerTo = (idx: number, smooth: boolean) => {
    const el = scroller.current;
    const card = cards.current[idx];
    if (!el || !card) return;
    const left = card.offsetLeft - (el.clientWidth - card.clientWidth) / 2;
    el.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    // parte dal primo piano della copia centrale
    const id = requestAnimationFrame(() => centerTo(N, false));
    const onResize = () => centerTo(activeRef.current + N, false);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    cards.current.forEach((c, i) => {
      if (!c) return;
      const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - center);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const logical = ((best % N) + N) % N;
    activeRef.current = logical;
    setActive(logical);

    // quando lo scroll si ferma, riporta nella copia centrale (loop invisibile)
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => {
      if (best < N || best >= 2 * N) centerTo(logical + N, false);
    }, 140);
  };

  return (
    <div className="lg:hidden">
      <div
        ref={scroller}
        onScroll={handleScroll}
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[10vw] py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-8"
      >
        {items.map((plan, i) => (
          <div
            key={i}
            ref={(el) => {
              cards.current[i] = el;
            }}
            className="w-[80vw] max-w-[20rem] shrink-0 snap-center"
          >
            <PlanCard plan={plan} info={infos[i % N]} {...card} />
          </div>
        ))}
      </div>

      {/* Indicatori */}
      <div className="mt-5 flex justify-center gap-2">
        {PLANS.map((plan, i) => (
          <button
            key={plan.name}
            type="button"
            aria-label={`${plan.name}`}
            aria-current={active === i}
            onClick={() => centerTo(i + N, true)}
            className={cn(
              "h-2 rounded-full transition-all",
              active === i ? "w-6 bg-primary" : "w-2 bg-white/25",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function Pricing() {
  const { t, lang } = useLanguage();
  const p = t.pricing;
  const [annual, setAnnual] = useState(false);

  const cardCommon = {
    annual,
    lang,
    perMonth: p.perMonth,
    popularLabel: p.popular,
  };

  return (
    <section id="prezzi" className="relative bg-background py-20 sm:py-28 lg:py-32">
      <Container>
        <Reveal className="flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {p.overline}
          </p>
          <h2 className="mt-4 max-w-3xl text-center font-display text-4xl leading-tight sm:text-5xl">
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

        {/* Desktop: griglia a 3 colonne */}
        <div className="mt-16 hidden gap-6 lg:grid lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 90} className="h-full">
              <PlanCard plan={plan} info={p.plans[i]} {...cardCommon} />
            </Reveal>
          ))}
        </div>

        {/* Mobile: carosello swipe + loop infinito */}
        <Reveal className="mt-10 sm:mt-12 lg:hidden">
          <PricingCarousel infos={p.plans} {...cardCommon} />
        </Reveal>
      </Container>
    </section>
  );
}
