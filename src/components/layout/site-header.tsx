import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NavMenu } from "@/components/layout/nav-menu";
import { cn } from "@/lib/utils";

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex items-start justify-between px-5 py-5 sm:px-8 lg:px-12 lg:pt-3 lg:pb-6",
        className,
      )}
    >
      {/* Da lg il corallo arriva fin sotto l'header: logo più in alto e un po'
          più piccolo, così resta sopra il corallo senza sovrapporsi. */}
      <Link href="/" aria-label="finzy — home" className="inline-flex">
        <Image
          src="/logo.png"
          alt="finzy"
          width={742}
          height={1024}
          priority
          className="h-20 w-auto sm:h-24 lg:h-22"
        />
      </Link>

      {/* Lingua e hamburger sulla stessa riga, in alto (centrati sul logo
          finivano sopra il corallo). */}
      <div className="flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher />
        <NavMenu triggerClassName="h-11 w-11" />
      </div>
    </header>
  );
}
