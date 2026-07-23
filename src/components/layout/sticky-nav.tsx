"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TickerTrack } from "@/components/layout/market-ticker";
import { NavMenu } from "@/components/layout/nav-menu";
import { cn } from "@/lib/utils";

/**
 * Navbar compatta che compare scorrendo: unisce in un'unica barra
 * logo + chip di mercato + hamburger. Nascosta in cima alla pagina.
 */
export function StickyNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "-translate-y-full pointer-events-none",
      )}
    >
      <div className="flex items-center gap-4 border-b border-white/10 bg-background/85 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <Link href="/" aria-label="finzy — home" className="shrink-0">
          <Image
            src="/logo.png"
            alt="finzy"
            width={742}
            height={1024}
            className="h-9 w-auto"
          />
        </Link>

        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <TickerTrack className="py-1" />
        </div>

        <NavMenu triggerClassName="shrink-0" />
      </div>
    </div>
  );
}
