"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/lib/i18n";

const fieldWrap = "flex flex-col gap-3";
const labelClass =
  "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";
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
            <p className={labelClass}>{t.contact.overline}</p>
            <h2 className="mt-5 font-serif text-5xl leading-[1.05] sm:text-6xl">
              {t.contact.titleLine1}
              <br />
              {t.contact.titleLine2}
            </h2>
            <div className="mt-6 h-[3px] w-14 rounded-full bg-primary" />
          </Reveal>

          <Reveal delay={120}>
            {submitted ? (
              <p role="status" className="mt-12 text-lg text-primary">
                {t.contact.success}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-12 space-y-10" noValidate>
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

                <div className={fieldWrap}>
                  <label htmlFor="contact-goal" className={labelClass}>
                    {t.contact.goal.label}
                  </label>
                  <textarea
                    id="contact-goal"
                    name="goal"
                    rows={3}
                    placeholder={t.contact.goal.placeholder}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t.contact.submit}
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
