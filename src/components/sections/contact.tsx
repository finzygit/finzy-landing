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
const fieldWrap = "flex flex-col gap-2";
// Campi "a scatola" con bordo turchese, coerenti con le card della pagina.
const inputClass =
  "w-full rounded-xl border border-primary/25 bg-navy/40 px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

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
            <div className="mt-10 rounded-3xl border border-primary/15 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 shadow-2xl shadow-black/40 sm:mt-12 sm:p-8">
              {submitted ? (
                <p role="status" className="py-8 text-center text-lg text-primary">
                  {t.contact.success}
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

                  <button
                    type="submit"
                    className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {t.contact.submit}
                    <ArrowUpRight
                      className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2.25}
                    />
                  </button>

                  <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    {t.contact.privacyNote}
                  </p>
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
