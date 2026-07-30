"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useLanguage } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="relative border-t border-white/5 bg-background pb-8 pt-16 sm:pt-20">
      <Container>
        {/* Brand + navigazione */}
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex justify-center lg:block">
            <Image
              src="/logo.png"
              alt="finzy"
              width={742}
              height={1024}
              className="h-32 w-auto sm:h-36"
            />
          </div>

          <div className="flex w-full justify-between gap-16 lg:w-auto lg:gap-24">
            {t.footer.columns.map((col, i) => (
              <nav
                key={col.title}
                aria-label={col.title}
                className={
                  i === t.footer.columns.length - 1
                    ? "text-right lg:text-left"
                    : undefined
                }
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-foreground/80 transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* CTA gigante */}
        <Link
          href="#contatti"
          className="group mt-16 flex items-center gap-3 sm:mt-20"
        >
          <span className="text-5xl font-bold tracking-tight text-white/10 transition-colors group-hover:text-white/20 sm:text-7xl lg:text-8xl">
            {t.footer.cta}
          </span>
          <ArrowUpRight
            className="h-8 w-8 shrink-0 text-primary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 sm:h-12 sm:w-12"
            strokeWidth={1.75}
          />
        </Link>

        {/* Barra inferiore */}
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.copyright}</p>
          <div className="flex gap-6">
            <Link href="#" className="transition-colors hover:text-foreground">
              {t.footer.privacy}
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              {t.footer.terms}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
