import { StickyNav } from "@/components/layout/sticky-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { GiveawayPopup } from "@/components/layout/giveaway-popup";
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

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <StickyNav />
      <main className="flex flex-1 flex-col">
        <Hero />
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
    </>
  );
}
