"use client";

import Link from "next/link";
import { ArrowUpRight, Clock, Mail, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { StoreButtons } from "@/components/ui/store-buttons";
import {
  PRIVACY_POLICY_URL,
  PUBLISHER,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
} from "@/lib/company";
import { useLanguage } from "@/lib/i18n";

const overlineClass =
  "text-xs font-medium uppercase tracking-[0.18em] text-primary";
const labelClass =
  "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";
const cardClass = "rounded-2xl border border-white/10 bg-navy/40 p-5 sm:p-8";
const rowClass = "flex flex-col gap-2 py-5 first:pt-0 last:pb-0";
const valueClass = "text-base text-foreground sm:text-lg";
const actionClass =
  "inline-flex items-center gap-2.5 rounded-md text-base text-primary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg";
const iconClass = "h-4 w-4 shrink-0";

/**
 * Pagina /contatti: recapiti di assistenza e dati dell'editore, richiesti
 * dalla policy "News and Magazines" di Google Play. Deve restare leggibile e
 * trovabile a colpo d'occhio — niente contenuti dietro interazioni.
 */
export function ContactInfo() {
  const { t } = useLanguage();

  return (
    <section className="relative bg-background pb-20 pt-28 sm:pb-28 sm:pt-32 lg:pb-32">
      <Container>
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <p className={overlineClass}>{t.contactPage.overline}</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl">
              {t.contactPage.title}
            </h1>
            <div className="mt-6 h-[3px] w-14 rounded-full bg-primary" />
            <p className="mt-6 text-lg text-muted-foreground">
              {t.contactPage.subtitle}
            </p>
          </Reveal>

          {/* Recapiti: link reali mailto:/tel:, così sono toccabili da mobile. */}
          <Reveal delay={120}>
            <h2 className="mt-12 font-display text-2xl sm:mt-14 sm:text-3xl">
              {t.contactPage.detailsTitle}
            </h2>
            <dl className={`mt-5 divide-y divide-white/10 ${cardClass}`}>
              <div className={rowClass}>
                <dt className={labelClass}>{t.contactPage.emailLabel}</dt>
                <dd>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className={actionClass}>
                    <Mail className={iconClass} strokeWidth={2} />
                    <span className="break-all">{SUPPORT_EMAIL}</span>
                  </a>
                </dd>
              </div>

              <div className={rowClass}>
                <dt className={labelClass}>{t.contactPage.phoneLabel}</dt>
                <dd>
                  <a href={`tel:${SUPPORT_PHONE_E164}`} className={actionClass}>
                    <Phone className={iconClass} strokeWidth={2} />
                    <span>{SUPPORT_PHONE_DISPLAY}</span>
                  </a>
                </dd>
              </div>

              <div className={rowClass}>
                <dt className={labelClass}>{t.contactPage.responseLabel}</dt>
                <dd
                  className={`inline-flex items-center gap-2.5 ${valueClass} text-muted-foreground`}
                >
                  <Clock className={iconClass} strokeWidth={2} />
                  <span>{t.contactPage.responseValue}</span>
                </dd>
              </div>
            </dl>
          </Reveal>

          {/* Editore: presente solo quando i dati legali sono stati compilati. */}
          {PUBLISHER && (
            <Reveal delay={140}>
              <h2 className="mt-12 font-display text-2xl sm:mt-14 sm:text-3xl">
                {t.contactPage.publisherTitle}
              </h2>
              <dl className={`mt-5 divide-y divide-white/10 ${cardClass}`}>
                <div className={rowClass}>
                  <dt className={labelClass}>
                    {t.contactPage.legalNameLabel}
                  </dt>
                  <dd className={valueClass}>{PUBLISHER.legalName}</dd>
                </div>

                <div className={rowClass}>
                  <dt className={labelClass}>{t.contactPage.addressLabel}</dt>
                  <dd className={valueClass}>{PUBLISHER.address}</dd>
                </div>

                <div className={rowClass}>
                  <dt className={labelClass}>{t.contactPage.vatLabel}</dt>
                  <dd className={valueClass}>{PUBLISHER.vatId}</dd>
                </div>

                {PUBLISHER.registrationNumber && (
                  <div className={rowClass}>
                    <dt className={labelClass}>
                      {t.contactPage.registrationLabel}
                    </dt>
                    <dd className={valueClass}>
                      {PUBLISHER.registrationNumber}
                    </dd>
                  </div>
                )}
              </dl>
            </Reveal>
          )}

          <Reveal delay={160}>
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
                <Link href="/" className={actionClass}>
                  {t.contactPage.backHome}
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-12 border-t border-white/10 pt-10 sm:mt-14">
              <p className={overlineClass}>{t.contact.storesLabel}</p>
              <StoreButtons className="mt-6 justify-start!" />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
