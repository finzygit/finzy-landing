"use client";

import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { deletionMailto } from "@/lib/account-deletion";
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from "@/lib/company";
import { useLanguage } from "@/lib/i18n";

// Stessi stili della pagina /contatti (contact-info.tsx).
const overlineClass =
  "text-xs font-medium uppercase tracking-[0.18em] text-primary";
const cardClass = "rounded-2xl border border-white/10 bg-navy/40 p-5 sm:p-8";
const h2Class = "mt-12 font-display text-2xl sm:mt-14 sm:text-3xl";
const bodyClass = "text-base text-muted-foreground sm:text-lg";
const actionClass =
  "inline-flex items-center gap-2.5 rounded-md text-base text-primary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg";

/**
 * Pagina /elimina-account (MOB-591): come eliminare l'account nell'app e la
 * strada via email. Tutto il testo è visibile, niente dietro interazioni:
 * il revisore di Google Play deve trovarlo a colpo d'occhio.
 */
export function AccountDeletionInfo() {
  const { t } = useLanguage();
  const copy = t.accountDeletionPage;
  // L'indirizzo nel testo diventa un link mailto: con l'oggetto già scritto.
  const [beforeEmail, afterEmail = ""] = copy.emailBody.split("{email}");

  return (
    <section className="relative bg-background pb-20 pt-28 sm:pb-28 sm:pt-32 lg:pb-32">
      <Container>
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <p className={overlineClass}>{copy.overline}</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl">
              {copy.title}
            </h1>
            <div className="mt-6 h-[3px] w-14 rounded-full bg-primary" />
            <p className="mt-6 text-lg text-muted-foreground">
              {copy.subtitle}
            </p>
          </Reveal>

          <Reveal delay={120}>
            <h2 className={h2Class}>{copy.inAppTitle}</h2>
            <div className={`mt-5 ${cardClass}`}>
              <ol className="space-y-4">
                {copy.steps.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 text-sm font-medium text-primary">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-base text-foreground sm:text-lg">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <p className={`mt-6 border-t border-white/10 pt-5 ${bodyClass}`}>
                {copy.inAppNote}
              </p>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <h2 className={h2Class}>{copy.emailTitle}</h2>
            <div className={`mt-5 ${cardClass}`}>
              <p className="text-base text-foreground sm:text-lg">
                {beforeEmail}
                <a
                  href={deletionMailto(SUPPORT_EMAIL, copy.emailSubject)}
                  className="break-all text-primary underline-offset-4 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                {afterEmail}
              </p>
              <a
                href={deletionMailto(SUPPORT_EMAIL, copy.emailSubject)}
                className={`mt-6 ${actionClass}`}
              >
                <Mail className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span>{copy.emailSubject}</span>
              </a>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <h2 className={h2Class}>{copy.deletedTitle}</h2>
            <p className={`mt-5 ${bodyClass}`}>{copy.deletedBody}</p>

            <h2 className={h2Class}>{copy.keptTitle}</h2>
            <p className={`mt-5 ${bodyClass}`}>{copy.keptBody}</p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-12 border-t border-white/10 pt-10 sm:mt-14">
              <p className={overlineClass}>{t.contactPage.documentsTitle}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
                <a
                  href={PRIVACY_POLICY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={actionClass}
                >
                  {t.footer.privacy}
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </a>
                <Link href="/contatti" className={actionClass}>
                  {t.contactPage.title}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
