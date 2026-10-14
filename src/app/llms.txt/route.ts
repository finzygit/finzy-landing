import { SUPPORT_EMAIL } from "@/lib/company";
import { annualMonthlyPrice, PLANS, PRICE_CURRENCY } from "@/lib/plans";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/store-links";

// Contenuto fisso: generato una volta in build, servito come file statico.
export const dynamic = "force-static";

const plans = PLANS.map((plan) =>
  plan.price === 0
    ? `- ${plan.name}: free`
    : `- ${plan.name}: ${plan.price.toFixed(2)} ${PRICE_CURRENCY} per month, or ${annualMonthlyPrice(plan.price).toFixed(2)} ${PRICE_CURRENCY} per month billed annually`,
).join("\n");

/**
 * llms.txt (https://llmstxt.org): descrizione testuale del prodotto per i
 * modelli linguistici. In inglese, la lingua che i modelli leggono meglio.
 */
const body = `# ${SITE_NAME}

> ${SITE_NAME} is a mobile app for iOS and Android that makes financial news easy to follow. It turns market news into short AI-generated summaries, shows a feed tailored to the user's interests, and tracks stock prices in real time.

${SITE_NAME} is made for people who are not finance experts. The app is available in Italian, English, Spanish, French and Portuguese. The website is ${SITE_URL}.

## What the app does

- AI summaries: financial news rewritten in plain language, readable in about 60 seconds.
- Personalized feed: the user picks the markets, stocks and topics to follow.
- Real-time prices: live stock quotes and notifications on relevant market moves.
- Stock Snapshot: a quick overview of a single stock.
- Financial reports: 10-K statements and key indicators.
- Personal finance planner: build and export a personal balance sheet.
- Learning: lessons on stocks, bonds, crypto, forex, commodities and more.

## Plans

${plans}

## Pages

- [Home](${SITE_URL}/): product overview, features and pricing.
- [Download](${SITE_URL}/download): sends a phone to the right app store.
- [Contacts](${SITE_URL}/contatti): support email and publisher details.

## Download

- [App Store (iOS)](${APP_STORE_URL})
- [Google Play (Android)](${GOOGLE_PLAY_URL})

## Support

- Email: ${SUPPORT_EMAIL}
`;

export function GET() {
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
