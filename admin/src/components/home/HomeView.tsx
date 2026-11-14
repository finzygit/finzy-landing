"use client";

// MOB-1373: the Home's content inside AdminFrame (so it mounts only once `me`
// is loaded and the second step is done). It reads GET /home at opening and
// on «Aggiorna» (decision 8: no automatic refresh); a failed refresh keeps the
// numbers and says from when they are. Each group shows only with its page's
// permission (decision 6); a role with none of the three goes on to its first
// page, a role with no page at all sees «Nessuna pagina disponibile».

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHead, StateBlock } from "@/components/shell/parts";
import { useConsole } from "@/lib/console";
import { visibleNav } from "@/lib/nav";
import { clock } from "./format";
import { AiSpendBody, Alerts, freshLine, GroupCard, type GroupState, NewsBody, UsersBody } from "./Groups";
import s from "./home.module.css";
import { T } from "./texts";
import { type AiSpend, GROUP_PERM, type GroupKey, type HomeData, isFailed, type News, type Users } from "./types";

function RefreshIcon({ busy }: { busy: boolean }) {
  return (
    <svg className={busy ? s.spin : undefined} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v5h-5" />
    </svg>
  );
}

/** Where a role that sees no group of the Home goes: its first page other than the Home. */
export function elsewhere(perms: ReadonlySet<string>): string | null {
  for (const section of visibleNav(perms)) {
    for (const g of section.groups) {
      if (g.id !== "home") return g.pages[0]?.route ?? g.route;
    }
  }
  return null;
}

function stateOf<D>(data: HomeData | null, key: GroupKey): GroupState<D> {
  const g = data?.groups[key];
  if (!data) return { kind: "loading" };
  if (!g || isFailed(g)) return { kind: "error" };
  return { kind: "ready", data: g as D };
}

export function HomeView() {
  const { api, me, can } = useConsole();
  const router = useRouter();
  const groups = useMemo(() => (Object.keys(GROUP_PERM) as GroupKey[]).filter((k) => can(GROUP_PERM[k])), [can]);
  const target = useMemo(() => (groups.length ? null : elsewhere(new Set(me?.permissions ?? []))), [groups.length, me]);

  const [data, setData] = useState<HomeData | null>(null);
  const [failed, setFailed] = useState(false); // the first load failed: no numbers at all
  const [busy, setBusy] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const busyRef = useRef(false);
  const load = useCallback(
    async (first: boolean, focusAfter?: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const d = await api.get<HomeData>("/home");
        setData(d);
        setFailed(false);
        setRefreshFailed(false);
        // The group's Riprova is gone with the error: keep the keyboard on that card.
        if (focusAfter) requestAnimationFrame(() => document.getElementById(focusAfter)?.focus());
      } catch {
        if (first) setFailed(true);
        else setRefreshFailed(true);
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [api],
  );

  // Once per opening: the router and the role do not change while the page is open.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!groups.length) {
      if (target) router.replace(target);
      return;
    }
    // Deferred like the shell's own effects: the first load starts after the render.
    queueMicrotask(() => void load(true));
  }, [groups.length, target, router, load]);

  if (!groups.length) {
    return target ? <StateBlock kind="loading" /> : <StateBlock kind="denied" title={T.deniedTitle} body={T.deniedBody} />;
  }

  const retry = () => void load(data === null);
  const retryGroup = (id: string) => () => void load(data === null, `g-${id}`);
  const head = (
    <PageHead
      title={T.title}
      sub={groups.includes("ai_spend") ? T.sub : T.subNoAi}
      actions={
        <div className={s.headRight}>
          {data && refreshFailed ? (
            <span className={s.refreshFailed} role="alert">
              {T.refreshFailed(clock(data.generated_at))}
            </span>
          ) : data ? (
            <span className={s.updated}>{T.updated(clock(data.generated_at))}</span>
          ) : null}
          {data ? (
            <button type="button" className="btn" onClick={() => !busy && retry()} aria-disabled={busy || undefined} aria-busy={busy || undefined}>
              <RefreshIcon busy={busy} />
              {T.refresh}
            </button>
          ) : null}
        </div>
      }
    />
  );

  if (failed && !data) {
    return (
      <div className={s.page}>
        {head}
        <StateBlock
          kind="error"
          title={T.pageError}
          body={T.pageErrorBody}
          action={
            <button type="button" className="btn" onClick={() => !busy && retry()} aria-disabled={busy || undefined}>
              {T.retry}
            </button>
          }
        />
      </div>
    );
  }

  const now = data?.generated_at ?? new Date().toISOString();
  const users = groups.includes("users") ? (
    <GroupCard id="users" title={T.users} icon="users" href="/utenti" go={T.goUsers} state={stateOf<Users>(data, "users")} onRetry={retryGroup("users")} retrying={busy} fresh={(d) => freshLine(d.latest_at, T.usersFresh, T.usersNone, now)}>
      {(d) => <UsersBody d={d} />}
    </GroupCard>
  ) : null;
  const news = groups.includes("news") ? (
    <GroupCard id="news" title={T.news} icon="news" href="/notizie" go={T.goNews} state={stateOf<News>(data, "news")} onRetry={retryGroup("news")} retrying={busy} fresh={(d) => freshLine(d.latest_at, T.newsFresh, T.newsNone, now)}>
      {(d) => <NewsBody d={d} />}
    </GroupCard>
  ) : null;

  return (
    <div className={s.page}>
      {head}
      {data ? <Alerts alerts={data.alerts} now={data.generated_at} /> : null}
      {groups.includes("ai_spend") ? (
        <GroupCard id="ai" title={T.ai} icon="pulse" href="/costi" go={T.goAi} state={stateOf<AiSpend>(data, "ai_spend")} onRetry={retryGroup("ai")} retrying={busy} fresh={(d) => freshLine(d.latest_at, T.aiFresh, T.aiNone, now)}>
          {(d) => <AiSpendBody d={d} now={now} />}
        </GroupCard>
      ) : null}
      {users && news ? (
        <div className={s.pair}>
          {users}
          {news}
        </div>
      ) : (
        (users ?? news)
      )}
    </div>
  );
}
