"use client";

// MOB-1198 (FZW-WEB-03, 09): the first tab. The first 300 characters of the
// description (link to Profilo), eight key figures (link to Statistiche),
// the three scores (link to Punteggi), and the analysts' consensus for a US
// stock (not available otherwise). With analysts the consensus is the right
// column; without, its short card sits beside the description.
import { useApp, useLoad, type Load } from "@/lib/app";
import { toNumber } from "@/lib/format";
import { formatStat, KEY_FIGURES, keyFigure } from "@/lib/stat-format";
import type { Consensus, Profile, Scores, Statistics, StockHeader } from "@/lib/types";
import { ConsensusCard, counts } from "../Consensus";
import { Card, Skeleton, Stat } from "../ui";
import { StockFoot } from "../StockFoot";
import { ScoreChips } from "./ScoresTab";

export function excerpt(text: string | null | undefined, max = 300): string | null {
  if (!text) return null;
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).trimEnd() + "…";
}

function hasAnalysts(load: Load<Consensus | null>): boolean {
  if (load.status !== "ready" || !load.data) return false;
  const k = counts(load.data);
  return k.buy + k.hold + k.sell > 0;
}

export function SummaryTab({ stock, goTab }: { stock: StockHeader; goTab: (tab: string) => void }) {
  const { api, t, lang } = useApp();
  const sym = encodeURIComponent(stock.symbol);
  const profile = useLoad(`profile:${stock.symbol}`, () => api.get<Profile>(`/dashboard/stocks/${sym}/profile`));
  const stats = useLoad(`stats:${stock.symbol}`, () => api.get<Statistics>(`/dashboard/stocks/${sym}/statistics`));
  const scores = useLoad(`scores:${stock.symbol}`, () => api.get<Scores>(`/dashboard/stocks/${sym}/scores`));
  const consensus = useLoad<Consensus | null>(`cons:${stock.symbol}`, async () => (stock.is_us ? api.get<Consensus | null>("/analyst-consensus", { symbol: stock.symbol }) : null));

  const statsData = stats.status === "ready" ? stats.data : null;
  const desc = profile.status === "ready" ? excerpt(profile.data?.description) : null;

  const about = (
    <Card title={t("about")} action={t("read_profile")} onAction={() => goTab("profilo")}>
      {profile.status === "loading" ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ) : (
        <p className={`m-0 text-body ${desc ? "text-[rgba(244,247,246,0.86)]" : "text-ink-3"}`}>{desc ?? t("na")}</p>
      )}
    </Card>
  );

  const figures = (
    <Card title={t("key_stats")} action={t("all_stats")} onAction={() => goTab("statistiche")}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KEY_FIGURES.map(([key, group, field, kind]) => (
          <Stat
            key={key}
            label={t(key)}
            na={t("na")}
            loading={stats.status === "loading"}
            value={formatStat(keyFigure(statsData, group, field), kind, statsData?.currency ?? stock.currency, lang)}
          />
        ))}
      </div>
    </Card>
  );

  const scoreCard = (
    <Card title={t("scores")} action={t("see_scores")} onAction={() => goTab("punteggi")}>
      <ScoreChips scores={scores.status === "ready" ? scores.data : null} loading={scores.status === "loading"} />
    </Card>
  );

  const cons = <ConsensusCard load={stock.is_us ? consensus : { status: "ready", data: null }} price={toNumber(stock.last_price)} currency={stock.currency} />;

  if (hasAnalysts(consensus) || (stock.is_us && consensus.status === "loading")) {
    return (
      <div className="flex flex-col gap-7">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            {about}
            {figures}
            {scoreCard}
          </div>
          {cons}
        </div>
        <StockFoot stock={stock} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {about}
        {cons}
      </div>
      {figures}
      {scoreCard}
      <StockFoot stock={stock} />
    </div>
  );
}
