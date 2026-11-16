"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useIsClient } from "@/lib/client-snapshot";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NavMenuState = {
  open: boolean;
  openMenu: () => void;
};

const NavMenuContext = createContext<NavMenuState | null>(null);

/**
 * Un solo menu di navigazione per pagina (MOB-1447). Gli hamburger (header
 * dell'hero e navbar compatta) sono solo pulsanti che aprono questo menu:
 * prima ognuno montava il suo overlay, e sulla home c'erano due dialog
 * «Menu di navigazione» con due stati diversi.
 *
 * Menu a tutto schermo: sfondo coral sfocato e link centrati (portal su body,
 * così i suoi elementi `fixed` coprono il viewport anche dentro antenati con
 * transform). Chiude su Esc, sulla X o toccando un link. Blocca lo scroll del
 * body quando aperto. Da chiuso è `invisible`: i suoi link non si raggiungono
 * col Tab e gli screen reader non li leggono dietro la pagina.
 */
export function NavMenuProvider({ children }: { children: ReactNode }) {
  // Il provider sta nel layout e sopravvive ai cambi di pagina: il menu resta
  // aperto solo sulla pagina dove lo si è aperto. Con Indietro verso un'altra
  // pagina si chiude da solo (e il body torna a scorrere).
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn !== null && openOn === pathname;
  const openMenu = useCallback(() => setOpenOn(pathname), [pathname]);
  const close = useCallback(() => setOpenOn(null), []);
  const value = useMemo(() => ({ open, openMenu }), [open, openMenu]);

  return (
    <NavMenuContext.Provider value={value}>
      {children}
      <NavMenuDialog open={open} onClose={close} />
    </NavMenuContext.Provider>
  );
}

function useNavMenu(): NavMenuState {
  const state = useContext(NavMenuContext);
  if (!state) {
    throw new Error("NavMenu needs a NavMenuProvider above it (app/layout.tsx).");
  }
  return state;
}

/** L'hamburger che apre il menu di navigazione condiviso. */
export function NavMenu({ triggerClassName }: { triggerClassName?: string }) {
  const { t } = useLanguage();
  const { open, openMenu } = useNavMenu();

  return (
    <button
      type="button"
      aria-label={t.nav.open}
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={openMenu}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        triggerClassName,
      )}
    >
      <Menu className="h-6 w-6" strokeWidth={1.75} />
    </button>
  );
}

function NavMenuDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const mounted = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.nav.dialog}
      className={cn(
        "fixed inset-0 z-[90] transition-[opacity,visibility] duration-300",
        open ? "visible opacity-100" : "pointer-events-none invisible opacity-0",
      )}
    >
      {/* Sfondo coral sfocato + velo scuro */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden bg-[#05070a]"
      >
        <Image
          src="/hero-img.png"
          alt=""
          fill
          sizes="100vw"
          className="scale-110 object-cover object-center opacity-30 blur-2xl"
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <button
        type="button"
        aria-label={t.nav.close}
        onClick={onClose}
        className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-8 sm:top-6"
      >
        <X className="h-7 w-7" strokeWidth={1.5} />
      </button>

      <nav
        className={cn(
          "relative flex h-full flex-col items-center justify-center gap-1 px-6 text-center transition-all duration-300 ease-out",
          open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        {t.nav.links.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-3xl font-light text-foreground/90 transition-colors hover:text-primary sm:text-4xl"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>,
    document.body,
  );
}
