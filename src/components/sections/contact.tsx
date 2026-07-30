"use client";

import { useState } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { StoreButtons } from "@/components/ui/store-buttons";
import { useLanguage } from "@/lib/i18n";

const labelBase = "text-xs font-medium uppercase tracking-[0.18em]";
const labelClass = `${labelBase} text-muted-foreground`;
const labelPrimary = `${labelBase} text-primary`;
const fieldWrap = "flex flex-col gap-3";
// Campi con riga inferiore (grafica originale): dentro la card serve solo il bordo esterno.
const inputClass =
  "w-full border-b border-white/15 bg-transparent py-3 text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none";

export function Contact() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: collegare a un endpoint reale (invio email / API) prima del deploy.
    setSubmitted(true);
  }

  return (
    <section id="contatti" className="relative bg-background py-20 sm:py-28 lg:py-32">
      <Container>
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <p className={labelPrimary}>{t.contact.overline}</p>
            <h2 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl">
              {t.contact.titleLine1}
              <br />
              {t.contact.titleLine2}
            </h2>
            <div className="mt-6 h-[3px] w-14 rounded-full bg-primary" />
          </Reveal>

          {/* Form "a scatola" */}
          <Reveal delay={120}>
            <div className="mt-10 rounded-3xl border border-primary/25 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 shadow-2xl shadow-black/40 sm:mt-12 sm:p-8">
              {submitted ? (
                <p role="status" className="py-8 text-center text-lg text-primary">
                  {t.contact.success}
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                  <div className={fieldWrap}>
                    <label htmlFor="contact-name" className={labelClass}>
                      {t.contact.name.label}
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder={t.contact.name.placeholder}
                      className={inputClass}
                    />
                  </div>

                  <div className={fieldWrap}>
                    <label htmlFor="contact-email" className={labelClass}>
                      {t.contact.email.label}
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={t.contact.email.placeholder}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/25 px-5 py-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {t.contact.submit}
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>

                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      {t.contact.privacyNote}
                    </p>
                  </div>
                </form>
              )}
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-14 border-t border-white/10 pt-10">
              <p className={labelPrimary}>{t.contact.storesLabel}</p>
              <StoreButtons className="mt-6 justify-start!" />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
