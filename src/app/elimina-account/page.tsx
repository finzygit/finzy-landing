import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { StickyNav } from "@/components/layout/sticky-nav";
import { AccountDeletionInfo } from "@/components/sections/account-deletion-info";
import { JsonLd } from "@/components/seo/json-ld";
import { ACCOUNT_DELETION_PATH } from "@/lib/account-deletion";
import { SITE_URL } from "@/lib/site";
import { ORGANIZATION_ID, WEBSITE_ID } from "@/lib/structured-data";
import { getTickerQuotes } from "@/lib/ticker";

const pageUrl = `${SITE_URL}${ACCOUNT_DELETION_PATH}`;

const title = "Eliminare l'account | Finzy";
const description =
  "Come eliminare il tuo account Finzy dall'app o via email, e quali dati eliminiamo.";

// Pagina di sola lettura, come /contatti: resta prerenderizzata; solo il
// ticker la rigenera in background con ISR.
export const dynamic = "force-static";

export const metadata: Metadata = {
  // `absolute` scavalca il template "%s · finzy" del layout.
  title: { absolute: title },
  description,
  alternates: { canonical: ACCOUNT_DELETION_PATH },
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

const pageJsonLd = {
  "@type": "WebPage",
  "@id": pageUrl,
  url: pageUrl,
  name: title,
  description,
  inLanguage: "it-IT",
  isPartOf: { "@id": WEBSITE_ID },
  about: { "@id": ORGANIZATION_ID },
};

/**
 * MOB-591: l'URL di eliminazione dell'account che Google Play chiede in
 * Data safety. Stessa struttura della pagina /contatti.
 */
export default async function AccountDeletionPage() {
  const quotes = await getTickerQuotes();

  return (
    <>
      <JsonLd graph={[pageJsonLd]} />
      <SmoothScroll />
      <StickyNav quotes={quotes} alwaysVisible />
      <main className="flex flex-1 flex-col">
        <AccountDeletionInfo />
      </main>
      <SiteFooter />
    </>
  );
}
