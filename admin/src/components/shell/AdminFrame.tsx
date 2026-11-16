"use client";

// MOB-1372: every console page sits in this frame: the sidebar with the 9
// page groups (only what the role may open), the account menu, the page in a
// column on the right; under 900 px the sidebar is a drawer behind the menu
// button. It also signs out after the idle limit (a «Sei ancora qui?»
// dialog two minutes before) and shows the offline banner.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useConsole } from "@/lib/console";
import { firstRoute, locate, permissionFor, visibleNav } from "@/lib/nav";
import { Icon } from "./Icon";
import { ConfirmDialog } from "./overlays";
import { Banner, StateBlock, Toasts } from "./parts";

const WARN_BEFORE_MS = 2 * 60 * 1000;

/** Under 900 px the sidebar is a drawer: closed, it must not take the keyboard. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const m = window.matchMedia("(max-width: 899px)");
    const on = () => setNarrow(m.matches);
    queueMicrotask(on);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return narrow;
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const narrow = useNarrow();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { me, api } = useConsole();
  const [menu, setMenu] = useState(false);
  const perms = useMemo(() => new Set(me?.permissions ?? []), [me]);
  const nav = useMemo(() => visibleNav(perms), [perms]);
  const here = locate(pathname);

  const signOut = async () => {
    await api.del("/session").catch(() => undefined);
    router.replace("/sign-in");
  };

  return (
    <aside className="sidebar" data-open={open} aria-label="Menu della console" {...(narrow && !open ? { inert: true } : {})}>
      <div className="brand">
        <span style={{ color: "var(--accent)" }}>Finzy</span>
        <small>Console</small>
        <button type="button" className="icon-btn topbar-close" aria-label="Chiudi il menu" onClick={onClose} style={{ marginLeft: "auto", display: open ? undefined : "none" }}>
          <Icon name="close" size={16} />
        </button>
      </div>
      <nav className="nav">
        {me
          ? nav.map((section) => (
              <div key={section.label} className="nav-section" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span>{section.label}</span>
                {section.groups.map((g) => {
                  const active = here.group === g.id;
                  return (
                    <div key={g.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <Link className="nav-item" href={g.route} data-active={active} aria-current={active && !g.pages.length ? "page" : undefined} onClick={onClose}>
                        <Icon name={g.icon} />
                        <span style={{ flex: 1 }}>{g.label}</span>
                        {g.pages.length ? <Icon name={active ? "up" : "down"} size={16} /> : null}
                      </Link>
                      {active
                        ? g.pages.map((p) => (
                            <Link key={p.id} className="nav-sub" href={p.route} aria-current={(here.page ?? g.pages[0].id) === p.id ? "page" : undefined} onClick={onClose}>
                              {p.label}
                            </Link>
                          ))
                        : null}
                    </div>
                  );
                })}
              </div>
            ))
          : Array.from({ length: 8 }, (_, i) => <span key={i} className="skeleton" style={{ width: 110 - (i % 3) * 22, margin: "14px 12px" }} />)}
      </nav>
      <div className="account">
        {menu ? (
          <div className="menu" role="menu" style={{ left: 12, bottom: 84 }}>
            <div style={{ padding: "10px 14px" }}>
              <strong style={{ display: "block", fontSize: 14 }}>{me?.user.name}</strong>
              <span className="sub">{me?.user.email}</span>
            </div>
            <Link role="menuitem" href="/account" onClick={() => setMenu(false)}>
              <Icon name="user" size={18} /> Il mio account
            </Link>
            <button role="menuitem" type="button" onClick={signOut} style={{ borderTop: "1px solid var(--hair)" }}>
              <Icon name="logout" size={18} /> Esci
            </button>
          </div>
        ) : null}
        <button type="button" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          <span className="avatar">{me?.user.name.slice(0, 1).toUpperCase() ?? "·"}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: "block", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me?.user.name ?? "…"}</strong>
            <span className="sub" style={{ fontSize: 12, fontWeight: 600 }}>{me?.role?.label ?? ""}</span>
          </span>
          <Icon name="more" size={18} />
        </button>
      </div>
    </aside>
  );
}

const LAST_ACTIVITY_KEY = "console.lastActivity";
const KEEP_ALIVE_MS = 5 * 60 * 1000;

/** The last activity in ANY tab of the console (shared through localStorage). */
function readShared(): number {
  try {
    return Number(window.localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
}
function writeShared(t: number) {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(t));
  } catch {
    // storage blocked: this tab's own clock only
  }
}

/**
 * Idle sign-out that agrees with the server: activity in any tab counts
 * (localStorage), and a throttled GET /me keeps the server's own idle clock
 * (ConsoleSession SEEN_AT) in step while the admin types or scrolls without
 * saving. The warning shows the time left; sign-out happens once.
 */
function useIdleSignOut(minutes: number | undefined, onSignOut: () => void, keepAlive: () => void) {
  const [left, setLeft] = useState<number | null>(null);
  const local = useRef(0);
  const pinged = useRef(0);
  const done = useRef(false);
  const stay = useCallback(() => {
    const now = Date.now();
    local.current = now;
    writeShared(now);
    pinged.current = now;
    keepAlive();
    setLeft(null);
  }, [keepAlive]);
  useEffect(() => {
    if (!minutes) return;
    const now = Date.now();
    local.current = now;
    pinged.current = now;
    writeShared(now);
    const limit = minutes * 60 * 1000;
    const events = ["pointerdown", "keydown", "wheel", "scroll"] as const;
    const onActivity = () => {
      const t = Date.now();
      local.current = t;
      writeShared(t);
      if (t - pinged.current > KEEP_ALIVE_MS) {
        pinged.current = t;
        keepAlive();
      }
    };
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const t = setInterval(() => {
      const last = Math.max(local.current, readShared());
      const idle = Date.now() - last;
      if (idle >= limit) {
        if (!done.current) {
          done.current = true;
          onSignOut();
        }
      } else if (idle >= limit - WARN_BEFORE_MS) setLeft(Math.ceil((limit - idle) / 1000));
      else setLeft(null);
    }, 1000);
    return () => {
      clearInterval(t);
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [minutes, onSignOut, keepAlive]);
  return { left, stay };
}

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

export function AdminFrame({ children, banner, title }: { children: ReactNode; banner?: ReactNode; title?: string }) {
  const { me, meState, api, can } = useConsole();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const online = useOnline();
  const signOut = useCallback(() => {
    api.del("/session").catch(() => undefined);
    router.replace("/sign-in?expired=1");
  }, [api, router]);
  const keepAlive = useCallback(() => {
    api.get("/me").catch(() => undefined);
  }, [api]);
  const { left, stay } = useIdleSignOut(me?.idle_minutes, signOut, keepAlive);
  const landing = firstRoute(new Set(me?.permissions ?? []));
  const need = permissionFor(pathname);

  let page: ReactNode = children;
  let showsPage = false;
  if (meState === "error") page = <StateBlock kind="error" title="Non è stato possibile caricare la pagina" action={<button type="button" className="btn" onClick={() => location.reload()}>Riprova</button>} />;
  else if (!me || !me.two_factor.verified) page = <StateBlock kind="loading" />; // on its way to the code page
  else if (need && !can(need))
    page = (
      <StateBlock
        kind="denied"
        title="Non hai accesso a questa pagina"
        body={`Il tuo ruolo${me.role ? `, ${me.role.label},` : ""} non comprende quest’area. Se ti serve, chiedi a un super amministratore.`}
        action={<Link className="btn" href={landing}>{landing === "/" ? "Torna alla Home" : "Vai alla tua prima pagina"}</Link>}
      />
    );
  else showsPage = true;

  return (
    <div className="shell">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="Menu" aria-expanded={navOpen} onClick={() => setNavOpen(true)}>
          <Icon name="menu" size={18} />
        </button>
        <strong>{title ?? "Console"}</strong>
      </div>
      {navOpen ? <div className="scrim" style={{ zIndex: 39 }} onClick={() => setNavOpen(false)} /> : null}
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="main">
        {!online ? <Banner>Sei offline: quello che cambi non viene salvato finché non torna la connessione.</Banner> : null}
        {showsPage ? banner : null}
        <div className="content">{page}</div>
      </main>
      <Toasts />
      {left !== null ? (
        <ConfirmDialog
          title="Sei ancora qui?"
          message={`Per sicurezza tra ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} la console ti fa uscire. Quello che non hai salvato andrà perso.`}
          confirmLabel="Resta collegato"
          cancelLabel="Esci"
          kind="primary"
          safeIsConfirm
          onConfirm={stay}
          onCancel={signOut}
        />
      ) : null}
    </div>
  );
}
