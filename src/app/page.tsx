import { StickyNav } from "@/components/layout/sticky-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { GiveawayPopup } from "@/components/layout/giveaway-popup";
import { QrDownloadFloat } from "@/components/ui/qr-download-float";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Sources } from "@/components/sections/sources";
import { Story } from "@/components/sections/story";
import { Features } from "@/components/sections/features";
import { Process } from "@/components/sections/process";
import { Learning } from "@/components/sections/learning";
import { Testimonials } from "@/components/sections/testimonials";
import { GiveawayBanner } from "@/components/sections/giveaway-banner";
import { Pricing } from "@/components/sections/pricing";
import { Contact } from "@/components/sections/contact";
import { getTickerQuotes } from "@/lib/ticker";

export default async function Home() {
  const quotes = await getTickerQuotes();

  return (
    <>
      <SmoothScroll />
      <StickyNav quotes={quotes} />
      <main className="flex flex-1 flex-col">
        <Hero quotes={quotes} />
        <About />
        <Sources />
        <Story />
        <Features />
        <Process />
        <Learning />
        <Testimonials />
        <GiveawayBanner />
        <Pricing />
        <Contact />
      </main>
      <SiteFooter />
      <GiveawayPopup />
      <QrDownloadFloat />
    </>
  );
}
