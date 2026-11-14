"use client";

// MOB-1198 (FZW-WEB-08): web_watch_table. The account's watchlist (the
// app's) with last price and day change; a row opens the stock; the eye
// removes it. Empty: «Nessuno strumento osservato» and «Cerca un titolo».
import Link from "next/link";
import { useState } from "react";
import { metaLine, stockHref } from "@/components/Search";
import { Shell } from "@/components/Shell";
import { Card, ChangePill, EmptyState, ErrorState, Icon, Skeleton, SourceLine, Spinner, StockLogo } from "@/components/ui";
import { useApp, useLoad } from "@/lib/app";
import { formatMoney } from "@/lib/format";
import type { WatchRow } from "@/lib/types";
import { watchToRow } from "@/lib/watch";

function Watchlist() {
  const { api, t, lang, toast } = useApp();
  const load = useLoad("watchlist", () => api.get<WatchRow[]>("/watch-aziones", { limit: 100 }));
  const [removed, setRemoved] = useState<number[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const rows = load.status === "ready" ? (load.data ?? []).filter((r) => !removed.includes(r.id)) : [];

  async function remove(id: number) {
    setBusy(id);
    try {
      await api.del(`/watch-aziones/${id}`);
      setRemoved((all) => [...all, id]);
    } catch {
      toast(t("watch_error"));
    } finally {
      setBusy(null);
    }
  }

  let body;
  if (load.status === "loading") {
    body = (
      <div className="flex flex-col">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b border-hair py-4 last:border-b-0">
            <Skeleton className="h-9 w-9 rounded-[12px]" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    );
  } else if (load.status === "error") {
    body = <ErrorState title={t("err_title")} retry={t("retry")} onRetry={load.reload} />;
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        icon="eye"
        title={t("w_empty_t")}
        body={t("w_empty_b")}
        action={
          <Link href="/" className="raised inline-flex h-[46px] items-center rounded-control px-5 text-[16px] font-semibold text-ink">
            {t("w_empty_a")}
          </Link>
        }
      />
    );
  } else {
    const cols = "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_160px_200px] sm:gap-4";
    body = (
      <div role="table" aria-label={t("watch_title")}>
        <div role="row" className={`${cols} hidden border-b border-hair pb-3 text-meta font-semibold text-ink-2 sm:grid`}>
          <span role="columnheader">{t("w_name")}</span>
          <span role="columnheader" className="text-right">{t("w_price")}</span>
          <span role="columnheader" className="pr-14 text-right">{t("w_chg")}</span>
        </div>
        {rows.map((raw) => {
          const r = watchToRow(raw);
          return (
            <div role="row" key={raw.id} className={`${cols} border-b border-hair py-3.5 last:border-b-0 sm:py-4`}>
              <Link role="cell" href={stockHref(r.symbol)} className="flex min-w-0 items-center gap-3">
                <StockLogo symbol={r.symbol} url={r.logo_url} size={36} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-row font-semibold text-ink sm:text-body">{r.name}</span>
                  <span className="truncate text-meta text-ink-3">{metaLine(r)}</span>
                </span>
              </Link>
              <span role="cell" className="flex flex-col items-end gap-1">
                {r.last_price === null ? (
                  <span className="text-meta text-ink-3">{t("na")}</span>
                ) : (
                  <span className="tnum text-row font-semibold text-ink sm:text-body">{formatMoney(r.last_price, r.currency, lang)}</span>
                )}
                <span className="sm:hidden">
                  <ChangePill value={r.day_change_percent} lang={lang} size="sm" />
                </span>
              </span>
              <span role="cell" className="flex items-center justify-end gap-3">
                <span className="hidden sm:inline">
                  <ChangePill value={r.day_change_percent} lang={lang} />
                </span>
                <button
                  type="button"
                  aria-label={`${t("watch_on")} · ${r.symbol}`}
                  aria-pressed
                  disabled={busy === raw.id}
                  onClick={() => void remove(raw.id)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(39,204,216,0.14)] text-accent"
                >
                  {busy === raw.id ? <Spinner /> : <Icon name="eye" size={18} />}
                </button>
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px] sm:gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[28px] leading-[34px] font-bold tracking-[-0.02em] text-ink sm:text-page">{t("watch_title")}</h1>
        <p className="m-0 text-row text-ink-2 sm:text-body">{t("watch_sub")}</p>
      </div>
      <Card pad="px-[18px] py-1 sm:px-6 sm:pb-3.5 sm:pt-2.5">{body}</Card>
      <SourceLine source={t("src_td_eu")} disclaimer={t("disclaimer")} />
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <Shell>
      <Watchlist />
    </Shell>
  );
}

