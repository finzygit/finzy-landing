"use client";

// MOB-1198: what every page shares: the language (saved in localStorage, a
// per-viewer convenience), the API client with its 401/402 handlers, the
// signed-in user (GET /api/web/me) and the toasts (design decision 6: web
// confirmations are a toast top right, not the app's full-screen flash).
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createApi, type Api } from "./api.ts";
import type { Lang } from "./format.ts";
import { RESERVED, SIGN_IN, type Session } from "./guard.ts";
import { initialLang, LANG_STORAGE_KEY, translate, type TextKey, type Vars } from "./i18n.ts";
import type { Me } from "./types.ts";

export type Toast = { id: number; title: string; body?: string };

type AppState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TextKey, vars?: Vars) => string;
  api: Api;
  session: Session;
  me: Me | null;
  /** After a sign-in: read /api/web/me again. */
  reloadMe: () => Promise<Me | null>;
  signOut: () => Promise<void>;
  toasts: Toast[];
  toast: (title: string, body?: string) => void;
  dismiss: (id: number) => void;
};

const AppContext = createContext<AppState | null>(null);

function readSavedLang(): string | null {
  try {
    return window.localStorage.getItem(LANG_STORAGE_KEY);
  } catch {
    return null;
  }
}

const LANG_EVENT = "finzy-dashboard-lang";

function subscribeLang(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(LANG_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LANG_EVENT, onChange);
  };
}

const noSubscribe = () => () => undefined;

export function AppProvider({ children, api: injected }: { children: ReactNode; api?: Api }) {
  const router = useRouter();
  // Server render (static export): Italian; the browser then reads the saved choice.
  const saved = useSyncExternalStore(subscribeLang, readSavedLang, () => null);
  const browser = useSyncExternalStore(noSubscribe, () => navigator.language, () => undefined);
  const [chosen, setChosen] = useState<Lang | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [session, setSession] = useState<Session>({ status: "loading" });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToast = useRef(1);

  const api = useMemo(
    () =>
      injected ??
      createApi({
        onSignedOut: () => {
          // No navigation here: the page's guard (Shell) sends a visitor to
          // the sign-in page with ?next=, and leaves /accedi and /password alone.
          setMe(null);
          setSession({ status: "anonymous" });
        },
        onUnlimitedRequired: () => {
          setSession((s) => (s.status === "signed" ? { status: "signed", unlimited: false } : s));
          // FZW-WEB-01: a plan that lapsed mid-session shows the reserved page at the next page.
          router.replace(`${RESERVED}?scaduto=1`);
        },
      }),
    [injected, router],
  );

  const reloadMe = useCallback(async () => {
    try {
      const user = await api.get<Me>("/web/me");
      setMe(user);
      setSession({ status: "signed", unlimited: Boolean(user?.is_unlimited) });
      return user;
    } catch {
      setMe(null);
      setSession({ status: "anonymous" });
      return null;
    }
  }, [api]);

  useEffect(() => {
    let alive = true;
    api
      .get<Me>("/web/me")
      .then((user) => {
        if (!alive) return;
        setMe(user);
        setSession({ status: "signed", unlimited: Boolean(user?.is_unlimited) });
      })
      .catch(() => {
        if (!alive) return;
        setSession({ status: "anonymous" });
      });
    return () => {
      alive = false;
    };
  }, [api]);

  // The language: the choice made now, else the saved one, else the account's, else the browser's.
  const lang: Lang = chosen ?? initialLang(saved, me?.lang, browser);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setChosen(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
      window.dispatchEvent(new Event(LANG_EVENT));
    } catch {
      // storage blocked: the choice lasts for this visit only
    }
  }, []);

  const signOut = useCallback(async () => {
    await api.post("/web/logout").catch(() => undefined);
    setMe(null);
    setSession({ status: "anonymous" });
    router.replace(SIGN_IN);
  }, [api, router]);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (title: string, body?: string) => {
      const id = nextToast.current++;
      setToasts((all) => [...all.slice(-2), { id, title, body }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const t = useCallback((key: TextKey, vars?: Vars) => translate(lang, key, vars), [lang]);

  const value = useMemo<AppState>(
    () => ({ lang, setLang, t, api, session, me, reloadMe, signOut, toasts, toast, dismiss }),
    [lang, setLang, t, api, session, me, reloadMe, signOut, toasts, toast, dismiss],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside AppProvider");
  return ctx;
}

/** A context for component tests: no router, a given API, a fixed language. */
export function TestAppProvider({ children, api, lang = "it", me = null }: { children: ReactNode; api: Api; lang?: Lang; me?: Me | null }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang: () => undefined,
      t: (key, vars) => translate(lang, key, vars),
      api,
      session: me ? { status: "signed", unlimited: me.is_unlimited } : { status: "anonymous" },
      me,
      reloadMe: async () => me,
      signOut: async () => undefined,
      toasts,
      toast: (title, body) => setToasts((all) => [...all, { id: all.length + 1, title, body }]),
      dismiss: (id) => setToasts((all) => all.filter((x) => x.id !== id)),
    }),
    [lang, api, me, toasts],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export type Load<T> = { status: "loading" } | { status: "error"; error: unknown } | { status: "ready"; data: T };

/** Loads `fn` when `key` changes; `reload` runs it again (Riprova). */
export function useLoad<T>(key: string | null, fn: () => Promise<T>): Load<T> & { reload: () => void } {
  const [state, setState] = useState<{ key: string | null; load: Load<T> }>({ key, load: { status: "loading" } });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  // The latest loader, set before the load effect below runs (effects run in order).
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (key === null) return;
    let alive = true;
    fnRef
      .current()
      .then((data) => alive && setState({ key, load: { status: "ready", data } }))
      .catch((error) => alive && setState({ key, load: { status: "error", error } }));
    return () => {
      alive = false;
    };
  }, [key, tick]);

  const reload = useCallback(() => {
    setState({ key, load: { status: "loading" } });
    setTick((n) => n + 1);
  }, [key]);

  const load: Load<T> = state.key === key ? state.load : { status: "loading" };
  return { ...load, reload } as Load<T> & { reload: () => void };
}
