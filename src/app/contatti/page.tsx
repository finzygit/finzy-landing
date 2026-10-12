import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { StickyNav } from "@/components/layout/sticky-nav";
import { ContactInfo } from "@/components/sections/contact-info";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";
import { ORGANIZATION_ID, WEBSITE_ID } from "@/lib/structured-data";
import { getTickerQuotes } from "@/lib/ticker";

const pageUrl = `${SITE_URL}/contatti`;

const title = "Contatti | Finzy";
const description =
  "Contatta l'assistenza dell'app Finzy: email, telefono e dati dell'editore. Rispondiamo alle richieste di supporto entro 2 giorni lavorativi.";

// Pagina di sola lettura: nessuna API dinamica, resta prerenderizzata. Solo le
// quotazioni del ticker la fanno rigenerare in background con ISR.
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
 * Dati strutturati della pagina. Organization e WebSite sono già dichiarati
 * dal layout su ogni pagina: qui bastano i riferimenti ai loro `@id`.
 */
const contactPageJsonLd = {
  "@type": "ContactPage",
  "@id": pageUrl,
  url: pageUrl,
  name: title,
  description,
  inLanguage: "it-IT",
  isPartOf: { "@id": WEBSITE_ID },
  about: { "@id": ORGANIZATION_ID },
};

export default async function ContactPage() {
  const quotes = await getTickerQuotes();

  return (
    <>
      <JsonLd graph={[contactPageJsonLd]} />
      <SmoothScroll />
      {/* Pagina breve: la navbar resta ancorata, senza dipendere dallo scroll. */}
      <StickyNav quotes={quotes} alwaysVisible />
      <main className="flex flex-1 flex-col">
        <ContactInfo />
      </main>
      <SiteFooter />
    </>
  );
}
