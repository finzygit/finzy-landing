"use client";

// MOB-1198: web_topbar, web_nav_link, web_avatar, web_lang, web_menu.
// Logo, the search (not on the search page), Osservati, language, account.
// Phone: round 40 buttons (search, eye, avatar) and the language inside the
// account menu. Signed out: logo and language only. The reserved page: no
// search and no Osservati.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/lib/app";
import type { Lang } from "@/lib/format";
import { Logo } from "./Logo";
import { StockSearch } from "./Search";
import { Icon } from "./ui";

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export function Menu({ children, width = 240, title }: { children: ReactNode; width?: number | string; title?: ReactNode }) {
  return (
    <div role="menu" className="glass-menu absolute right-0 top-[calc(100%+8px)] z-30 rounded-tile py-1.5" style={{ width }}>
      {title && <div className="px-3.5 pb-2 pt-3">{title}</div>}
      {children}
    </div>
  );
}

export function MenuItem({ children, selected, onClick, separated }: { children: ReactNode; selected?: boolean; onClick?: () => void; separated?: boolean }) {
  return (
    <button
      type="button"
      role={selected === undefined ? "menuitem" : "menuitemradio"}
      aria-checked={selected}
      onClick={onClick}
      className={`flex h-11 w-full items-center justify-between px-3.5 text-left text-row ${selected ? "font-semibold text-ink" : "font-medium text-ink-2"} ${separated ? "border-t border-hair text-ink" : ""}`}
    >
      {children}
      {selected && <Icon name="check" size={18} stroke={2.4} className="text-accent" />}
    </button>
  );
}

function LangChip({ open, onClick }: { open: boolean; onClick: () => void }) {
  const { lang, t } = useApp();
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={t("lang_title")}
      onClick={onClick}
      className={`chip inline-flex h-9 items-center gap-1.5 rounded-full px-[15px] text-row font-semibold text-ink-2 ${open ? "shadow-[0_0_0_2px_rgba(39,216,199,0.55)]" : ""}`}
    >
      <Icon name="globe" size={15} className="text-accent" />
      {lang.toUpperCase()}
    </button>
  );
}

function LangMenu({ onPick }: { onPick: () => void }) {
  const { lang, setLang, t } = useApp();
  const pick = (l: Lang) => {
    setLang(l);
    onPick();
  };
  return (
    <Menu width={220} title={<span className="text-meta font-[650] text-ink-3">{t("lang_title")}</span>}>
      <MenuItem selected={lang === "it"} onClick={() => pick("it")}>
        {t("lang_it")}
      </MenuItem>
      <MenuItem selected={lang === "en"} onClick={() => pick("en")}>
        {t("lang_en")}
      </MenuItem>
    </Menu>
  );
}

export function TopBar({ search = true, nav = true }: { search?: boolean; nav?: boolean }) {
  const { t, me, session, signOut, lang, setLang } = useApp();
  const pathname = usePathname();
  const [menu, setMenu] = useState<null | "lang" | "account">(null);
  const close = () => setMenu(null);
  const langRef = useDismiss(menu === "lang", close);
  const accRef = useDismiss(menu === "account", close);
  const signedIn = session.status === "signed";
  const unlimited = session.status === "signed" && session.unlimited;
  const watchActive = pathname === "/osservati";
  const initial = (me?.first_name || me?.name || me?.email || "?").trim().charAt(0).toUpperCase();

  const account = (phone: boolean) => (
    <div className="relative" ref={accRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu === "account"}
        aria-label={me?.email ?? "account"}
        onClick={() => setMenu(menu === "account" ? null : "account")}
        className="inline-flex items-center gap-1.5"
      >
        <span className={`raised inline-flex h-9 w-9 items-center justify-center rounded-full text-row font-bold text-ink ${menu === "account" ? "shadow-[0_0_0_2px_rgba(39,216,199,0.70)]" : ""}`}>{initial}</span>
        <Icon name="chevron_down" size={16} className="text-ink-3" />
      </button>
      {menu === "account" && (
        <Menu
          width={phone ? "calc(100vw - 32px)" : 280}
          title={
            <span className="flex flex-col gap-0.5">
              <span className="truncate text-label font-semibold text-ink">{me?.email}</span>
              {unlimited && <span className="text-meta text-ink-3">{t("acct_plan")}</span>}
            </span>
          }
        >
          {phone && (
            <MenuItem onClick={() => setLang(lang === "it" ? "en" : "it")}>
              {`${t("lang_title")} · ${lang === "it" ? t("lang_it") : t("lang_en")}`}
            </MenuItem>
          )}
          <MenuItem
            separated
            onClick={() => {
              close();
              void signOut();
            }}
          >
            {t("signout")}
          </MenuItem>
        </Menu>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-hair bg-[linear-gradient(180deg,rgba(1,8,8,0.92),rgba(1,8,8,0.70))] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-6 px-4 sm:px-8 wide:px-0">
        <Link href={signedIn ? "/" : "/accedi"} aria-label="Finzy" className="flex-none">
          <span className="sm:hidden">
            <Logo small />
          </span>
          <span className="hidden sm:inline">
            <Logo />
          </span>
        </Link>
        {signedIn && search && unlimited ? (
          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <div className="w-[340px] wide:w-[420px]">
              <StockSearch />
            </div>
          </div>
        ) : (
          <span className="flex-1" />
        )}
        <span className="flex-1 md:hidden" />
        {signedIn ? (
          <>
            {/* wide and mid screens */}
            <div className="hidden items-center gap-3.5 sm:flex">
              {nav && unlimited && (
                <Link
                  href="/osservati"
                  aria-current={watchActive ? "page" : undefined}
                  className={`relative inline-flex h-16 items-center gap-2 px-2.5 text-row font-semibold ${watchActive ? "text-ink" : "text-ink-2"}`}
                >
                  <Icon name="eye" size={18} />
                  {t("watch_title")}
                  {watchActive && <span className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-sm bg-accent shadow-[0_0_10px_rgba(39,204,216,0.55)]" />}
                </Link>
              )}
              <div className="relative" ref={langRef}>
                <LangChip open={menu === "lang"} onClick={() => setMenu(menu === "lang" ? null : "lang")} />
                {menu === "lang" && <LangMenu onPick={close} />}
              </div>
              {account(false)}
            </div>
            {/* phone */}
            <div className="flex items-center gap-1.5 sm:hidden">
              {search && unlimited && (
                <Link href="/" aria-label={t("search_title")} className="raised inline-flex h-10 w-10 items-center justify-center rounded-full text-ink">
                  <Icon name="search" size={18} />
                </Link>
              )}
              {nav && unlimited && (
                <Link
                  href="/osservati"
                  aria-label={t("watch_title")}
                  aria-current={watchActive ? "page" : undefined}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${watchActive ? "border border-[rgba(39,216,199,0.62)] bg-[rgba(39,204,216,0.14)] text-accent" : "raised text-ink"}`}
                >
                  <Icon name="eye" size={18} />
                </Link>
              )}
              {account(true)}
            </div>
          </>
        ) : (
          <div className="relative" ref={langRef}>
            <LangChip open={menu === "lang"} onClick={() => setMenu(menu === "lang" ? null : "lang")} />
            {menu === "lang" && <LangMenu onPick={close} />}
          </div>
        )}
      </div>
    </header>
  );
}

/** The toasts of decision 6: top right on a wide screen, under the bar on a phone. */
export function Toasts() {
  const { toasts, dismiss, t } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" className="fixed right-4 top-[76px] z-40 flex w-[min(360px,calc(100vw-32px))] flex-col gap-2.5 sm:right-8 wide:right-[max(32px,calc((100vw-1200px)/2))]">
      {toasts.map((x) => (
        <div key={x.id} role="status" className="glass-menu flex items-start gap-3 rounded-tile px-4 py-3.5">
          <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[rgba(39,204,216,0.18)] text-accent">
            <Icon name="check" size={15} stroke={2.6} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-label font-bold text-ink">{x.title}</span>
            {x.body && <span className="text-meta text-ink-2">{x.body}</span>}
          </span>
          <button type="button" aria-label={t("close")} onClick={() => dismiss(x.id)} className="text-ink-3">
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
