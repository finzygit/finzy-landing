import { StickyNav } from "@/components/layout/sticky-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Sources } from "@/components/sections/sources";
import { Story } from "@/components/sections/story";
import { Features } from "@/components/sections/features";
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
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
