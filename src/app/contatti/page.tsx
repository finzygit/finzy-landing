import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { StickyNav } from "@/components/layout/sticky-nav";
import { ContactInfo } from "@/components/sections/contact-info";
import { PUBLISHER, SUPPORT_EMAIL, SUPPORT_PHONE_E164 } from "@/lib/company";

const siteUrl = "https://finzyapp.com";
const pageUrl = `${siteUrl}/contatti`;

const title = "Contatti | Finzy";
const description =
  "Contatta l'assistenza dell'app Finzy: email, telefono e dati dell'editore. Rispondiamo alle richieste di supporto entro 2 giorni lavorativi.";

// Pagina di sola lettura: nessuna API dinamica, viene prerenderizzata a build time.
export const dynamic = "force-static";

export const metadata: Metadata = {
  // `absolute` scavalca il template "%s · finzy" del layout: il titolo esatto
  // è quello che il revisore Google si aspetta di trovare.
  title: { absolute: title },
  description,
  alternates: { canonical: "/contatti" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: pageUrl,
    siteName: "finzy",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * Dati strutturati: gli stessi recapiti mostrati a schermo, così contenuto
 * visibile e markup non possono divergere. I campi legali compaiono solo
 * quando `PUBLISHER` è stato compilato in src/lib/company.ts.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Finzy",
      url: siteUrl,
      email: SUPPORT_EMAIL,
      telephone: SUPPORT_PHONE_E164,
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: SUPPORT_EMAIL,
          telephone: SUPPORT_PHONE_E164,
          availableLanguage: ["it", "en", "es", "fr", "pt"],
        },
      ],
      ...(PUBLISHER && {
        legalName: PUBLISHER.legalName,
        address: PUBLISHER.address,
        vatID: PUBLISHER.vatId,
        ...(PUBLISHER.registrationNumber && {
          identifier: PUBLISHER.registrationNumber,
        }),
      }),
    },
    {
      "@type": "ContactPage",
      "@id": pageUrl,
      url: pageUrl,
      name: title,
      description,
      inLanguage: "it-IT",
      isPartOf: {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "finzy",
      },
      about: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <SmoothScroll />
      {/* Pagina breve: la navbar resta ancorata, senza dipendere dallo scroll. */}
      <StickyNav alwaysVisible />
      <main className="flex flex-1 flex-col">
        <ContactInfo />
      </main>
      <SiteFooter />
    </>
  );
}
