"use client";

// MOB-1198 (FZW-WEB-02): the dashboard opens on the search. Name or ticker,
// stocks of the dashboard universe only; with nothing typed, the user's
// watchlist as a shortcut («Dai tuoi osservati»).
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ResultsList, StockSearch, stockHref, type ResultRow } from "@/components/Search";
import { Shell } from "@/components/Shell";
import { useApp, useLoad } from "@/lib/app";
import { watchToRow } from "@/lib/watch";
import type { WatchRow } from "@/lib/types";

function SearchHome() {
  const { api, t } = useApp();
  const router = useRouter();
  const [idle, setIdle] = useState(true);
  const onIdle = useCallback((v: boolean) => setIdle(v), []);
  const watch = useLoad("home-watch", () => api.get<WatchRow[]>("/watch-aziones", { limit: 4 }));
  const rows: ResultRow[] = watch.status === "ready" ? (watch.data ?? []).slice(0, 4).map(watchToRow) : [];

  return (
    <div className="mx-auto mt-4 flex max-w-[640px] flex-col gap-4 sm:mt-14 sm:gap-[22px]">
      <div className="flex flex-col gap-2 sm:items-center sm:text-center">
        <h1 className="m-0 text-[26px] leading-[32px] font-bold tracking-[-0.025em] text-ink sm:text-hero">{t("search_title")}</h1>
        <p className="m-0 text-body text-ink-2">{t("search_sub")}</p>
      </div>
      <StockSearch hero autoFocus onIdle={onIdle} />
      {idle && rows.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-row font-[650] text-ink-2">{t("recent")}</span>
          <div className="card overflow-hidden py-1.5" style={{ borderRadius: 18 }}>
            <ResultsList rows={rows} active={-1} onPick={(r) => router.push(stockHref(r.symbol))} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Shell search={false}>
      <SearchHome />
    </Shell>
  );
}
