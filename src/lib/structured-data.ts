import { PUBLISHER, SUPPORT_EMAIL } from "@/lib/company";
import { PLANS, PRICE_CURRENCY } from "@/lib/plans";
import {
  APP_DESCRIPTION,
  SITE_LANGUAGES,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/store-links";

/**
 * Dati strutturati schema.org. Gli `@id` sono stabili: ogni pagina può
 * riferirsi a organizzazione, sito e app senza ridichiararli.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const APP_ID = `${SITE_URL}/#app`;

/**
 * Profili ufficiali che legano il nome "Finzy" all'entità giusta.
 * TODO(dati mancanti): aggiungere qui i profili social ufficiali quando
 * vengono forniti. Per ora solo le schede degli store, le uniche verificate.
 */
const SAME_AS = [APP_STORE_URL, GOOGLE_PLAY_URL];

/**
 * Stessi recapiti mostrati su /contatti. I campi legali compaiono solo
 * quando `PUBLISHER` è stato compilato in src/lib/company.ts.
 */
export const organizationJsonLd = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  email: SUPPORT_EMAIL,
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      availableLanguage: SITE_LANGUAGES,
    },
  ],
  sameAs: SAME_AS,
  ...(PUBLISHER && {
    legalName: PUBLISHER.legalName,
    address: PUBLISHER.address,
    vatID: PUBLISHER.vatId,
    ...(PUBLISHER.registrationNumber && {
      identifier: PUBLISHER.registrationNumber,
    }),
  }),
};

export const websiteJsonLd = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: SITE_NAME,
  description: APP_DESCRIPTION,
  inLanguage: "it-IT",
  publisher: { "@id": ORGANIZATION_ID },
};

/** Un'offerta per piano, al prezzo mensile mostrato nella sezione Prezzi. */
export const softwareApplicationJsonLd = {
  "@type": "SoftwareApplication",
  "@id": APP_ID,
  name: SITE_NAME,
  description: APP_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/home-screen.png`,
  applicationCategory: "FinanceApplication",
  operatingSystem: "iOS, Android",
  inLanguage: SITE_LANGUAGES,
  downloadUrl: `${SITE_URL}/download`,
  installUrl: [APP_STORE_URL, GOOGLE_PLAY_URL],
  sameAs: [APP_STORE_URL, GOOGLE_PLAY_URL],
  publisher: { "@id": ORGANIZATION_ID },
  offers: PLANS.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: plan.price.toFixed(2),
    priceCurrency: PRICE_CURRENCY,
    ...(plan.price > 0 && {
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: plan.price.toFixed(2),
        priceCurrency: PRICE_CURRENCY,
        billingDuration: "P1M",
      },
    }),
  })),
};
