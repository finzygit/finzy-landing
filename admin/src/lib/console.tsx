"use client";

// MOB-1372: the console's shared state: the API client wired to the router,
// who is signed in (GET me), what they may do, and the toasts.

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, createApi, type Api } from "./api";

export type Me = {
  user: { id: number; name: string; email: string };
  role: { id: number; key: string; label: string } | null;
  permissions: string[];
  two_factor: { confirmed: boolean; verified: boolean; recovery_left: number };
  idle_minutes: number;
};

export type Toast = { id: number; title: string; body?: string; kind?: "success" | "info" | "error" };

type ConsoleState = {
  api: Api;
  me: Me | null;
  meState: "loading" | "ready" | "error";
  reloadMe: () => Promise<void>;
  can: (perm: string) => boolean;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

const Ctx = createContext<ConsoleState | null>(null);

const PUBLIC = ["/accedi"];

export function ConsoleProvider({ children, api: injected }: { children: ReactNode; api?: Api }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const api = useMemo(() => injected ?? createApi({ onRedirect: (to) => router.replace(to) }), [injected, router]);
  const [me, setMe] = useState<Me | null>(null);
  const [meState, setMeState] = useState<ConsoleState["meState"]>("loading");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const reloadMe = useCallback(async () => {
    try {
      setMe(await api.get<Me>("/me"));
      setMeState("ready");
    } catch (e) {
      if (!(e instanceof ApiError) || (e.status !== 401 && e.status !== 403)) setMeState("error");
    }
  }, [api]);

  useEffect(() => {
    if (isPublic) return;
    let live = true;
    api.get<Me>("/me").then(
      (m) => {
        if (!live) return;
        if (!m.two_factor.confirmed) router.replace("/accedi/attiva");
        else if (!m.two_factor.verified) router.replace("/accedi/codice");
        setMe(m);
        setMeState("ready");
      },
      (e) => {
        if (live && (!(e instanceof ApiError) || (e.status !== 401 && e.status !== 403))) setMeState("error");
      },
    );
    return () => {
      live = false;
    };
  }, [api, isPublic, router]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all, { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 5000);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((x) => x.id !== id)), []);
  const can = useCallback((perm: string) => !!me?.permissions.includes(perm), [me]);

  const value = useMemo(() => ({ api, me, meState, reloadMe, can, toasts, toast, dismiss }), [api, me, meState, reloadMe, can, toasts, toast, dismiss]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConsole(): ConsoleState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConsole outside ConsoleProvider");
  return v;
}

export function useMe() {
  const { me, meState, can } = useConsole();
  return { me, state: meState, can };
}
