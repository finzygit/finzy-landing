import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NavMenu } from "@/components/layout/nav-menu";
import { cn } from "@/lib/utils";

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-6",
        className,
      )}
    >
      <Link href="/" aria-label="finzy — home" className="inline-flex">
        <Image
          src="/logo.png"
          alt="finzy"
          width={742}
          height={1024}
          priority
          className="h-20 w-auto sm:h-24 lg:h-32"
        />
      </Link>

      <div className="flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher />
        <NavMenu triggerClassName="h-11 w-11" />
      </div>
    </header>
  );
}
